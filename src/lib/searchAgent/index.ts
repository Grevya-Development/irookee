/**
 * irookee search agent.
 *
 * A deterministic semantic retrieval pipeline that runs entirely in the browser:
 *
 *   query -> parseIntent -> concept projection -> candidate scan -> multi-signal
 *            rank -> explained results
 *
 * Design notes
 * ------------
 * * **Semantic, not keyword.** Query and documents are both projected onto a
 *   shared concept ontology (`concepts.ts`), so "someone to take my mother to
 *   her appointment" matches a Hospital Companion with zero shared words.
 * * **Fast.** The previous implementation re-fetched the entire speakers table
 *   (plus category joins) on every keystroke and scored raw strings. Here the
 *   corpus is fetched once, cached with a TTL, de-duplicated across concurrent
 *   callers, and pre-projected into an index. A query is then a pure in-memory
 *   scan — no network, typically well under 10ms for this corpus size.
 * * **No API key required.** Ranking is deterministic and unit-testable. An LLM
 *   re-ranker can be layered on later behind a server without changing this
 *   contract.
 */

import { supabase } from '@/integrations/supabase/client';
import { CONCEPT_BY_ID } from './concepts';
import { parseIntent, type ParsedIntent } from './intent';
import {
  buildDoc,
  buildIdf,
  scoreDoc,
  type IndexedDoc,
  type ScoredDoc,
} from './rank';

export type { ParsedIntent } from './intent';

/** Row shape pulled from `speakers`. */
export interface SpeakerRow {
  id: string;
  user_id: string | null;
  name: string | null;
  full_name?: string | null;
  title: string | null;
  bio: string | null;
  company: string | null;
  expertise: string[] | null;
  expertise_areas?: string[] | null;
  topics: string[] | null;
  languages: string[] | null;
  location: string | null;
  hourly_rate: number | null;
  rating: number | string | null;
  past_events: number | null;
  is_verified: boolean | null;
  verification_status?: string | null;
  video_url: string | null;
  experience_years: number | null;
  created_at: string;
  updated_at: string;
  speaker_categories?: {
    category_id?: string | null;
    categories?: { id?: string | null; name?: string | null } | null;
  }[] | null;
}

export interface AgentFilters {
  category?: string;
  categoryId?: string;
  location?: string;
  language?: string;
  minRating?: number;
  sortBy?: 'rating' | 'sessions' | 'experience' | 'relevance';
  /** Restrict to providers offering this companionship service slug. */
  service?: string;
  /**
   * Restrict to companions — providers offering at least one companionship
   * vertical. Companionship surfaces MUST set this: experts and companions are
   * two distinct services and cross-matching them mis-sells a booking (COMP-4).
   */
  companionsOnly?: boolean;
  limit?: number;
}

export interface AgentResult {
  row: SpeakerRow;
  score: number;
  /** Human-readable reasons, e.g. ["Hospital companion", "Elder care"]. */
  reasons: string[];
}

export interface AgentResponse {
  results: AgentResult[];
  intent: ParsedIntent;
  /** Wall-clock milliseconds spent ranking (excludes any corpus fetch). */
  tookMs: number;
  /** True when results came from an already-warm corpus cache. */
  cached: boolean;
  totalCandidates: number;
}

// ---------------------------------------------------------------------------
// Corpus cache + index
// ---------------------------------------------------------------------------

interface Corpus {
  docs: IndexedDoc<SpeakerRow>[];
  idf: Map<string, number>;
  builtAt: number;
}

const CORPUS_TTL_MS = 5 * 60 * 1000;

let corpusPromise: Promise<Corpus> | null = null;
let corpus: Corpus | null = null;

const categoryNames = (row: SpeakerRow): string[] =>
  (row.speaker_categories ?? [])
    .map((sc) => sc.categories?.name)
    .filter((n): n is string => Boolean(n));

const categoryIds = (row: SpeakerRow): string[] =>
  (row.speaker_categories ?? [])
    .map((sc) => sc.category_id || sc.categories?.id)
    .filter((id): id is string => Boolean(id));

