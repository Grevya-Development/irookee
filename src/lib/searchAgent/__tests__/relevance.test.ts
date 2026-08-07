import { describe, it, expect, beforeAll } from 'vitest';
import { primeCorpus, runSearchAgent, type SpeakerRow } from '../index';
import { parseIntent } from '../intent';

/**
 * Relevance suite for the semantic search agent.
 *
 * These assert MEANING, not spelling: each query is phrased the way a real user
 * would type it, deliberately sharing few or no words with the expected match.
 * The previous substring-scoring implementation failed most of them.
 */

const row = (over: Partial<SpeakerRow> & { id: string; name: string }): SpeakerRow => ({
  user_id: 'u-' + over.id,
  full_name: null,
  title: '',
  bio: '',
  company: null,
  expertise: [],
  expertise_areas: [],
  topics: [],
  languages: ['English'],
  location: 'Bangalore, India',
  hourly_rate: 0,
  rating: 4.5,
  past_events: 20,
  is_verified: true,
  verification_status: 'verified',
  video_url: null,
  experience_years: 5,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  speaker_categories: [],
  ...over,
});

const CORPUS: SpeakerRow[] = [
  row({
    id: 'hosp',
    name: 'Meera Nair',
    title: 'Hospital Companion & Patient Care Assistant',
    bio: 'I accompany patients to appointments, manage registration and queues, collect reports and see them safely home.',
    topics: ['Hospital Companion', 'Caregiver Respite'],
    location: 'Coimbatore, India',
    languages: ['Tamil', 'English'],
    rating: 4.8,
    past_events: 140,
  }),
  row({
    id: 'shop',
    name: 'Anita Rao',
    title: 'Shopping Companion',
    bio: 'Groceries, clothes and household purchases. I help carry bags and navigate busy markets.',
    topics: ['Shopping Companion'],
    location: 'Chennai, India',
  }),
  row({
    id: 'digital',
    name: 'Ravi Kumar',
    title: 'Digital Companion',
    bio: 'Patient help with smartphones, video calls, UPI payments and booking tickets online.',
    topics: ['Digital Companion'],
    location: 'Coimbatore, India',
    languages: ['Tamil', 'Hindi'],
  }),
  row({
    id: 'travel',
    name: 'Suresh Pillai',
    title: 'Travel Companion',
    bio: 'Airport and railway station assistance, luggage handling and intercity journeys.',
    topics: ['Travel Companion'],
  }),
  row({
    id: 'social',
    name: 'Lakshmi Iyer',
    title: 'Social Companion',
    bio: 'Conversation, chess, reading together and simply being present for a few hours.',
    topics: ['Social Companion', 'Recurring Companion'],
  }),
  row({
    id: 'dev',
    name: 'Arjun Mehta',
    title: 'Full-Stack Developer & Tech Lead',
    bio: 'React, Node and cloud architecture. I mentor engineers moving into senior roles.',
    expertise: ['Software Engineering', 'React', 'Node.js'],
    location: 'Bangalore, India',
    rating: 4.9,
    past_events: 210,
  }),
  row({
    id: 'startup',
    name: 'Priya Sharma',
    title: 'Startup Mentor & Angel Investor',
    bio: 'Three exits. I help early-stage founders find product-market fit and raise funding.',
    expertise: ['Startups', 'Fundraising'],
    location: 'Bangalore, India',
    rating: 4.9,
    past_events: 127,
  }),
  row({
    id: 'money',
    name: 'Deepak Verma',
    title: 'Chartered Accountant',
    bio: 'Personal tax planning, mutual funds and retirement savings.',
    expertise: ['Finance', 'Taxation'],
  }),
  row({
    id: 'career',
    name: 'Neha Gupta',
    title: 'Career Coach',
    bio: 'Resume reviews, interview preparation and switching industries.',
    expertise: ['Career Guidance', 'Interview Prep'],
  }),
];

const topIdFor = async (query: string, filters = {}) => {
  const res = await runSearchAgent(query, filters);
  return res.results[0]?.row.id;
};

beforeAll(() => primeCorpus(CORPUS));

