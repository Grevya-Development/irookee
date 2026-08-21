import { ExpertProfile, SearchFilters } from '@/types/promptpeople'
import { runSearchAgent } from '@/lib/searchAgent'

interface SpeakerCategoryRow {
  category_id?: string | null
  categories?: { id?: string | null; name?: string | null } | null
}

interface SpeakerSearchRow {
  id: string
  user_id: string | null
  full_name?: string | null
  name: string | null
  title: string | null
  bio: string | null
  company: string | null
  expertise: string[] | null
  expertise_areas: string[] | null
  topics: string[] | null
  languages: string[] | null
  location: string | null
  hourly_rate: number | null
  rating: number | string | null
  past_events: number | null
  is_verified: boolean | null
  badges: string[] | null
  video_url: string | null
  experience_years: number | null
  created_at: string
  updated_at: string
  speaker_categories?: SpeakerCategoryRow[] | null
}

export interface SearchExpertsOptions extends SearchFilters {
  query?: string
  categoryId?: string
  limit?: number
  /** Companionship service slug, e.g. "hospital". */
  service?: string
  /** Restrict results to verified companions (companionship surfaces only). */
  companionsOnly?: boolean
}

/**
 * Comprehensive expert search that queries across ALL relevant fields.
 * No AI dependency - pure database search with relevance scoring.
 */
// Common words that carry no search intent. Without filtering these, a phrase
// like "I'm in Coimbatore need a software developer" matches almost every
// expert because short words such as "in"/"an" are substrings of many fields.
const STOPWORDS = new Set([
  'i', "i'm", 'im', 'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and',
  'or', 'is', 'are', 'am', 'be', 'me', 'my', 'we', 'us', 'you', 'your', 'need',
  'needs', 'want', 'wants', 'looking', 'look', 'find', 'get', 'with', 'who', 'can',
  'help', 'someone', 'some', 'any', 'please', 'would', 'like', 'near', 'around',
  'from', 'this', 'that', 'have', 'has', 'about',
])

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

const normalizeTerms = (rawQuery?: string) => {
  if (!rawQuery) return []
  return rawQuery
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
}

const textIncludes = (value: unknown, needle: string) => normalize(value).includes(needle)

const arrayIncludes = (values: unknown[] | null | undefined, needle: string) =>
  (values || []).some(value => textIncludes(value, needle))

const getCategoryNames = (expert: SpeakerSearchRow): string[] => {
  if (!expert.speaker_categories) return []
  return expert.speaker_categories
    .map(sc => sc.categories?.name)
    .filter((name): name is string => Boolean(name))
}

const getCategoryIds = (expert: SpeakerSearchRow): string[] => {
  if (!expert.speaker_categories) return []
  return expert.speaker_categories
    .map(sc => sc.categories?.id)
    .filter((id): id is string => Boolean(id))
}

const getExpertise = (expert: SpeakerSearchRow) =>
  expert.expertise?.length ? expert.expertise : expert.expertise_areas || []

const toExpertProfile = (expert: SpeakerSearchRow): ExpertProfile => ({
  id: expert.id,
  user_id: expert.user_id || '',
  full_name: expert.full_name || expert.name || 'Expert',
  title: expert.title || '',
  bio: expert.bio || '',
  industry_expertise: getExpertise(expert),
  years_experience: expert.experience_years,
  location: expert.location,
  languages: expert.languages || [],
  hourly_rate: expert.hourly_rate,
  status: 'approved' as const,
  verification_level: expert.is_verified ? ('verified' as const) : ('basic' as const),
  is_verified: Boolean(expert.is_verified),
  badges: Array.isArray(expert.badges) ? expert.badges : [],
  rating: Number(expert.rating) || 0,
  total_sessions: expert.past_events || 0,
  intro_video_url: expert.video_url,
  kyc_documents: null,
  availability_timezone: null,
  is_instant_available: true,
  created_at: expert.created_at,
  updated_at: expert.updated_at,
})

const matchesFilters = (expert: SpeakerSearchRow, options: SearchExpertsOptions) => {
  const category = normalize(options.category || options.categoryId)
  const location = normalize(options.location)
  const language = normalize(options.language)
  const minRating = Number(options.minRating) || 0

  if (category && category !== 'all') {
    const categoryIds = getCategoryIds(expert).map(normalize)
    const categoryNames = getCategoryNames(expert).map(normalize)
    const categoryMatches =
      categoryIds.includes(category) ||
      categoryNames.some(name => name.includes(category))

    if (!categoryMatches) return false
  }

  if (location && !textIncludes(expert.location, location)) return false
  if (language && !arrayIncludes(expert.languages, language)) return false
  if (minRating > 0 && (Number(expert.rating) || 0) < minRating) return false

  return true
}

