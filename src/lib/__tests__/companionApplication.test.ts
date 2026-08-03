import { describe, it, expect } from 'vitest';
import {
  buildCompanionSpeakerPayload,
  validateCompanionApplication,
  parseList,
  slugsFromServiceNames,
  SERVICE_NAME_OPTIONS,
  COMPANION_AVAILABILITY_OPTIONS,
  type CompanionApplicationInput,
} from '../companionApplication';
import { COMPANION_SERVICES } from '../companionship';
import { servicesFor, type SpeakerRow } from '../searchAgent';

/**
 * COMP-2 — the companion application must capture what companionship work
 * actually needs: which verticals, where they can go in person, and a verified
 * government ID (which the generic expert form treats as optional).
 */

const valid = (over: Partial<CompanionApplicationInput> = {}): CompanionApplicationInput => ({
  fullName: 'Meera Nair',
  email: 'meera@example.com',
  phone: '+919966827110',
  location: 'Coimbatore, India',
  languages: ['Tamil', 'English'],
  bio: 'I have spent six years helping elderly neighbours to appointments and the market, and I am patient and reliable.',
  serviceSlugs: ['hospital', 'shopping'],
  experienceYears: 6,
  travelAreas: ['Saibaba Colony', 'Peelamedu'],
  availability: ['Weekday mornings'],
  idDocuments: [{ name: 'aadhaar.pdf', url: 'https://x/aadhaar.pdf', type: 'application/pdf' }],
  ...over,
});

describe('COMP-2 — companion application requires companionship-specific facts', () => {
  it('accepts a complete application', () => {
    expect(validateCompanionApplication(valid())).toEqual({ isValid: true });
  });

  it('requires at least one companionship sub-service', () => {
    const result = validateCompanionApplication(valid({ serviceSlugs: [] }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/companionship service/i);
  });

  it('rejects a sub-service that is not a real vertical', () => {
    const result = validateCompanionApplication(valid({ serviceSlugs: ['massage'] }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/not a companionship service/i);
  });

  it('requires the in-person areas the expert form had no field for', () => {
    const result = validateCompanionApplication(valid({ travelAreas: [] }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/area you can travel to/i);
  });

  it('requires in-person availability', () => {
    const result = validateCompanionApplication(valid({ availability: [] }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/when you are available/i);
  });

  it('refuses to accept a companion without a government ID', () => {
    // The expert flow lets documents be skipped. /companionship promises every
    // companion completes ID verification before they can be booked.
    const result = validateCompanionApplication(valid({ idDocuments: [] }));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/government id/i);
  });

  it('still enforces the ordinary identity and contact rules', () => {
    expect(validateCompanionApplication(valid({ fullName: '12345' })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ email: 'not-an-email' })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ phone: '' })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ languages: [] })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ bio: 'too short' })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ experienceYears: -1 })).isValid).toBe(false);
    expect(validateCompanionApplication(valid({ experienceYears: 2.5 })).isValid).toBe(false);
  });
});

describe('COMP-2 — the saved profile is discoverable as a companion', () => {
  const payload = buildCompanionSpeakerPayload(valid(), 'user-1', '2026-08-03T00:00:00Z');

  const asRow = (): SpeakerRow =>
    ({
      id: 'c1',
      user_id: payload.user_id,
      name: payload.name,
      full_name: payload.name,
      title: payload.title,
      bio: payload.bio,
      company: null,
      expertise: payload.expertise,
      expertise_areas: null,
      topics: payload.topics,
      languages: payload.languages,
      location: payload.location,
      hourly_rate: 0,
      rating: 0,
      past_events: 0,
      is_verified: false,
      verification_status: payload.verification_status,
      video_url: null,
      experience_years: payload.experience_years,
      created_at: '2026-08-03T00:00:00Z',
      updated_at: '2026-08-03T00:00:00Z',
      speaker_categories: [],
    }) as SpeakerRow;

  it('tags the chosen verticals so the companion appears under each service', () => {
    expect(servicesFor(asRow()).sort()).toEqual(['hospital', 'shopping']);
  });

  it('writes canonical machine-readable service tags', () => {
    expect(payload.topics).toContain('companionship:hospital');
    expect(payload.topics).toContain('companionship:shopping');
  });

  it('records in-person coverage and availability without a schema change', () => {
    expect(payload.topics).toContain('Serves: Saibaba Colony');
    expect(payload.topics).toContain('Serves: Peelamedu');
    expect(payload.topics).toContain('Available: Weekday mornings');
  });

  it('does not let an area name masquerade as a service tag', () => {
    const tricky = buildCompanionSpeakerPayload(
      valid({ serviceSlugs: ['social'], travelAreas: ['Hospital Companion Road'] }),
      'user-2',
      '2026-08-03T00:00:00Z'
    );
    expect(servicesFor({ ...asRow(), title: tricky.title, expertise: tricky.expertise, topics: tricky.topics })).toEqual(['social']);
  });

  it('shows the services as profile chips', () => {
    expect(payload.expertise).toEqual(['Hospital Companion', 'Shopping Companion']);
  });

  it('titles a single-service companion with that service', () => {
    const one = buildCompanionSpeakerPayload(valid({ serviceSlugs: ['hospital'] }), 'u', 'now');
    expect(one.title).toBe('Hospital Companion');
  });

  it('never self-verifies — a human reviews the ID', () => {
    expect(payload.verification_status).toBe('pending');
    expect(payload.is_verified).toBe(false);
    expect(payload.verification_documents.documents).toHaveLength(1);
    expect(payload.verification_documents.documents[0].uploaded_at).toBe('2026-08-03T00:00:00Z');
  });

  it('keeps companionship sessions free while the platform grows', () => {
    expect(payload.hourly_rate).toBe(0);
  });

  it('round-trips every one of the ten services', () => {
    for (const service of COMPANION_SERVICES) {
      const single = buildCompanionSpeakerPayload(
        valid({ serviceSlugs: [service.slug] }),
        'u',
        'now'
      );
      expect(
        servicesFor({ ...asRow(), title: single.title, expertise: single.expertise, topics: single.topics }),
        `${service.name} must be discoverable under /companionship/${service.slug}`
      ).toContain(service.slug);
    }
  });
});

describe('COMP-2 — form helpers', () => {
  it('offers all ten services and maps their names back to slugs', () => {
    expect(SERVICE_NAME_OPTIONS).toHaveLength(10);
    expect(slugsFromServiceNames(['Hospital Companion', 'Recurring Companion'])).toEqual([
      'hospital',
      'recurring',
    ]);
    expect(slugsFromServiceNames(['Nonsense'])).toEqual([]);
  });

  it('parses a comma-separated area list, trimming and de-duplicating', () => {
    expect(parseList(' Peelamedu , Gandhipuram ,, Peelamedu ')).toEqual([
      'Peelamedu',
      'Gandhipuram',
    ]);
    expect(parseList('')).toEqual([]);
  });

  it('offers concrete in-person availability slots', () => {
    expect(COMPANION_AVAILABILITY_OPTIONS.length).toBeGreaterThan(3);
    expect(COMPANION_AVAILABILITY_OPTIONS).toContain('Weekend evenings');
  });
});
