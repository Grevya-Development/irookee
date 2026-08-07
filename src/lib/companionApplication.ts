/**
 * Companion application rules.
 *
 * The Companionship page promises "Identity verified — Every companion completes
 * ID verification before they can be booked", but "Apply as a companion" routed
 * into the generic Expert onboarding form: no companionship sub-services, no
 * in-person availability, and ID upload was optional (COMP-2). These are the
 * rules that make the promise true, kept out of the component so they can be
 * unit-tested without driving a four-step form.
 *
 * No schema change is needed. Companions are ordinary `speakers` rows whose
 * companionship verticals are declared through tags (see `servicesFor` in
 * `@/lib/searchAgent`), so the payload below writes:
 *   - `expertise` — the service names, which render as chips on the profile card
 *   - `topics`    — canonical `companionship:<slug>` tags plus the in-person
 *                   coverage and availability the expert form had nowhere to put
 */

import { COMPANION_SERVICES, SERVICE_BY_SLUG, type CompanionService } from '@/lib/companionship';
import { COMPANION_META_TAG_PREFIXES } from '@/lib/searchAgent';

const [SERVES_PREFIX, AVAILABLE_PREFIX] = COMPANION_META_TAG_PREFIXES;

/** Title-cases a metadata prefix for display, e.g. "serves:" -> "Serves". */
const label = (prefix: string) =>
  prefix.replace(':', '').replace(/^./, (c) => c.toUpperCase());

/** Day-parts a companion can commit to being somewhere in person. */
export const COMPANION_AVAILABILITY_OPTIONS = [
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
  'Weekend evenings',
  'Overnight stays',
  'Full days',
] as const;

/** Documents that satisfy the ID-verification promise. */
export const COMPANION_ID_DOCUMENTS = [
  'Aadhaar card',
  'PAN card',
  'Passport',
  "Driving licence",
  'Voter ID',
] as const;

/**
 * Declared as type aliases rather than interfaces on purpose: only aliases of
 * object literal types get TypeScript's implicit index signature, which is what
 * lets them satisfy the generated Supabase `Json` column type.
 */
export type UploadedDoc = {
  name: string;
  url: string;
  type: string;
};

export type CompanionIdDocument = UploadedDoc & { uploaded_at: string };

export type CompanionVerificationDocuments = {
  documents: CompanionIdDocument[];
  submitted_at: string;
};

export interface CompanionApplicationInput {
  fullName: string;
  email: string;
  /** Already normalised by `formatAndValidatePhone`. */
  phone: string;
  location: string;
  languages: string[];
  bio: string;
  /** Companionship verticals offered, as slugs. */
  serviceSlugs: string[];
  experienceYears: number;
  /** Areas/neighbourhoods the companion can reach in person. */
  travelAreas: string[];
  /** Day-parts from `COMPANION_AVAILABILITY_OPTIONS`. */
  availability: string[];
  /** Government ID upload. Required — this is the platform's trust pillar. */
  idDocuments: UploadedDoc[];
}

