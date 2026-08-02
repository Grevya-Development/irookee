/**
 * Text normalisation for the search agent.
 *
 * Kept deliberately small and allocation-light: this runs over the whole expert
 * corpus when the index is built and over the query on every keystroke.
 */

/** Words that carry no retrieval intent. */
export const STOPWORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'any', 'anyone', 'are', 'around', 'as', 'at',
  'be', 'been', 'but', 'by', 'can', 'could', 'do', 'does', 'find', 'for', 'from',
  'get', 'give', 'go', 'has', 'have', 'help', 'her', 'here', 'him', 'his', 'how',
  'i', "i'm", 'im', 'in', 'is', 'it', 'like', 'look', 'looking', 'me', 'my',
  'need', 'needed', 'needs', 'of', 'on', 'once', 'one', 'or', 'our', 'out',
  'please', 'searching', 'seeking', 'she', 'should', 'so', 'some', 'someone',
  'that', 'the', 'their', 'them', 'there', 'they', 'this', 'to', 'up', 'us',
  'want', 'wanted', 'wants', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'who', 'whom', 'will', 'with', 'would', 'you', 'your',
]);

/**
 * Very light suffix stemmer. A full Porter stemmer is overkill here and mangles
 * domain nouns ("caring" -> "car"), so we only fold the endings that actually
 * cause misses in this dataset.
 */
export function stem(word: string): string {
  if (word.length <= 3) return word;

  // Irregulars and domain words a suffix rule would damage.
  const IRREGULAR: Record<string, string> = {
    children: 'child',
    elderly: 'elder',
    seniors: 'senior',
    people: 'person',
    women: 'woman',
    men: 'man',
    business: 'business',
    wellness: 'wellness',
    fitness: 'fitness',
    illness: 'illness',
    address: 'address',
    caring: 'care',
    nursing: 'nurse',
    shopping: 'shop',
    walking: 'walk',
    banking: 'bank',
    coding: 'code',
    driving: 'drive',
    writing: 'write',
    running: 'run',
    training: 'train',
    planning: 'plan',
    booking: 'book',
    meetings: 'meeting',
    analytics: 'analytic',
  };
  if (IRREGULAR[word]) return IRREGULAR[word];

  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ses') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) {
    return word.slice(0, -1);
  }
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  // Deliberately no generic "-er" rule: it destroys meaning far more often than
  // it helps here ("mother" -> "moth", "career" -> "care", "manager" -> "manag").
  // Agent-noun variants like developer/development are listed explicitly in the
  // concept ontology, and prefix matching in rank.ts covers the rest.
  return word;
}

export const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    // strip combining accents so "café" matches "cafe"
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Split into raw word forms, preserving tech tokens like c++, node.js, ui/ux. */
export function words(value: unknown): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9'+#./]+/)
    .map((w) => w.replace(/^['.]+|['.]+$/g, ''))
    .filter(Boolean);
}

export interface TokenizeResult {
  /** Content-bearing stems, stopwords removed. */
  terms: string[];
  /** Every word in order, stopwords included — used for phrase matching. */
  raw: string[];
}

export function tokenize(value: unknown): TokenizeResult {
  const raw = words(value);
  const terms: string[] = [];
  for (const word of raw) {
    if (word.length < 2) continue;
    if (STOPWORDS.has(word)) continue;
    terms.push(stem(word));
  }
  return { terms, raw };
}

/**
 * Character trigrams, used for typo tolerance ("companionshp" ~ "companionship").
 * Padded so short words still produce comparable grams.
 */
export function trigrams(word: string): string[] {
  const padded = `  ${word} `;
  const out: string[] = [];
  for (let i = 0; i < padded.length - 2; i++) out.push(padded.slice(i, i + 3));
  return out;
}

/** Dice coefficient over trigram sets: 1 = identical, 0 = nothing in common. */
export function fuzzyRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  // Length guard: "cat" vs "caterpillar" should not score highly.
  if (Math.abs(a.length - b.length) > Math.max(4, Math.min(a.length, b.length))) return 0;

  const ga = trigrams(a);
  const gb = new Set(trigrams(b));
  let hits = 0;
  for (const g of ga) if (gb.has(g)) hits++;
  return (2 * hits) / (ga.length + gb.size);
}