const SYNONYM_GROUPS = [
  ['tech', 'technology', 'software', 'developer', 'engineer', 'programming', 'code', 'coding', 'data', 'computer', 'it', 'web', 'frontend', 'backend', 'fullstack'],
  ['mentor', 'coach', 'mentorship', 'guide', 'advisor', 'consultant', 'teacher', 'instructor', 'trainer', 'guru'],
  ['design', 'designer', 'creative', 'artist', 'styling'],
  ['ui', 'ux', 'user interface', 'user experience', 'figma'],
  ['graphic', 'graphics', 'illustration', 'illustrator', 'photoshop', 'vector', 'logo'],
  ['product', 'product design', 'interaction design', 'product designer'],
  ['startup', 'entrepreneur', 'business', 'founder', 'co-founder', 'funding', 'seed', 'angel', 'venture'],
  ['career', 'resume', 'interview', 'hr', 'job', 'hiring', 'recruiting']
];

const SYNONYM_MAP: Record<string, string[]> = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_MAP[word] = group.filter(w => w !== word);
  }
}

const MIN_RELEVANCE_THRESHOLD = 20;

const matchTerm = (text: string, term: string): boolean => {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedText || !normalizedTerm) return false;

  let index = normalizedText.indexOf(normalizedTerm);
  while (index !== -1) {
    const charBefore = index > 0 ? normalizedText[index - 1] : ' ';
    const charAfter = index + normalizedTerm.length < normalizedText.length ? normalizedText[index + normalizedTerm.length] : ' ';

    const isBoundary = (char: string) => /[\s,.\-()&/|\\_]/.test(char);
    if (isBoundary(charBefore) && isBoundary(charAfter)) {
      return true;
    }
    index = normalizedText.indexOf(normalizedTerm, index + 1);
  }
  return false;
};

const matchToken = (fieldValue: string, token: string) => {
  const normalizedField = normalize(fieldValue);
  const normalizedToken = normalize(token);
  if (!normalizedField || !normalizedToken) return { exact: false, prefix: false };

  const words = normalizedField.split(/[\s,.\-()&/|\\_]+/);
  let exact = false;
  let prefix = false;

  for (const word of words) {
    if (word === normalizedToken) {
      exact = true;
    } else if (word.startsWith(normalizedToken)) {
      prefix = true;
    }
  }

  return { exact, prefix };
};

const scoreExpert = (expert: SpeakerSearchRow, query: string, terms: string[]) => {
  if (!query && terms.length === 0) return 0;

  let score = 0;
  const matches: string[] = [];
  const name = normalize(expert.full_name || expert.name);
  const title = normalize(expert.title);
  const bio = normalize(expert.bio);
  const location = normalize(expert.location);
  const company = normalize(expert.company);
  const expertiseArr = getExpertise(expert).map(normalize);
  const topicsArr = (expert.topics || []).map(normalize);
  const languagesArr = (expert.languages || []).map(normalize);
  const categoryNames = getCategoryNames(expert).map(normalize);

  // 1. Phrase / Full Query matches (Weighted highest)
  if (matchTerm(title, query)) { score += 60; matches.push(`full query match in title (+60)`); }
  if (expertiseArr.some(e => matchTerm(e, query))) { score += 50; matches.push(`full query match in expertise (+50)`); }
  if (categoryNames.some(c => matchTerm(c, query))) { score += 40; matches.push(`full query match in category (+40)`); }
  if (matchTerm(name, query)) { score += 30; matches.push(`full query match in name (+30)`); }
  if (matchTerm(bio, query)) { score += 15; matches.push(`full query match in bio (+15)`); }

  let matchedTermsCount = 0;

  for (const term of terms) {
    let termMatched = false;
    let termScore = 0;
    const termMatches: string[] = [];

    // Fields list with priority weights
    const fields = [
      { name: 'title', value: title, exactW: 30, prefW: 15 },
      { name: 'expertise', values: expertiseArr, exactW: 30, prefW: 15 },
      { name: 'category', values: categoryNames, exactW: 20, prefW: 10 },
      { name: 'name', value: name, exactW: 15, prefW: 8 },
      { name: 'topic', values: topicsArr, exactW: 10, prefW: 5 },
      { name: 'bio', value: bio, exactW: 10, prefW: 5 },
      { name: 'company', value: company, exactW: 8, prefW: 4 },
      { name: 'location', value: location, exactW: 8, prefW: 4 },
      { name: 'language', values: languagesArr, exactW: 8, prefW: 4 }
    ];

    for (const field of fields) {
      if (field.values) {
        for (const val of field.values) {
          const { exact, prefix } = matchToken(val, term);
          if (exact) {
            termScore += field.exactW;
            termMatches.push(`exact match in ${field.name}("${val}") (+${field.exactW})`);
            termMatched = true;
          } else if (prefix) {
            termScore += field.prefW;
            termMatches.push(`prefix match in ${field.name}("${val}") (+${field.prefW})`);
            termMatched = true;
          }
        }
      } else if (field.value) {
        const { exact, prefix } = matchToken(field.value, term);
        if (exact) {
          termScore += field.exactW;
          termMatches.push(`exact match in ${field.name} ("${field.value}") (+${field.exactW})`);
          termMatched = true;
        } else if (prefix) {
          termScore += field.prefW;
          termMatches.push(`prefix match in ${field.name} ("${field.value}") (+${field.prefW})`);
          termMatched = true;
        }
      }
    }

    // Synonym match (only if no direct match was found in the fields)
    if (!termMatched) {
      const syns = SYNONYM_MAP[term];
      if (syns) {
        for (const syn of syns) {
          for (const field of fields) {
            if (field.values) {
              for (const val of field.values) {
                const { exact } = matchToken(val, syn);
                if (exact) {
                  const synW = Math.round(field.exactW * 0.4); // Synonyms weighted lower
                  termScore += synW;
                  termMatches.push(`synonym "${syn}" of "${term}" matched in ${field.name}("${val}") (+${synW})`);
                  termMatched = true;
                }
              }
            } else if (field.value) {
              const { exact } = matchToken(field.value, syn);
              if (exact) {
                const synW = Math.round(field.exactW * 0.4);
                termScore += synW;
                termMatches.push(`synonym "${syn}" of "${term}" matched in ${field.name}("${field.value}") (+${synW})`);
                termMatched = true;
              }
            }
          }
        }
      }
    }

    if (termMatched) {
      matchedTermsCount++;
      score += termScore;
      matches.push(...termMatches);
    }
  }

  // Coverage scaling
  if (terms.length > 0) {
    const coverage = matchedTermsCount / terms.length;
    score = score * (coverage * coverage);
    matches.push(`coverage: ${coverage} (matched ${matchedTermsCount}/${terms.length})`);
    if (terms.length >= 2 && coverage < 0.5) {
      score = 0;
      matches.push('score reset to 0 due to low coverage (< 50%)');
    }
  }

  if (process.env.NODE_ENV === 'development' && score > 0) {
    console.log(`[Search match for ${expert.full_name || expert.name || 'Expert'}] Query: "${query}", Score: ${score}, Reasons:`, matches);
  }

  return score;
};

