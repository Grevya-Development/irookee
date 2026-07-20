import { supabase } from '@/integrations/supabase/client'
import { ExpertProfile, SearchFilters } from '@/types/promptpeople'

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
  const query = normalize(rawQuery)
  if (!query) return { query: '', terms: [] as string[] }

  const terms = query
    .split(/[\s,]+/)
    .map(term => term.trim().replace(/[^a-z0-9'+#.]/g, ''))
    .filter(term => term.length >= 2 && !STOPWORDS.has(term))

  return { query, terms }
}

const textIncludes = (value: unknown, needle: string) => normalize(value).includes(needle)

const arrayIncludes = (values: unknown[] | null | undefined, needle: string) =>
  (values || []).some(value => textIncludes(value, needle))

const getCategoryRows = (expert: SpeakerSearchRow) => expert.speaker_categories || []

const getCategoryNames = (expert: SpeakerSearchRow) =>
  getCategoryRows(expert)
    .map(row => row.categories?.name)
    .filter((name): name is string => Boolean(name))

const getCategoryIds = (expert: SpeakerSearchRow) =>
  getCategoryRows(expert)
    .map(row => row.category_id || row.categories?.id)
    .filter((id): id is string => Boolean(id))

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

const SYNONYMS: Record<string, string[]> = {
  tech: ['technology', 'software', 'developer', 'engineer', 'programming', 'code', 'coding', 'data', 'computer', 'it', 'web', 'frontend', 'backend', 'fullstack'],
  mentor: ['coach', 'mentorship', 'guide', 'advisor', 'consultant', 'teacher', 'instructor', 'trainer', 'guru'],
  design: ['ui', 'ux', 'product', 'creative', 'graphic', 'designer', 'artist', 'styling'],
  startup: ['entrepreneur', 'business', 'founder', 'co-founder', 'funding', 'seed', 'angel', 'venture'],
  career: ['resume', 'interview', 'hr', 'job', 'hiring', 'recruiting']
};

const matchTermOrSynonyms = (text: string, term: string) => {
  if (text.includes(term)) return true;
  const syns = SYNONYMS[term];
  if (syns && syns.some(syn => text.includes(syn))) return true;
  return false;
};

const scoreExpert = (expert: SpeakerSearchRow, query: string, terms: string[]) => {
  if (!query && terms.length === 0) return 0

  let score = 0
  const name = normalize(expert.full_name || expert.name)
  const title = normalize(expert.title)
  const bio = normalize(expert.bio)
  const location = normalize(expert.location)
  const company = normalize(expert.company)
  const expertiseArr = getExpertise(expert).map(normalize)
  const topicsArr = (expert.topics || []).map(normalize)
  const languagesArr = (expert.languages || []).map(normalize)
  const categoryNames = getCategoryNames(expert).map(normalize)

  if (title.includes(query)) score += 50
  if (name.includes(query)) score += 40
  if (expertiseArr.some(e => e.includes(query))) score += 45
  if (categoryNames.some(c => c.includes(query))) score += 40
  if (topicsArr.some(t => t.includes(query))) score += 35

  let matchedTermsCount = 0;

  for (const term of terms) {
    let termMatched = false;
    const fieldsToSearch = [name, title, bio, location, company, ...expertiseArr, ...topicsArr, ...languagesArr, ...categoryNames];
    if (fieldsToSearch.some(field => matchTermOrSynonyms(field, term))) {
      termMatched = true;
    }

    if (termMatched) {
      matchedTermsCount++;
      if (matchTermOrSynonyms(name, term)) score += 15
      if (matchTermOrSynonyms(title, term)) score += 20
      if (expertiseArr.some(e => matchTermOrSynonyms(e, term))) score += 25
      if (topicsArr.some(t => matchTermOrSynonyms(t, term))) score += 20
      if (categoryNames.some(c => matchTermOrSynonyms(c, term))) score += 20
      if (matchTermOrSynonyms(bio, term)) score += 8
      if (matchTermOrSynonyms(location, term)) score += 12
      if (matchTermOrSynonyms(company, term)) score += 10
      if (languagesArr.some(l => matchTermOrSynonyms(l, term))) score += 10
    }
  }

  if (terms.length > 0) {
    const coverage = matchedTermsCount / terms.length;
    score = score * (coverage * coverage);
    if (terms.length >= 2 && coverage < 0.5) {
      score = 0;
    }
  }

  return score
}

const sortExperts = (
  experts: Array<{ expert: SpeakerSearchRow; relevance: number }>,
  sortBy?: SearchFilters['sortBy'],
) => {
  return experts.sort((a, b) => {
    if (sortBy === 'rating') return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0)
    if (sortBy === 'sessions') return (b.expert.past_events || 0) - (a.expert.past_events || 0)
    if (sortBy === 'experience') return (b.expert.experience_years || 0) - (a.expert.experience_years || 0)

    const bScore = b.relevance + (Number(b.expert.rating) || 0) * 2 + Math.min((b.expert.past_events || 0) / 10, 10)
    const aScore = a.relevance + (Number(a.expert.rating) || 0) * 2 + Math.min((a.expert.past_events || 0) / 10, 10)
    if (bScore !== aScore) return bScore - aScore
    return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0)
  })
}

export async function searchExperts(optionsOrQuery: SearchExpertsOptions | string): Promise<ExpertProfile[]> {
  const options: SearchExpertsOptions =
    typeof optionsOrQuery === 'string' ? { query: optionsOrQuery } : optionsOrQuery

  const { query, terms } = normalizeTerms(options.query)
  const hasQuery = Boolean(query)

  if (hasQuery && terms.length === 0) return []

  // Fetch ALL verified or active experts with their categories
  const { data: allExperts, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        category_id,
        categories ( id, name )
      )
    `)
    .or('verification_status.eq.verified,is_verified.eq.true,verification_status.is.null')

  if (error || !allExperts) {
    console.error('Search error:', error)
    return []
  }

  const filtered = (allExperts as SpeakerSearchRow[])
    .filter(expert => matchesFilters(expert, options))
    .map(expert => ({ expert, relevance: scoreExpert(expert, query, terms) }))
    .filter(row => !hasQuery || row.relevance > 0)

  return sortExperts(filtered, options.sortBy)
    .slice(0, options.limit || 40)
    .map(({ expert }) => toExpertProfile(expert))
}
