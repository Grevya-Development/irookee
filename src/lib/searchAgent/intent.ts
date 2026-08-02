/**
 * Query understanding.
 *
 * Turns "need a female companion to take my mother to Apollo hospital in
 * Coimbatore tomorrow" into structured facets plus the residual content terms.
 *
 * Pulling facets OUT of the free text matters as much as detecting them: left
 * in, "coimbatore" and "tomorrow" get scored against every bio and flatten the
 * ranking. Extracted, they become filters and boosts.
 */

import { conceptsForQuery, SERVICE_CONCEPTS } from './concepts';
import { stem, STOPWORDS, words } from './tokenize';

/** concept id -> companionship service slug */
const SERVICE_LOOKUP = new Map<string, string>(
  Array.from(SERVICE_CONCEPTS.entries()).map(([service, conceptId]) => [conceptId, service])
);

export interface ParsedIntent {
  /** Original query, trimmed. */
  raw: string;
  /** Content stems after facet removal — what actually gets scored. */
  terms: string[];
  /** Concept vector for the whole query. */
  concepts: Map<string, number>;
  location?: string;
  language?: string;
  /** Caller wants a companion service rather than an advisory session. */
  wantsCompanionship: boolean;
  /** Service slug when the query names one specific companionship vertical. */
  service?: string;
  /** Time-sensitive request. */
  urgent: boolean;
  /** Query is about a third party (a parent, a relative). */
  forSomeoneElse: boolean;
  genderPreference?: 'male' | 'female';
  minRating?: number;
  recurring: boolean;
}

const LANGUAGES = [
  'english', 'hindi', 'tamil', 'telugu', 'kannada', 'malayalam', 'marathi',
  'bengali', 'gujarati', 'punjabi', 'urdu', 'odia', 'assamese', 'konkani',
  'tulu', 'bhojpuri', 'sanskrit', 'french', 'german', 'spanish', 'arabic',
  'mandarin', 'japanese', 'russian', 'portuguese',
];

/**
 * Locations are detected positionally ("in <place>"), not from a fixed city
 * list — a hardcoded list silently fails for every place not in it.
 */
const LOCATION_PREPOSITIONS = ['in', 'at', 'near', 'around', 'from', 'within'];

/** Words that follow a preposition but are never places. */
const NOT_A_PLACE = new Set([
  'the', 'a', 'an', 'my', 'me', 'person', 'people', 'morning', 'evening',
  'afternoon', 'night', 'hospital', 'home', 'house', 'office', 'city', 'town',
  'india', 'need', 'order', 'case', 'time', 'future', 'general', 'touch',
  'mind', 'fact', 'advance', 'detail', 'details', 'depth', 'person',
]);

const URGENCY = [
  'urgent', 'urgently', 'asap', 'immediately', 'today', 'tonight', 'tomorrow',
  'right now', 'emergency', 'same day', 'this evening', 'this morning',
];

const THIRD_PARTY = [
  'my mother', 'my father', 'my mom', 'my mum', 'my dad', 'my parent',
  'my parents', 'my grandmother', 'my grandfather', 'my granny', 'my grandma',
  'my grandpa', 'my wife', 'my husband', 'my aunt', 'my uncle', 'my sister',
  'my brother', 'my son', 'my daughter', 'my friend', 'my relative',
  'for my', 'elderly parent', 'her', 'him',
];

const RECURRING = [
  'every week', 'weekly', 'recurring', 'regular', 'regularly', 'every day',
  'daily', 'twice a week', 'monthly', 'ongoing', 'long term', 'same companion',
  'same person',
];

const COMPANION_TRIGGERS = [
  'companion', 'companionship', 'accompany', 'escort', 'come with',
  'go with', 'take my', 'take her', 'take him', 'drop my', 'stay with',
  'sit with', 'assist my', 'help my mother', 'help my father',
];

const containsAny = (haystack: string, needles: string[]): string | undefined =>
  needles.find((n) => haystack.includes(n));

