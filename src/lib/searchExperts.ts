import { supabase } from '@/integrations/supabase/client'
import { ExpertProfile, SearchFilters } from '@/types/promptpeople'

interface SpeakerCategoryRow {
  category_id?: string | null
  categories?: { id?: string | null; name?: string | null } | null
}

interface SpeakerSearchRow {
  id: string
  user_id: string | null
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
  rating: number | null
  past_events: number | null
  video_url: string | null
  experience_years: number | null
  created_at: string
  updated_at: string
  speaker_categories?: SpeakerCategoryRow[] | null
}

export interface SearchExpertsOptions extends SearchFilters {
  query?: string
  limit?: number
}

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
  full_name: expert.name || 'Expert',
  title: expert.title || '',
  bio: expert.bio || '',
  industry_expertise: getExpertise(expert),
  years_experience: expert.experience_years,
  location: expert.location,
  languages: expert.languages || [],
  hourly_rate: expert.hourly_rate,
  status: 'approved',
  verification_level: 'verified',
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
  const category = normalize(options.category)
  const location = normalize(options.location)
  const language = normalize(options.language)
  const minRating = Number(options.minRating) || 0

  if (category) {
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

const scoreExpert = (expert: SpeakerSearchRow, query: string, terms: string[]) => {
  if (!query && terms.length === 0) return 0

  let score = 0
  const name = normalize(expert.name)
  const title = normalize(expert.title)
  const bio = normalize(expert.bio)
  const company = normalize(expert.company)
  const location = normalize(expert.location)
  const expertise = getExpertise(expert).map(normalize)
  const topics = (expert.topics || []).map(normalize)
  const languages = (expert.languages || []).map(normalize)
  const categories = getCategoryNames(expert).map(normalize)

  if (title.includes(query)) score += 50
  if (name.includes(query)) score += 40
  if (expertise.some(item => item.includes(query))) score += 45
  if (categories.some(item => item.includes(query))) score += 40
  if (topics.some(item => item.includes(query))) score += 35

  for (const term of terms) {
    if (name.includes(term)) score += 15
    if (title.includes(term)) score += 20
    if (expertise.some(item => item.includes(term))) score += 25
    if (topics.some(item => item.includes(term))) score += 20
    if (categories.some(item => item.includes(term))) score += 20
    if (bio.includes(term)) score += 8
    if (location.includes(term)) score += 12
    if (company.includes(term)) score += 10
    if (languages.some(item => item.includes(term))) score += 10
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

    if (b.relevance !== a.relevance) return b.relevance - a.relevance
    if ((Number(b.expert.rating) || 0) !== (Number(a.expert.rating) || 0)) {
      return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0)
    }
    return (b.expert.past_events || 0) - (a.expert.past_events || 0)
  })
}

export async function searchExperts(optionsOrQuery: SearchExpertsOptions | string): Promise<ExpertProfile[]> {
  const options: SearchExpertsOptions =
    typeof optionsOrQuery === 'string' ? { query: optionsOrQuery } : optionsOrQuery

  const { query, terms } = normalizeTerms(options.query)
  const hasQuery = Boolean(query)

  if (hasQuery && terms.length === 0) return []

  const { data: allExperts, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        category_id,
        categories ( id, name )
      )
    `)
    .eq('verification_status', 'verified')

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