const NUMERIC_ONLY = /^[0-9\s\-_, .()]+$/;
const INVALID_SYMBOLS = /[<>={}[\]/\\^%$@#*]/;
const NAME_PATTERN = /^[\p{L}\s\-'.]+$/u;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const MIN_BIO_LENGTH = 50;

/** Splits a comma-separated free-text field into clean, de-duplicated entries. */
export const parseList = (value: string): string[] =>
  Array.from(
    new Set(
      String(value ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    )
  );

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const invalid = (error: string): ValidationResult => ({ isValid: false, error });

/**
 * Validates a companion application. Returns the first problem found so the form
 * can surface one clear message at a time.
 */
export function validateCompanionApplication(
  input: CompanionApplicationInput
): ValidationResult {
  const name = input.fullName?.trim() ?? '';
  if (!name) return invalid('Full name is required');
  if (!NAME_PATTERN.test(name)) return invalid('Full name contains invalid characters');
  if (NUMERIC_ONLY.test(name)) return invalid('Full name cannot be numeric-only');

  const email = input.email?.trim() ?? '';
  if (!EMAIL_PATTERN.test(email)) return invalid('Please enter a valid email address');

  if (!input.phone?.trim()) return invalid('A phone number is required');

  const location = input.location?.trim() ?? '';
  if (location.length < 2 || NUMERIC_ONLY.test(location)) {
    return invalid('Please enter the city you are based in');
  }
  if (INVALID_SYMBOLS.test(location)) return invalid('Location contains invalid symbols');

  if (input.languages.length === 0) return invalid('Select at least one language you speak');

  const bio = input.bio?.trim() ?? '';
  if (!bio) return invalid('Please tell people a little about yourself');
  if (bio.length < MIN_BIO_LENGTH) {
    return invalid(`Please write at least ${MIN_BIO_LENGTH} characters about yourself`);
  }
  if (INVALID_SYMBOLS.test(bio)) return invalid('Your description contains invalid symbols');

  if (input.serviceSlugs.length === 0) {
    return invalid('Choose at least one companionship service you can offer');
  }
  const unknown = input.serviceSlugs.find((slug) => !SERVICE_BY_SLUG.has(slug));
  if (unknown) return invalid(`"${unknown}" is not a companionship service`);

  const years = input.experienceYears;
  if (years === undefined || years === null || Number.isNaN(years)) {
    return invalid('Years of experience is required');
  }
  if (years < 0 || !Number.isInteger(years)) {
    return invalid('Years of experience must be a whole number');
  }

  if (input.travelAreas.length === 0) {
    return invalid('Add at least one area you can travel to in person');
  }

  if (input.availability.length === 0) {
    return invalid('Choose when you are available to be there in person');
  }

  // The trust pillar on /companionship. Unlike the expert flow, where documents
  // are optional and only earn a badge, a companion cannot be listed at all
  // without one: they meet people face to face, often alone and often frail.
  if (input.idDocuments.length === 0) {
    return invalid('Upload a government ID — every companion completes ID verification');
  }

  return { isValid: true };
}

export const servicesFromSlugs = (slugs: string[]): CompanionService[] =>
  slugs
    .map((slug) => SERVICE_BY_SLUG.get(slug))
    .filter((service): service is CompanionService => Boolean(service));

/** Service names, ordered as they appear on the Companionship page. */
export const SERVICE_NAME_OPTIONS = COMPANION_SERVICES.map((service) => service.name);

export const slugsFromServiceNames = (names: string[]): string[] =>
  COMPANION_SERVICES.filter((service) => names.includes(service.name)).map((s) => s.slug);

export type CompanionSpeakerPayload = {
  user_id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  topics: string[];
  experience_years: number;
  hourly_rate: number;
  currency: string;
  location: string;
  languages: string[];
  verification_status: string;
  is_verified: boolean;
  email: string;
  phone: string;
  verification_documents: CompanionVerificationDocuments;
};

/**
 * Builds the `speakers` row for a companion application.
 *
 * `submittedAt` is injected so the payload is deterministic under test.
 */
export function buildCompanionSpeakerPayload(
  input: CompanionApplicationInput,
  userId: string,
  submittedAt: string = new Date().toISOString()
): CompanionSpeakerPayload {
  const services = servicesFromSlugs(input.serviceSlugs);

  return {
    user_id: userId,
    name: input.fullName.trim(),
    // A companion offering one vertical gets it as their title; several reads
    // better as the umbrella. `title` is indexed by search, so it must describe
    // companionship work rather than being left blank.
    title: services.length === 1 ? services[0].name : 'Companion',
    bio: input.bio.trim(),
    expertise: services.map((service) => service.name),
    topics: [
      // Canonical, machine-readable vertical tags — what `servicesFor` reads.
      ...services.map((service) => `companionship:${service.slug}`),
      // In-person coverage and availability. The prefixes mark these as
      // descriptive metadata, so a place name can never be read as a service
      // declaration while the words stay searchable.
      ...input.travelAreas.map((area) => `${label(SERVES_PREFIX)}: ${area}`),
      ...input.availability.map((slot) => `${label(AVAILABLE_PREFIX)}: ${slot}`),
    ],
    experience_years: input.experienceYears,
    hourly_rate: 0,
    currency: 'INR',
    location: input.location.trim(),
    languages: input.languages,
    // Pending review, never auto-verified: the ID has to be checked by a human.
    verification_status: 'pending',
    is_verified: false,
    email: input.email.trim(),
    phone: input.phone,
    verification_documents: {
      documents: input.idDocuments.map((doc) => ({ ...doc, uploaded_at: submittedAt })),
      submitted_at: submittedAt,
    },
  };
}
