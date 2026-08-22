/**
 * Scoring pipeline.
 *
 * Every document is pre-projected into (weighted term frequencies + a concept
 * vector) at index time, so a query only costs a walk over candidate documents.
 */

import { COMPANIONSHIP_CONCEPT_IDS, conceptSimilarity, conceptsFor } from './concepts';
import type { ParsedIntent } from './intent';
import { fuzzyRatio, normalizeText, stem, STOPWORDS, words } from './tokenize';

/** Field importance. A hit in `expertise` means far more than one in `bio`. */
export const FIELD_WEIGHTS = {
  name: 3,
  title: 4,
  expertise: 5,
  topics: 4.5,
  categories: 3.5,
  services: 5,
  bio: 1,
  company: 1.5,
  location: 2,
  languages: 2,
} as const;

export type FieldName = keyof typeof FIELD_WEIGHTS;

export interface IndexedDoc<T> {
  id: string;
  item: T;
  /** stem -> summed field weight */
  termWeights: Map<string, number>;
  /** All distinct stems, for fuzzy fallback. */
  termList: string[];
  concepts: Map<string, number>;
  /** Lowercased concatenation, for phrase containment. */
  haystack: string;
  location: string;
  languages: string[];
  rating: number;
  sessions: number;
  verified: boolean;
  /** Companionship service slugs this provider offers. */
  services: string[];
}

export interface DocFields {
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  expertise?: (string | null)[] | null;
  topics?: (string | null)[] | null;
  categories?: (string | null)[] | null;
  languages?: (string | null)[] | null;
  services?: (string | null)[] | null;
  rating?: number | string | null;
  sessions?: number | null;
  verified?: boolean | null;
}

const addTerms = (
  target: Map<string, number>,
  value: unknown,
  weight: number,
  collector: string[]
) => {
  for (const word of words(value)) {
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    const key = stem(word);
    target.set(key, (target.get(key) ?? 0) + weight);
    collector.push(key);
  }
};

export function buildDoc<T>(id: string, item: T, fields: DocFields): IndexedDoc<T> {
  const termWeights = new Map<string, number>();
  const collected: string[] = [];

  addTerms(termWeights, fields.name, FIELD_WEIGHTS.name, collected);
  addTerms(termWeights, fields.title, FIELD_WEIGHTS.title, collected);
  addTerms(termWeights, fields.company, FIELD_WEIGHTS.company, collected);
  addTerms(termWeights, fields.bio, FIELD_WEIGHTS.bio, collected);
  addTerms(termWeights, fields.location, FIELD_WEIGHTS.location, collected);
  for (const v of fields.expertise ?? []) addTerms(termWeights, v, FIELD_WEIGHTS.expertise, collected);
  for (const v of fields.topics ?? []) addTerms(termWeights, v, FIELD_WEIGHTS.topics, collected);
  for (const v of fields.categories ?? []) addTerms(termWeights, v, FIELD_WEIGHTS.categories, collected);
  for (const v of fields.languages ?? []) addTerms(termWeights, v, FIELD_WEIGHTS.languages, collected);
  for (const v of fields.services ?? []) addTerms(termWeights, v, FIELD_WEIGHTS.services, collected);

  const haystack = [
    fields.name, fields.title, fields.company, fields.bio, fields.location,
    ...(fields.expertise ?? []), ...(fields.topics ?? []),
    ...(fields.categories ?? []), ...(fields.services ?? []),
  ]
    .filter(Boolean)
    .map((v) => normalizeText(v))
    .join(' · ');

  const services = (fields.services ?? []).filter(Boolean).map((s) => normalizeText(s));

  return {
    id,
    item,
    termWeights,
    termList: Array.from(new Set(collected)),
    concepts: projectConcepts(Array.from(new Set(collected)), services.length > 0),
    haystack,
    location: normalizeText(fields.location),
    languages: (fields.languages ?? []).filter(Boolean).map((l) => normalizeText(l)),
    rating: Number(fields.rating) || 0,
    sessions: Number(fields.sessions) || 0,
    verified: Boolean(fields.verified),
    services,
  };
}

/**
 * Project a provider's text onto the concept space, enforcing the service
 * boundary between companionship and expert consulting.
 *
 * A provider who offers no companionship vertical keeps every advisory concept
 * but carries none of the companionship ones, however their bio happens to be
 * worded. This is what stops a Public Speaking Coach from being scored — and
 * labelled "Matched on: Companionship" — for "someone to shop" (COMP-4).
 */
function projectConcepts(stems: string[], offersCompanionship: boolean): Map<string, number> {
  const concepts = conceptsFor(stems);
  if (offersCompanionship) return concepts;

  for (const id of COMPANIONSHIP_CONCEPT_IDS) concepts.delete(id);
  return concepts;
}

