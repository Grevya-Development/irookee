/**
 * Concept ontology for semantic matching.
 *
 * Substring/keyword matching cannot connect "take my mother to her appointment"
 * to an expert tagged "Hospital Companion" — no word overlaps. The ontology maps
 * both the query and each expert's text onto a shared concept space, so the
 * match happens at the level of meaning instead of spelling.
 *
 * Each concept lists surface forms. A form may be multi-word; those are matched
 * as phrases before single tokens, so "old age home" resolves to elder_care
 * rather than to three unrelated tokens.
 */

import { fuzzyRatio, stem } from './tokenize';

export interface Concept {
  id: string;
  /** Human label used in "why this matched" chips. */
  label: string;
  /** Words/phrases that evoke this concept. */
  forms: string[];
  /** Concepts implied by this one, with a decay weight (0-1). */
  related?: Record<string, number>;
  /** Companionship service slug this concept maps to, when applicable. */
  service?: string;
}

export const CONCEPTS: Concept[] = [
  // ---------------------------------------------------------------- care
  {
    id: 'elder_care',
    label: 'Elder care',
    forms: [
      // "senior" and "aged" are intentionally absent as bare tokens: they are
      // overwhelmingly seniority//job words in this corpus ("senior engineer",
      // "aged 5 years"), and including them made every senior developer match
      // an elder-care query. The unambiguous phrases are listed instead.
      'elderly', 'elder', 'senior citizen', 'senior citizens', 'old age',
      'old age home', 'grandmother', 'grandfather', 'granny', 'grandma',
      'grandpa', 'mother', 'father', 'mom', 'mum', 'dad', 'parent', 'parents',
      'ammi', 'amma', 'appa', 'nana', 'nani', 'geriatric', 'retiree',
      'pensioner', 'aged parent', 'ageing parent', 'aging parent',
    ],
    related: { companionship: 0.6, social_companion: 0.4, caregiver_respite: 0.5 },
  },
  {
    id: 'companionship',
    label: 'Companionship',
    forms: [
      'companion', 'companionship', 'accompany', 'accompanying', 'escort',
      'someone to come with', 'come with me', 'go with me', 'not alone',
      'company', 'buddy', 'attendant', 'support person', 'assist', 'assistance',
      'helper', 'aide',
    ],
  },
  {
    id: 'caregiver_respite',
    label: 'Caregiver respite',
    service: 'caregiver-respite',
    forms: [
      'respite', 'caregiver break', 'caregiver relief', 'relieve caregiver',
      'stay with my', 'sit with', 'few hours care', 'cover for me',
      'watch over', 'look after', 'babysit elderly', 'stay at home with',
    ],
    related: { elder_care: 0.7, companionship: 0.6 },
  },

  // -------------------------------------------------- companionship verticals
  {
    id: 'hospital_companion',
    label: 'Hospital companion',
    service: 'hospital',
    forms: [
      'hospital', 'clinic', 'doctor', 'doctors appointment', 'appointment',
      'medical', 'checkup', 'check up', 'opd', 'consultation', 'scan', 'mri',
      'x ray', 'xray', 'blood test', 'lab test', 'reports', 'discharge',
      'surgery', 'operation', 'dialysis', 'chemotherapy', 'physiotherapy',
      'pharmacy', 'medicine', 'medicines', 'prescription', 'dentist',
      'health checkup', 'diagnostic', 'admission', 'ward',
    ],
    related: { companionship: 0.7, elder_care: 0.4, travel_companion: 0.2 },
  },
  {
    id: 'shopping_companion',
    label: 'Shopping companion',
    service: 'shopping',
    forms: [
      'shopping', 'shop', 'grocery', 'groceries', 'supermarket', 'market',
      'mall', 'clothes', 'clothing', 'apparel', 'buy', 'purchase', 'store',
      'vegetables', 'provisions', 'household items', 'carry bags', 'bazaar',
      'furniture', 'electronics shopping',
    ],
    related: { companionship: 0.7, errand_companion: 0.4 },
  },
  {
    id: 'errand_companion',
    label: 'Errand companion',
    service: 'errands',
    forms: [
      'errand', 'errands', 'bank', 'banking', 'atm', 'post office',
      'government office', 'municipal office', 'passport office', 'rto',
      'aadhaar', 'aadhar', 'pan card', 'documents', 'document collection',
      'certificate', 'bill payment', 'pay bills', 'utility bill', 'service center',
      'service centre', 'insurance office', 'notary', 'registration office',
      'paperwork', 'legal work', 'tax office',
    ],
    related: { companionship: 0.7, digital_companion: 0.3 },
  },
  {
    id: 'travel_companion',
    label: 'Travel companion',
    service: 'travel',
    forms: [
      'travel', 'travelling', 'traveling', 'trip', 'journey', 'airport',
      'railway station', 'train station', 'bus stand', 'bus station', 'flight',
      'train', 'bus', 'cab', 'taxi', 'drop off', 'pick up', 'pickup',
      'intercity', 'out of station', 'another city', 'commute', 'transit',
      'boarding', 'luggage',
    ],
    related: { companionship: 0.7, elder_care: 0.3 },
  },
  {
    id: 'walking_companion',
    label: 'Walking / outing companion',
    service: 'outing',
    forms: [
      'walk', 'walking', 'morning walk', 'evening walk', 'stroll', 'park',
      'garden', 'temple', 'church', 'mosque', 'gurudwara', 'beach', 'cafe',
      'coffee', 'restaurant', 'movie', 'cinema', 'theatre', 'outing', 'outdoors',
      'fresh air', 'go outside', 'exercise walk',
    ],
    related: { companionship: 0.7, social_companion: 0.5, elder_care: 0.3 },
  },
  {
    id: 'social_companion',
    label: 'Social companion',
    service: 'social',
    forms: [
      'conversation', 'talk', 'chat', 'company at home', 'lonely', 'loneliness',
      'isolated', 'someone to talk to', 'games', 'chess', 'carrom', 'cards',
      'reading', 'read to', 'tea', 'quality time', 'spend time', 'befriend',
      'friendship', 'emotional support', 'listen',
    ],
    related: { companionship: 0.8, elder_care: 0.4 },
  },
  {
    id: 'digital_companion',
    label: 'Digital companion',
    service: 'digital',
    forms: [
      'smartphone', 'phone help', 'mobile help', 'video call', 'whatsapp',
      'online payment', 'upi', 'google pay', 'phonepe', 'paytm', 'netbanking',
      'book tickets', 'online booking', 'order online', 'app help', 'internet',
      'email', 'digital', 'technology help', 'tech help', 'setup phone',
      'online form', 'e-services',
    ],
    related: { companionship: 0.6, errand_companion: 0.3 },
  },
  {
    id: 'event_companion',
    label: 'Event companion',
    service: 'events',
    forms: [
      'wedding', 'marriage', 'function', 'ceremony', 'reception', 'engagement',
      'festival', 'religious event', 'puja', 'pooja', 'community gathering',
      'party', 'celebration', 'funeral', 'get together', 'gathering',
      'anniversary', 'birthday',
    ],
    related: { companionship: 0.7, social_companion: 0.4 },
  },
  {
    id: 'recurring_companion',
    label: 'Recurring companion',
    service: 'recurring',
    forms: [
      'every week', 'weekly', 'recurring', 'regular', 'same person', 'ongoing',
      'twice a week', 'every day', 'daily', 'routine', 'long term', 'monthly',
      'subscription', 'fixed schedule',
    ],
    related: { companionship: 0.6 },
  },

  // ------------------------------------------------------------- expertise
  {
    id: 'software',
    label: 'Software & engineering',
    forms: [
      'software', 'developer', 'engineer', 'engineering', 'programming', 'coder',
      'code', 'programmer', 'web development', 'app development', 'frontend',
      'backend', 'fullstack', 'full stack', 'react', 'javascript', 'typescript',
      'python', 'java', 'node', 'devops', 'cloud', 'aws', 'database', 'api',
      'mobile app', 'android', 'ios', 'tech', 'technology', 'it',
    ],
    related: { career: 0.3, data_ai: 0.4 },
  },
  {
    id: 'data_ai',
    label: 'Data & AI',
    forms: [
      'data science', 'data scientist', 'machine learning', 'ml', 'ai',
      'artificial intelligence', 'deep learning', 'analytics', 'data analyst',
      'statistics', 'nlp', 'computer vision', 'llm', 'big data',
    ],
    related: { software: 0.4 },
  },
  {
    id: 'startup',
    label: 'Startups & entrepreneurship',
    forms: [
      'startup', 'start up', 'entrepreneur', 'entrepreneurship', 'founder',
      'co founder', 'cofounder', 'venture', 'vc', 'angel investor', 'investor',
      'fundraising', 'funding', 'seed round', 'pitch deck', 'incubator',
      'accelerator', 'business plan', 'product market fit', 'bootstrapping',
      'equity', 'valuation',
    ],
    related: { business: 0.6, finance: 0.3 },
  },
  {
    id: 'business',
    label: 'Business & strategy',
    forms: [
      'business', 'strategy', 'consulting', 'consultant', 'operations',
      'management', 'b2b', 'sales', 'growth', 'scaling', 'partnership',
      'negotiation', 'procurement', 'supply chain',
    ],
  },
  {
    id: 'career',
    label: 'Career guidance',
    forms: [
      'career', 'career guidance', 'career advice', 'resume', 'cv',
      'interview', 'interview prep', 'job', 'job search', 'hiring',
      'recruitment', 'recruiter', 'promotion', 'switch career',
      'career change', 'placement', 'internship', 'mentor', 'mentorship',
      'coaching', 'guidance', 'linkedin profile',
    ],
    related: { business: 0.3 },
  },
  {
    id: 'finance',
    label: 'Finance & money',
    forms: [
      'finance', 'financial', 'money', 'investment', 'investing', 'mutual fund',
      'stocks', 'share market', 'trading', 'tax', 'taxation', 'gst',
      'accounting', 'audit', 'insurance', 'loan', 'mortgage', 'retirement',
      'wealth', 'budgeting', 'savings', 'chartered accountant', 'ca',
    ],
  },
  {
    id: 'design',
    label: 'Design & creative',
    forms: [
      'design', 'designer', 'ui', 'ux', 'ui/ux', 'user experience',
      'user interface', 'graphic design', 'figma', 'branding', 'logo',
      'illustration', 'creative', 'product design', 'animation', 'video editing',
      'photography', 'photographer',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & growth',
    forms: [
      'marketing', 'digital marketing', 'seo', 'sem', 'content marketing',
      'social media', 'instagram', 'advertising', 'ads', 'brand', 'pr',
      'public relations', 'copywriting', 'content writing', 'influencer',
      'campaign', 'email marketing',
    ],
    related: { business: 0.4 },
  },
  {
    id: 'health',
    label: 'Health & wellness',
    forms: [
      'health', 'doctor', 'physician', 'nutrition', 'nutritionist', 'dietician',
      'diet', 'fitness', 'trainer', 'gym', 'yoga', 'meditation', 'mental health',
      'therapist', 'therapy', 'counsellor', 'counselor', 'counselling',
      'psychologist', 'psychiatrist', 'wellness', 'physiotherapist',
      'ayurveda', 'homeopathy',
    ],
  },
  {
    id: 'education',
    label: 'Education & tutoring',
    forms: [
      'education', 'tutor', 'tutoring', 'teacher', 'teaching', 'study',
      'exam', 'coaching class', 'admission', 'college', 'university',
      'scholarship', 'study abroad', 'ielts', 'gre', 'gmat', 'upsc', 'neet',
      'jee', 'homework', 'lessons', 'language learning',
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    forms: [
      'legal', 'lawyer', 'advocate', 'attorney', 'law', 'court', 'litigation',
      'contract', 'agreement', 'property dispute', 'divorce', 'will',
      'compliance', 'trademark', 'patent',
    ],
  },
  {
    id: 'relocation',
    label: 'Relocation & housing',
    forms: [
      'relocation', 'relocate', 'moving', 'shifting', 'house hunting',
      'rental', 'rent', 'apartment', 'flat', 'accommodation', 'hostel',
      'pg', 'real estate', 'property', 'landlord', 'lease',
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup tables, built once at module load.
// ---------------------------------------------------------------------------

export const CONCEPT_BY_ID = new Map<string, Concept>(CONCEPTS.map((c) => [c.id, c]));

/** stemmed single token -> concept ids */
const TOKEN_INDEX = new Map<string, string[]>();
/** normalised multi-word phrase -> concept ids (matched before tokens) */
const PHRASE_INDEX = new Map<string, string[]>();

let maxPhraseWords = 1;

for (const concept of CONCEPTS) {
  for (const form of concept.forms) {
    const parts = form.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const key = parts.map(stem).join(' ');
      const list = PHRASE_INDEX.get(key);
      if (list) list.push(concept.id);
      else PHRASE_INDEX.set(key, [concept.id]);
      maxPhraseWords = Math.max(maxPhraseWords, parts.length);
    } else {
      const key = stem(parts[0]);
      const list = TOKEN_INDEX.get(key);
      if (list) list.push(concept.id);
      else TOKEN_INDEX.set(key, [concept.id]);
    }
  }
}

export const MAX_PHRASE_WORDS = maxPhraseWords;

/** Concept ids for a companionship service slug. */
export const SERVICE_CONCEPTS = new Map<string, string>(
  CONCEPTS.filter((c) => c.service).map((c) => [c.service as string, c.id])
);

/**
 * Every concept that asserts "this provider does companionship work" — the ten
 * verticals plus the generic umbrella they all decay into.
 *
 * Companionship and expert consulting are two distinct services, so these
 * concepts are only ever credited to a provider who actually offers a
 * companionship vertical (see `buildDoc`). Without that gate, a single
 * incidental word pulls an advisory expert across the service boundary: the
 * expert named *Pooja* matched the event_companion form "pooja", which spread to
 * `companionship` along a `related` edge, and she was then returned by — and
 * labelled with — a companionship search (COMP-4).
 *
 * Note `elder_care` is deliberately NOT in this set: advising on elder care is a
 * legitimate consulting topic, distinct from being someone's companion.
 */
export const COMPANIONSHIP_CONCEPT_IDS: ReadonlySet<string> = new Set<string>([
  ...CONCEPTS.filter((c) => c.service).map((c) => c.id),
  'companionship',
]);

/**
 * Project a token stream onto the concept space.
 *
 * Returns concept id -> weight. Directly evoked concepts score 1.0; concepts
 * reached through a `related` edge inherit the decayed weight, which is what
 * lets "my mother" (elder_care) softly favour companionship listings without
 * drowning out an exact match.
 */
export function conceptsFor(stems: string[]): Map<string, number> {
  const scores = new Map<string, number>();

  const bump = (id: string, weight: number) => {
    const current = scores.get(id) ?? 0;
    if (weight > current) scores.set(id, weight);
  };

  // Phrases first (longest window wins), so "old age home" beats "home".
  const consumed = new Set<number>();
  for (let size = Math.min(MAX_PHRASE_WORDS, stems.length); size >= 2; size--) {
    for (let i = 0; i + size <= stems.length; i++) {
      let overlaps = false;
      for (let k = i; k < i + size; k++) if (consumed.has(k)) { overlaps = true; break; }
      if (overlaps) continue;

      const key = stems.slice(i, i + size).join(' ');
      const ids = PHRASE_INDEX.get(key);
      if (!ids) continue;
      for (const id of ids) bump(id, 1);
      for (let k = i; k < i + size; k++) consumed.add(k);
    }
  }

  for (let i = 0; i < stems.length; i++) {
    if (consumed.has(i)) continue;
    const ids = TOKEN_INDEX.get(stems[i]);
    if (!ids) continue;
    for (const id of ids) bump(id, 1);
  }

  // Spread one hop along `related` edges.
  for (const [id, weight] of Array.from(scores)) {
    const related = CONCEPT_BY_ID.get(id)?.related;
    if (!related) continue;
    for (const [otherId, decay] of Object.entries(related)) {
      bump(otherId, weight * decay);
    }
  }

  return scores;
}

/**
 * Concept projection for a QUERY.
 *
 * Same as `conceptsFor`, but unmatched tokens fall back to a fuzzy lookup over
 * the concept vocabulary, so "hspital"/"startupp" still reach the right
 * concept. The fallback is query-only — running it while indexing thousands of
 * documents would cost far more than it is worth, and document text is not
 * typo-prone in the same way.
 */
export function conceptsForQuery(stems: string[]): Map<string, number> {
  const scores = conceptsFor(stems);

  const unresolved = stems.filter(
    (s) => s.length >= 5 && !TOKEN_INDEX.has(s)
  );
  if (unresolved.length === 0) return scores;

  const bump = (id: string, weight: number) => {
    const current = scores.get(id) ?? 0;
    if (weight > current) scores.set(id, weight);
  };

  for (const token of unresolved) {
    let bestIds: string[] | undefined;
    let bestRatio = 0;
    // Bucketing by first letter keeps this to a few dozen comparisons.
    for (const candidate of vocabularyBucket(token[0])) {
      const ratio = fuzzyRatio(token, candidate);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIds = TOKEN_INDEX.get(candidate);
      }
    }
    if (bestIds && bestRatio >= 0.72) {
      // Discounted: a fuzzy hit is weaker evidence than an exact one.
      for (const id of bestIds) bump(id, bestRatio * 0.9);
    }
  }

  // Re-spread related edges for anything the fuzzy pass introduced.
  for (const [id, weight] of Array.from(scores)) {
    const related = CONCEPT_BY_ID.get(id)?.related;
    if (!related) continue;
    for (const [otherId, decay] of Object.entries(related)) {
      bump(otherId, weight * decay);
    }
  }

  return scores;
}

const VOCAB_BUCKETS = new Map<string, string[]>();
function vocabularyBucket(letter: string): string[] {
  if (VOCAB_BUCKETS.size === 0) {
    for (const key of TOKEN_INDEX.keys()) {
      const bucket = VOCAB_BUCKETS.get(key[0]);
      if (bucket) bucket.push(key);
      else VOCAB_BUCKETS.set(key[0], [key]);
    }
  }
  return VOCAB_BUCKETS.get(letter) ?? [];
}

/**
 * Cosine similarity between two concept vectors.
 * 1 = same meaning, 0 = unrelated.
 */
export function conceptSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const weight of a.values()) normA += weight * weight;
  for (const weight of b.values()) normB += weight * weight;

  // Iterate the smaller map.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [id, weight] of small) {
    const other = large.get(id);
    if (other) dot += weight * other;
  }

  if (!dot) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