/**
 * Companionship services a provider offers.
 *
 * Stored as ordinary topic/expertise tags so no schema change is required:
 * a tag of "Hospital Companion" (or "companionship:hospital") marks the
 * provider as offering that vertical.
 */
export function servicesFor(row: SpeakerRow): string[] {
  // `title` counts as a declaration too: a provider whose title reads "Hospital
  // Companion" is one, even if they never filled in topic tags. Missing them
  // here would wrongly exclude a real companion from companionship surfaces.
  const tags = [
    row.title,
    ...(row.topics ?? []),
    ...(row.expertise ?? []),
    ...categoryNames(row),
  ];
  const found = new Set<string>();
  for (const tag of tags) {
    if (!tag) continue;
    const lower = String(tag).toLowerCase();
    const prefixed = lower.match(/^companionship:([a-z-]+)$/);
    if (prefixed) {
      found.add(prefixed[1]);
      continue;
    }
    if (COMPANION_META_TAG_PREFIXES.some((prefix) => lower.startsWith(prefix))) continue;
    for (const [slug, aliases] of SERVICE_TAG_ALIASES) {
      if (aliases.some((alias) => lower.includes(alias))) found.add(slug);
    }
  }
  return Array.from(found);
}

/**
 * Tag prefixes that carry companion metadata rather than a service declaration.
 *
 * Service detection is substring-based, so an unguarded coverage tag such as
 * "Serves: Hospital Companion Road" would otherwise declare a hospital service.
 * Tags starting with these are descriptive only — searchable, never a service.
 */
export const COMPANION_META_TAG_PREFIXES = ['serves:', 'available:'] as const;

/** Tag text that identifies each companionship vertical. */
const SERVICE_TAG_ALIASES: [string, string[]][] = [
  ['hospital', ['hospital companion', 'medical companion', 'hospital visit']],
  ['shopping', ['shopping companion', 'grocery companion']],
  ['errands', ['errand companion', 'errand runner', 'errands']],
  ['travel', ['travel companion', 'airport companion', 'station companion']],
  ['outing', ['walking companion', 'outing companion', 'walk companion']],
  ['social', ['social companion', 'conversation companion']],
  ['digital', ['digital companion', 'tech companion', 'digital help']],
  ['events', ['event companion', 'wedding companion']],
  ['caregiver-respite', ['caregiver respite', 'respite care', 'elder sitting']],
  ['recurring', ['recurring companion', 'regular companion']],
];

function indexRows(rows: SpeakerRow[]): Corpus {
  const docs = rows.map((row) =>
    buildDoc(row.id, row, {
      name: row.full_name || row.name,
      title: row.title,
      bio: row.bio,
      company: row.company,
      location: row.location,
      expertise: row.expertise?.length ? row.expertise : row.expertise_areas,
      topics: row.topics,
      categories: categoryNames(row),
      languages: row.languages,
      services: servicesFor(row),
      rating: row.rating,
      sessions: row.past_events,
      verified: row.is_verified,
    })
  );
  return { docs, idf: buildIdf(docs), builtAt: Date.now() };
}

async function fetchCorpus(): Promise<Corpus> {
  const { data, error } = await supabase
    .from('speakers')
    .select(`*, speaker_categories ( category_id, categories ( id, name ) )`)
    .or('verification_status.eq.verified,is_verified.eq.true,verification_status.is.null');

  if (error) throw error;
  return indexRows((data ?? []) as unknown as SpeakerRow[]);
}

/**
 * Load (or reuse) the indexed corpus. Concurrent callers share one request, so
 * a burst of keystrokes cannot fan out into a burst of network calls.
 */
export async function getCorpus(force = false): Promise<Corpus> {
  const fresh = corpus && Date.now() - corpus.builtAt < CORPUS_TTL_MS;
  if (!force && fresh) return corpus as Corpus;
  if (!force && corpusPromise) return corpusPromise;

  corpusPromise = fetchCorpus()
    .then((next) => {
      corpus = next;
      return next;
    })
    .finally(() => {
      corpusPromise = null;
    });

  return corpusPromise;
}

/** Drop the cache — call after a mutation that changes expert data. */
export function invalidateCorpus(): void {
  corpus = null;
  corpusPromise = null;
}