describe('search agent — semantic matching', () => {
  it('matches intent with no shared vocabulary', async () => {
    // "hospital" never appears; the concept does.
    expect(await topIdFor('someone to take my mother to her doctor appointment')).toBe('hosp');
    expect(await topIdFor('need help buying groceries and carrying bags')).toBe('shop');
    expect(await topIdFor('my father cannot use his phone for video calls')).toBe('digital');
    expect(await topIdFor('accompany my parents to the airport')).toBe('travel');
    expect(await topIdFor('my grandmother is lonely and wants company')).toBe('social');
  });

  it('separates advisory expertise from companionship', async () => {
    expect(await topIdFor('I want to raise a seed round for my startup')).toBe('startup');
    expect(await topIdFor('help me prepare for a software engineering interview')).toBeDefined();
    expect(await topIdFor('how should I plan my retirement savings')).toBe('money');
  });

  it('tolerates typos', async () => {
    expect(await topIdFor('hspital compnion for my mother')).toBe('hosp');
    expect(await topIdFor('startupp fundrasing mentor')).toBe('startup');
  });

  it('does not return unrelated experts for a specific need', async () => {
    const res = await runSearchAgent('take my mother to the hospital');
    const ids = res.results.map((r) => r.row.id);
    expect(ids[0]).toBe('hosp');
    expect(ids).not.toContain('money');
    expect(ids).not.toContain('dev');
  });

  it('returns an empty result rather than noise for nonsense', async () => {
    const res = await runSearchAgent('zzzzqqqq xxyyzz');
    expect(res.results).toHaveLength(0);
  });

  it('explains why a result matched', async () => {
    const res = await runSearchAgent('take my mother to the hospital');
    expect(res.results[0].reasons.length).toBeGreaterThan(0);
    expect(res.results[0].reasons.join(' ')).toMatch(/hospital|elder|companion/i);
  });
});

describe('search agent — intent extraction', () => {
  it('pulls location out of the sentence instead of scoring it', () => {
    const intent = parseIntent('software developer in Coimbatore');
    expect(intent.location).toBe('coimbatore');
    expect(intent.terms).not.toContain('coimbatore');
    expect(intent.terms).toEqual(['software', 'developer']);
  });

  it('does not mangle nouns that end in -er', () => {
    // "mother" -> "moth" and "career" -> "care" made elder-care and career
    // queries match each other's experts.
    expect(parseIntent('my mother').terms).toContain('mother');
    expect(parseIntent('career change advice').terms).toContain('career');
    expect(parseIntent('engineering manager').terms).toContain('manager');
  });

  it('detects language, urgency, third-party and recurring signals', () => {
    const intent = parseIntent(
      'need a Tamil speaking female companion for my mother every week, urgent'
    );
    expect(intent.language).toBe('tamil');
    expect(intent.genderPreference).toBe('female');
    expect(intent.urgent).toBe(true);
    expect(intent.forSomeoneElse).toBe(true);
    expect(intent.recurring).toBe(true);
    expect(intent.wantsCompanionship).toBe(true);
  });

  it('identifies the companionship vertical', () => {
    expect(parseIntent('accompany dad to the bank and post office').service).toBe('errands');
    expect(parseIntent('someone to walk with mum in the park').service).toBe('outing');
    expect(parseIntent('companion for a wedding function').service).toBe('events');
  });

  it('reads a minimum rating out of the query', () => {
    expect(parseIntent('4+ star mentor').minRating).toBe(4);
    expect(parseIntent('top rated career coach').minRating).toBe(4.5);
  });

  it('does not mistake a non-place after a preposition for a location', () => {
    expect(parseIntent('mentor in the future').location).toBeUndefined();
    expect(parseIntent('help me in general').location).toBeUndefined();
  });
});

describe('search agent — filters and ordering', () => {
  it('applies an explicit location filter as a hard constraint', async () => {
    const res = await runSearchAgent('companion', { location: 'Coimbatore' });
    expect(res.results.length).toBeGreaterThan(0);
    for (const r of res.results) expect(r.row.location).toMatch(/Coimbatore/i);
  });

  it('applies a language filter', async () => {
    const res = await runSearchAgent('', { language: 'Hindi' });
    expect(res.results.map((r) => r.row.id)).toEqual(['digital']);
  });

  it('honours explicit sort over relevance', async () => {
    const res = await runSearchAgent('', { sortBy: 'sessions' });
    expect(res.results[0].row.id).toBe('dev'); // 210 sessions
  });

  it('browses everything when the query is empty', async () => {
    const res = await runSearchAgent('');
    expect(res.results.length).toBe(CORPUS.length);
  });

  it('filters by companionship service slug', async () => {
    const res = await runSearchAgent('', { service: 'hospital' });
    expect(res.results.map((r) => r.row.id)).toEqual(['hosp']);
  });
});

describe('search agent — performance', () => {
  it('serves a query from the warm index in single-digit milliseconds', async () => {
    const big: SpeakerRow[] = [];
    for (let i = 0; i < 1000; i++) {
      big.push(row({ id: `x${i}`, name: `Expert ${i}`, title: 'Career Coach', bio: 'Interview prep and resumes.' }));
    }
    primeCorpus([...CORPUS, ...big]);

    await runSearchAgent('warm up the index');
    const res = await runSearchAgent('take my mother to the hospital');

    expect(res.cached).toBe(true);
    expect(res.tookMs).toBeLessThan(50);
    expect(res.results[0].row.id).toBe('hosp');

    primeCorpus(CORPUS);
  });
});