export interface ScoredDoc<T> {
  doc: IndexedDoc<T>;
  score: number;
  /** Concept labels that drove the match, for "why this result" chips. */
  matchedConcepts: string[];
  /** 0-1 share of query terms that found a home. */
  coverage: number;
}

export interface RankOptions {
  /** Inverse document frequency per stem, from the corpus. */
  idf: Map<string, number>;
  totalDocs: number;
  normA?: number;
  termMeta?: { term: string; idf: number }[];
}

/**
 * Relevance floor. Tuned so that a query with real intent never returns a
 * document that merely shares a stopword-ish token, while a bare category
 * browse (no query) still returns everything.
 */
export const MIN_SCORE = 0.12;

export function scoreDoc<T>(
  doc: IndexedDoc<T>,
  intent: ParsedIntent,
  options: RankOptions
): ScoredDoc<T> | null {
  const { terms, concepts } = intent;
  const hasQuery = terms.length > 0 || concepts.size > 0;
  if (!hasQuery) {
    return { doc, score: 0, matchedConcepts: [], coverage: 1 };
  }

  // ---- 1. lexical -------------------------------------------------------
  let lexical = 0;
  let matchedTerms = 0;
  let maxPossible = 0;

  const metaList = options.termMeta ?? terms.map((term) => ({
    term,
    idf: options.idf.get(term) ?? Math.log(1 + options.totalDocs),
  }));

  for (const { term, idf } of metaList) {
    maxPossible += idf * FIELD_WEIGHTS.expertise;

    const exact = doc.termWeights.get(term);
    if (exact) {
      // Saturating: a term repeated 10x should not dominate.
      lexical += idf * (exact / (exact + 3)) * FIELD_WEIGHTS.expertise;
      matchedTerms++;
      continue;
    }

    // Prefix match: "develop" should hit "developer" as the user types.
    let partial = 0;
    const termLen = term.length;
    for (const candidate of doc.termList) {
      if (candidate.length > termLen && termLen >= 4 && candidate.startsWith(term)) {
        partial = Math.max(partial, 0.75);
        break;
      }
    }
    // Typo tolerance, only for words long enough to be unambiguous.
    if (!partial && termLen >= 5) {
      for (const candidate of doc.termList) {
        if (Math.abs(candidate.length - termLen) <= 2 && candidate[0] === term[0]) {
          const ratio = fuzzyRatio(term, candidate);
          if (ratio >= 0.8) {
            partial = Math.max(partial, ratio * 0.6);
            break;
          }
        }
      }
    }
    if (partial) {
      const weight = doc.termWeights.get(term) ?? FIELD_WEIGHTS.bio;
      lexical += idf * partial * weight;
      matchedTerms += partial;
    }
  }

  const lexicalNorm = maxPossible > 0 ? Math.min(1, lexical / maxPossible) : 0;
  const coverage = terms.length > 0 ? matchedTerms / terms.length : 1;

  // ---- 2. semantic ------------------------------------------------------
  const semantic = conceptSimilarity(concepts, doc.concepts, options.normA);

  // ---- 3. exact phrase --------------------------------------------------
  const phrase =
    intent.raw.length >= 4 && doc.haystack.includes(normalizeText(intent.raw)) ? 1 : 0;

  // ---- 4. facet alignment ----------------------------------------------
  let facet = 0;
  if (intent.location && doc.location.includes(normalizeText(intent.location))) facet += 0.5;
  if (intent.language && doc.languages.some((l) => l.includes(normalizeText(intent.language!)))) {
    facet += 0.3;
  }
  if (intent.service && doc.services.includes(intent.service)) facet += 0.8;

  // ---- 5. quality prior (tiebreaker only) -------------------------------
  const quality =
    (Math.min(doc.rating, 5) / 5) * 0.6 +
    Math.min(doc.sessions / 200, 1) * 0.3 +
    (doc.verified ? 0.1 : 0);

  // Semantic is weighted heavily: it is the whole point of the agent. Lexical
  // keeps precision for exact skill names. Quality only separates near-ties.
  const score =
    semantic * 0.42 +
    lexicalNorm * 0.3 +
    coverage * 0.1 +
    phrase * 0.08 +
    Math.min(facet, 1) * 0.07 +
    quality * 0.03;

  if (score < MIN_SCORE) return null;

  const matchedConcepts: string[] = [];
  for (const [id, weight] of concepts) {
    if (weight < 0.5) continue;
    const docWeight = doc.concepts.get(id);
    if (docWeight && docWeight >= 0.5) matchedConcepts.push(id);
  }

  return { doc, score, matchedConcepts, coverage };
}

/** Inverse document frequency across the corpus. */
export function buildIdf<T>(docs: IndexedDoc<T>[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of doc.termList) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  const n = docs.length || 1;
  for (const [term, count] of df) {
    idf.set(term, Math.log(1 + (n - count + 0.5) / (count + 0.5)));
  }
  return idf;
}