/** Test seam: index a fixed set of rows without touching the network. */
export function primeCorpus(rows: SpeakerRow[]): void {
  corpus = indexRows(rows);
  corpusPromise = null;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

const passesFilters = (
  doc: IndexedDoc<SpeakerRow>,
  filters: AgentFilters,
  intent: ParsedIntent
): boolean => {
  const category = (filters.category || filters.categoryId || '').toLowerCase();
  if (category && category !== 'all') {
    const row = doc.item;
    const ids = categoryIds(row).map((v) => v.toLowerCase());
    const names = categoryNames(row).map((v) => v.toLowerCase());
    if (!ids.includes(category) && !names.some((n) => n.includes(category))) return false;
  }

  // An explicit filter is a hard constraint; one merely inferred from the
  // sentence is only a ranking boost, so a typo in a place name cannot empty
  // the result set.
  const location = filters.location;
  if (location && !doc.location.includes(location.toLowerCase())) return false;

  const language = filters.language;
  if (language && !doc.languages.some((l) => l.includes(language.toLowerCase()))) return false;

  const minRating = filters.minRating ?? intent.minRating;
  if (minRating && doc.rating < minRating) return false;

  if (filters.service && !doc.services.includes(filters.service)) return false;

  // Hard service boundary: a companionship surface never shows an expert who
  // offers no companionship vertical, even when the corpus holds no companions
  // at all. An empty state is the correct answer there — an advisory expert with
  // a live Book Now button is a mis-sold booking (COMP-4).
  if (filters.companionsOnly && doc.services.length === 0) return false;

  return true;
};

/**
 * Run the agent.
 *
 * `query` may be empty — the agent then behaves as a filtered browse, ordered
 * by the requested sort (default: quality).
 */
export async function runSearchAgent(
  query: string,
  filters: AgentFilters = {}
): Promise<AgentResponse> {
  const hadCorpus = Boolean(corpus && Date.now() - corpus.builtAt < CORPUS_TTL_MS);
  const loaded = await getCorpus();

  const started =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const intent = parseIntent(query);
  const limit = filters.limit ?? 40;

  let normA = 0;
  for (const weight of intent.concepts.values()) {
    normA += weight * weight;
  }

  const defaultIdf = Math.log(1 + loaded.docs.length);
  const termMeta = intent.terms.map((term) => ({
    term,
    idf: loaded.idf.get(term) ?? defaultIdf,
  }));

  const rankOptions = {
    idf: loaded.idf,
    totalDocs: loaded.docs.length,
    normA,
    termMeta,
  };

  const scored: ScoredDoc<SpeakerRow>[] = [];
  for (const doc of loaded.docs) {
    if (!passesFilters(doc, filters, intent)) continue;
    const result = scoreDoc(doc, intent, rankOptions);
    if (result) scored.push(result);
  }

  const sortBy = filters.sortBy;
  const hasQuery = intent.terms.length > 0 || intent.concepts.size > 0;

  scored.sort((a, b) => {
    if (sortBy === 'rating') return b.doc.rating - a.doc.rating;
    if (sortBy === 'sessions') return b.doc.sessions - a.doc.sessions;
    if (sortBy === 'experience') {
      const ay = Number(a.doc.item.experience_years) || 0;
      const by = Number(b.doc.item.experience_years) || 0;
      return by - ay;
    }
    if (hasQuery && b.score !== a.score) return b.score - a.score;
    // No query: fall back to a stable quality ordering.
    if (b.doc.rating !== a.doc.rating) return b.doc.rating - a.doc.rating;
    return b.doc.sessions - a.doc.sessions;
  });

  const results: AgentResult[] = scored.slice(0, limit).map((s) => ({
    row: s.doc.item,
    score: Number(s.score.toFixed(4)),
    reasons: s.matchedConcepts
      .map((id) => CONCEPT_BY_ID.get(id)?.label)
      .filter((label): label is string => Boolean(label))
      .slice(0, 3),
  }));

  const tookMs =
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;

  return {
    results,
    intent,
    tookMs: Number(tookMs.toFixed(2)),
    cached: hadCorpus,
    totalCandidates: scored.length,
  };
}