export function parseIntent(rawQuery: string): ParsedIntent {
  const raw = String(rawQuery ?? '').trim();
  const lower = raw.toLowerCase();
  const wordList = words(raw);

  // Indices consumed by a facet, so they are excluded from content terms.
  const consumed = new Set<number>();

  // ---- language ----------------------------------------------------------
  let language: string | undefined;
  for (let i = 0; i < wordList.length; i++) {
    if (LANGUAGES.includes(wordList[i])) {
      language = wordList[i];
      consumed.add(i);
      // "hindi speaking" / "hindi speaker"
      const next = wordList[i + 1];
      if (next === 'speaking' || next === 'speaker' || next === 'speakers') {
        consumed.add(i + 1);
      }
      break;
    }
  }

  // ---- location ----------------------------------------------------------
  let location: string | undefined;
  for (let i = 0; i < wordList.length - 1; i++) {
    if (!LOCATION_PREPOSITIONS.includes(wordList[i])) continue;

    // Take up to two following words as the place name ("new delhi").
    const first = wordList[i + 1];
    if (!first || NOT_A_PLACE.has(first) || STOPWORDS.has(first)) continue;
    if (LANGUAGES.includes(first)) continue;

    const second = wordList[i + 2];
    const twoWord =
      second && !NOT_A_PLACE.has(second) && !STOPWORDS.has(second) && second.length > 2
        ? `${first} ${second}`
        : undefined;

    // Prefer the single token unless the pair reads like a known compound.
    const COMPOUND_PLACES = ['new delhi', 'navi mumbai', 'new york', 'san francisco'];
    if (twoWord && COMPOUND_PLACES.includes(twoWord)) {
      location = twoWord;
      consumed.add(i).add(i + 1).add(i + 2);
    } else {
      location = first;
      consumed.add(i);
      consumed.add(i + 1);
    }
    break;
  }

  // ---- rating ------------------------------------------------------------
  let minRating: number | undefined;
  const ratingMatch = lower.match(/(\d(?:\.\d)?)\s*(?:\+|star|stars)/);
  if (ratingMatch) {
    const value = Number(ratingMatch[1]);
    if (value >= 1 && value <= 5) minRating = value;
  }
  if (/top rated|highly rated|best rated|top-rated/.test(lower)) {
    minRating = Math.max(minRating ?? 0, 4.5);
  }

  // ---- gender preference -------------------------------------------------
  let genderPreference: 'male' | 'female' | undefined;
  if (/\b(female|woman|lady|aunty)\b/.test(lower)) genderPreference = 'female';
  else if (/\b(male|man|gentleman|uncle)\b/.test(lower)) genderPreference = 'male';

  // ---- flags -------------------------------------------------------------
  const urgent = Boolean(containsAny(lower, URGENCY));
  const forSomeoneElse = Boolean(containsAny(lower, THIRD_PARTY));
  const recurring = Boolean(containsAny(lower, RECURRING));
  const wantsCompanionship = Boolean(containsAny(lower, COMPANION_TRIGGERS));

  // ---- residual content terms -------------------------------------------
  const terms: string[] = [];
  for (let i = 0; i < wordList.length; i++) {
    if (consumed.has(i)) continue;
    const word = wordList[i];
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    terms.push(stem(word));
  }

  // Concepts are derived from the FULL query, not the residual: "in Coimbatore"
  // is removed from scoring but "hospital" in the same sentence must still
  // resolve to hospital_companion.
  const conceptStems = wordList
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .map(stem);
  const concepts = conceptsForQuery(conceptStems);

  // The winning service concept, if any single vertical dominates.
  let service: string | undefined;
  let best = 0;
  for (const [id, weight] of concepts) {
    if (weight <= best) continue;
    const conceptService = SERVICE_LOOKUP.get(id);
    if (!conceptService) continue;
    best = weight;
    service = conceptService;
  }

  return {
    raw,
    terms,
    concepts,
    location,
    language,
    wantsCompanionship: wantsCompanionship || (service !== undefined && best >= 1),
    service,
    urgent,
    forSomeoneElse,
    genderPreference,
    minRating,
    recurring,
  };
}
