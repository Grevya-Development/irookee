import { describe, it, expect, beforeEach } from 'vitest';
import { primeCorpus, runSearchAgent, servicesFor, type SpeakerRow } from '../index';

/**
 * COMP-4 — service-boundary separation.
 *
 * Experts and Companions are two distinct services. A provider who offers no
 * companionship vertical must never be returned by a companionship search, and
 * must never be *labelled* as a companionship match anywhere.
 *
 * The production regression these tests lock down: searching "someone to shop"
 * from /companionship returned three advisory experts, each tagged
 * "Matched on: Shopping companion / Companionship" with a live Book Now button.
 * The cause was incidental concept bleed — e.g. the expert named *Pooja* Reddy
 * matched the `event_companion` form "pooja", which spread to `companionship`
 * along a `related` edge, so a D2C consultant scored as a companion.
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
  location: 'Chennai, India',
  hourly_rate: 0,
  rating: 4.6,
  past_events: 100,
  is_verified: true,
  verification_status: 'verified',
  video_url: null,
  experience_years: 9,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  speaker_categories: [],
  ...over,
});

/** The three real experts the bug report caught being mis-matched. */
const EXPERTS_ONLY: SpeakerRow[] = [
  row({
    id: 'pooja',
    name: 'Pooja Reddy',
    title: 'E-commerce & D2C Consultant',
    bio: 'Built and scaled 3 D2C brands to 100 Cr+ revenue. Expert in Shopify, Amazon marketplace and retail growth.',
    expertise: ['E-commerce', 'D2C Brands', 'Retail'],
    location: 'Hyderabad, India',
    rating: 4.8,
    past_events: 113,
  }),
  row({
    id: 'aditya',
    name: 'Aditya Joshi',
    title: 'Real Estate Investment Advisor',
    bio: 'Former HDFC executive. Expert in property investment, home loans and rental yields.',
    expertise: ['Real Estate', 'Property Investment'],
    location: 'Mumbai, India',
  }),
  row({
    id: 'lakshmi',
    name: 'Lakshmi Krishnan',
    title: 'Public Speaking Coach',
    bio: 'TEDx speaker and communication trainer. Coached 500+ professionals on public speaking and storytelling.',
    expertise: ['Public Speaking', 'Storytelling'],
    rating: 4.9,
    past_events: 234,
  }),
];

const COMPANION = row({
  id: 'anita',
  name: 'Anita Rao',
  title: 'Shopping Companion',
  bio: 'Groceries, clothes and household purchases. I help carry bags and navigate busy markets.',
  topics: ['Shopping Companion'],
});

describe('COMP-4 — companionship search never returns non-companions', () => {
  beforeEach(() => primeCorpus(EXPERTS_ONLY));

  it('returns an empty result when no companions exist on the platform', async () => {
    const res = await runSearchAgent('someone to shop', { companionsOnly: true });
    expect(res.results).toHaveLength(0);
  });

  it('returns nothing for every companionship vertical while no companions exist', async () => {
    for (const query of [
      'someone to shop',
      'take my mother to the hospital',
      'help dad with his phone',
      'accompany me to a wedding',
      'someone to walk with in the park',
    ]) {
      const res = await runSearchAgent(query, { companionsOnly: true });
      expect(res.results.map((r) => r.row.name), query).toEqual([]);
    }
  });

  it('browsing all companions is empty rather than a list of experts', async () => {
    const res = await runSearchAgent('', { companionsOnly: true });
    expect(res.results).toHaveLength(0);
  });
});

describe('COMP-4 — non-companions are never labelled as a companionship match', () => {
  beforeEach(() => primeCorpus(EXPERTS_ONLY));

  it('does not tag an advisory expert with a companionship reason', async () => {
    const res = await runSearchAgent('someone to shop');
    for (const result of res.results) {
      expect(servicesFor(result.row), `${result.row.name} offers no companionship service`).toEqual([]);
      expect(
        result.reasons.join(' | '),
        `${result.row.name} must not be labelled a companionship match`
      ).not.toMatch(/companion/i);
    }
  });

  it("does not let an expert's own name pull them into companionship", async () => {
    // "pooja" is a form of the event_companion concept (a Hindu prayer ritual).
    const res = await runSearchAgent('companion for a wedding function');
    expect(res.results.map((r) => r.row.id)).not.toContain('pooja');
  });

  it('keeps advisory concepts intact for the same experts', async () => {
    const res = await runSearchAgent('help me grow my d2c ecommerce brand');
    expect(res.results[0]?.row.id).toBe('pooja');
  });
});

describe('COMP-4 — real companions still match', () => {
  beforeEach(() => primeCorpus([...EXPERTS_ONLY, COMPANION]));

  it('returns only the companion for a companionship query', async () => {
    const res = await runSearchAgent('someone to shop', { companionsOnly: true });
    expect(res.results.map((r) => r.row.id)).toEqual(['anita']);
  });

  it('ranks the companion first even on the unscoped expert search', async () => {
    const res = await runSearchAgent('need help buying groceries and carrying bags');
    expect(res.results[0].row.id).toBe('anita');
  });

  it('still explains the companion match with companionship reasons', async () => {
    const res = await runSearchAgent('someone to shop', { companionsOnly: true });
    expect(res.results[0].reasons.join(' ')).toMatch(/shopping|companion/i);
  });

  it('derives the service from a declared title as well as from tags', () => {
    // A companion who typed their vertical as their title, with no topic tags,
    // must not be filtered out as "not a companion".
    expect(
      servicesFor(row({ id: 't', name: 'Meena', title: 'Hospital Companion' }))
    ).toEqual(['hospital']);
  });
});
