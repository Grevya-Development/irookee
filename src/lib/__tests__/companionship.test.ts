import { describe, it, expect, beforeAll } from 'vitest';
import { COMPANION_SERVICES, getCompanionService, SERVICE_BY_SLUG } from '../companionship';
import { primeCorpus, runSearchAgent, servicesFor, type SpeakerRow } from '../searchAgent';
import { parseIntent } from '../searchAgent/intent';

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
  past_events: 30,
  is_verified: true,
  verification_status: 'verified',
  video_url: null,
  experience_years: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  speaker_categories: [],
  ...over,
});

describe('companionship taxonomy', () => {
  it('defines all ten services from the spec', () => {
    expect(COMPANION_SERVICES).toHaveLength(10);
    expect(COMPANION_SERVICES.map((s) => s.slug).sort()).toEqual(
      [
        'caregiver-respite', 'digital', 'errands', 'events', 'hospital',
        'outing', 'recurring', 'shopping', 'social', 'travel',
      ].sort()
    );
  });

  it('gives every service the fields the UI depends on', () => {
    for (const service of COMPANION_SERVICES) {
      expect(service.name, service.slug).toBeTruthy();
      expect(service.tagline, service.slug).toBeTruthy();
      expect(service.description.length, service.slug).toBeGreaterThan(30);
      expect(service.includes.length, service.slug).toBeGreaterThanOrEqual(4);
      // lucide icons are forwardRef components (objects), not plain functions.
      expect(service.icon, service.slug).toBeTruthy();
      expect(['function', 'object'], service.slug).toContain(typeof service.icon);
      expect(service.defaultDurationMinutes, service.slug).toBeGreaterThan(0);
      expect(service.profileTag, service.slug).toBeTruthy();
    }
  });

  it('uses unique slugs and profile tags', () => {
    expect(new Set(COMPANION_SERVICES.map((s) => s.slug)).size).toBe(10);
    expect(new Set(COMPANION_SERVICES.map((s) => s.profileTag)).size).toBe(10);
    expect(SERVICE_BY_SLUG.size).toBe(10);
  });

  it('resolves a slug and rejects an unknown one', () => {
    expect(getCompanionService('hospital')?.name).toBe('Hospital Companion');
    expect(getCompanionService('not-a-service')).toBeUndefined();
    expect(getCompanionService(undefined)).toBeUndefined();
  });
});

describe('companionship profile tagging', () => {
  it('derives services from ordinary profile tags, needing no schema change', () => {
    expect(
      servicesFor(row({ id: '1', name: 'A', topics: ['Hospital Companion'] }))
    ).toContain('hospital');

    expect(
      servicesFor(row({ id: '2', name: 'B', expertise: ['Digital Companion'] }))
    ).toContain('digital');
  });

  it('supports the explicit companionship: prefix', () => {
    expect(
      servicesFor(row({ id: '3', name: 'C', topics: ['companionship:caregiver-respite'] }))
    ).toEqual(['caregiver-respite']);
  });

  it('detects several services on one profile', () => {
    const services = servicesFor(
      row({
        id: '4',
        name: 'D',
        topics: ['Hospital Companion', 'Travel Companion'],
        expertise: ['Errand Companion'],
      })
    );
    expect(services.sort()).toEqual(['errands', 'hospital', 'travel']);
  });

  it('does not tag an ordinary expert as a companion', () => {
    expect(
      servicesFor(
        row({ id: '5', name: 'E', title: 'Startup Mentor', expertise: ['Fundraising'] })
      )
    ).toEqual([]);
  });

  it('every service tag round-trips to its own slug', () => {
    for (const service of COMPANION_SERVICES) {
      const derived = servicesFor(row({ id: service.slug, name: 'X', topics: [service.profileTag] }));
      expect(derived, `${service.profileTag} should map to ${service.slug}`).toContain(service.slug);
    }
  });
});

describe('companionship search integration', () => {
  const CORPUS = [
    row({ id: 'hosp', name: 'Meera', title: 'Hospital Companion', topics: ['Hospital Companion'] }),
    row({ id: 'digi', name: 'Ravi', title: 'Digital Companion', topics: ['Digital Companion'] }),
    row({ id: 'resp', name: 'Kala', title: 'Caregiver Respite', topics: ['Caregiver Respite'] }),
    row({ id: 'dev', name: 'Arjun', title: 'Software Engineer', expertise: ['React'] }),
  ];

  beforeAll(() => primeCorpus(CORPUS));

  it('lists only companions offering the requested service', async () => {
    const res = await runSearchAgent('', { service: 'hospital' });
    expect(res.results.map((r) => r.row.id)).toEqual(['hosp']);
  });

  it('returns nothing for a service no one offers yet, rather than unrelated people', async () => {
    const res = await runSearchAgent('', { service: 'events' });
    expect(res.results).toHaveLength(0);
  });

  it('routes a natural-language companionship need to the right vertical', () => {
    expect(parseIntent('someone to sit with my mother while I am at work').service)
      .toBe('caregiver-respite');
    expect(parseIntent('help dad make a video call to my sister').service).toBe('digital');
  });
});