const sortExperts = (
  experts: Array<{ expert: SpeakerSearchRow; relevance: number }>,
  sortBy?: SearchFilters['sortBy'],
) => {
  return experts.sort((a, b) => {
    if (sortBy === 'rating') return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0);
    if (sortBy === 'sessions') return (b.expert.past_events || 0) - (a.expert.past_events || 0);
    if (sortBy === 'experience') return (b.expert.experience_years || 0) - (a.expert.experience_years || 0);

    const bScore = b.relevance + (Number(b.expert.rating) || 0) * 2 + Math.min((b.expert.past_events || 0) / 10, 10);
    const aScore = a.relevance + (Number(a.expert.rating) || 0) * 2 + Math.min((a.expert.past_events || 0) / 10, 10);
    if (bScore !== aScore) return bScore - aScore;
    return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0);
  });
};

/**
 * Public search entry point.
 *
 * Delegates to the semantic search agent (`@/lib/searchAgent`), which matches on
 * meaning rather than substrings and serves queries from a cached in-memory
 * index instead of re-fetching the whole speakers table on every keystroke.
 * The signature and return type are unchanged, so existing call sites keep
 * working.
 */
export async function searchExperts(
  optionsOrQuery: SearchExpertsOptions | string
): Promise<ExpertProfile[]> {
  const results = await searchExpertsDetailed(optionsOrQuery);
  return results.map((r) => r.profile);
}

export interface DetailedSearchResult {
  profile: ExpertProfile;
  /** 0-1 relevance from the agent. */
  score: number;
  /** Concept labels explaining the match, for "why this result" chips. */
  reasons: string[];
}

/** Same search, but keeps the agent's score and match explanation. */
export async function searchExpertsDetailed(
  optionsOrQuery: SearchExpertsOptions | string
): Promise<DetailedSearchResult[]> {
  const options: SearchExpertsOptions =
    typeof optionsOrQuery === 'string' ? { query: optionsOrQuery } : optionsOrQuery;

  try {
    const response = await runSearchAgent(options.query || '', {
      category: options.category,
      categoryId: options.categoryId,
      location: options.location,
      language: options.language,
      minRating: options.minRating,
      sortBy: options.sortBy,
      service: options.service,
      companionsOnly: options.companionsOnly,
      limit: options.limit || 40,
    });

    return response.results.map((r) => ({
      profile: toExpertProfile(r.row as unknown as SpeakerSearchRow),
      score: r.score,
      reasons: r.reasons,
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
