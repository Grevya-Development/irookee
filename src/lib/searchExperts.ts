import { supabase } from '@/integrations/supabase/client'
import { ExpertProfile } from '@/types/promptpeople'

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

export async function searchExperts(rawQuery: string): Promise<ExpertProfile[]> {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  // Split into individual terms, dropping stopwords and noise. Keep meaningful
  // short terms (ai, hr, qa, ux) but require length >= 2.
  const terms = query
    .split(/[\s,]+/)
    .map(t => t.trim().replace(/[^a-z0-9'+#.]/g, ''))
    .filter(t => t.length >= 2 && !STOPWORDS.has(t))

  if (terms.length === 0) return []

  // Fetch ALL verified experts with their categories
  const { data: allExperts, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        categories ( name )
      )
    `)
    .eq('verification_status', 'verified')

  if (error || !allExperts) {
    console.error('Search error:', error)
    return []
  }

  // Score each expert against the query.
  // `relevance` reflects ACTUAL keyword matches only. The rating/session bonus
  // is kept separate so it can never, on its own, make an expert "match".
  const scored = allExperts.map(expert => {
    let score = 0
    const matchedFields: string[] = []

    const name = (expert.name || '').toLowerCase()
    const title = (expert.title || '').toLowerCase()
    const bio = (expert.bio || '').toLowerCase()
    const location = (expert.location || '').toLowerCase()
    const company = (expert.company || '').toLowerCase()
    const expertiseArr: string[] = (expert.expertise || []).map((e: string) => e.toLowerCase())
    const topicsArr: string[] = (expert.topics || []).map((t: string) => t.toLowerCase())
    const languagesArr: string[] = (expert.languages || []).map((l: string) => l.toLowerCase())
    const categoryNames: string[] = (expert.speaker_categories || [])
      .map((sc: { categories: { name: string } | null }) => sc.categories?.name?.toLowerCase() || '')
      .filter(Boolean)

    // Full query match (highest weight)
    if (title.includes(query)) { score += 50; matchedFields.push('title-exact') }
    if (name.includes(query)) { score += 40; matchedFields.push('name-exact') }
    if (expertiseArr.some(e => e.includes(query))) { score += 45; matchedFields.push('expertise-exact') }
    if (categoryNames.some(c => c.includes(query))) { score += 40; matchedFields.push('category-exact') }
    if (topicsArr.some(t => t.includes(query))) { score += 35; matchedFields.push('topic-exact') }

    // Per-term matching
    for (const term of terms) {
      // Name match
      if (name.includes(term)) { score += 15; matchedFields.push(`name:${term}`) }

      // Title match (high value - "startup mentor", "travel guide")
      if (title.includes(term)) { score += 20; matchedFields.push(`title:${term}`) }

      // Expertise array match (high value)
      if (expertiseArr.some(e => e.includes(term))) { score += 25; matchedFields.push(`expertise:${term}`) }

      // Topics match
      if (topicsArr.some(t => t.includes(term))) { score += 20; matchedFields.push(`topic:${term}`) }

      // Category name match
      if (categoryNames.some(c => c.includes(term))) { score += 20; matchedFields.push(`category:${term}`) }

      // Bio match (lower value - broad text)
      if (bio.includes(term)) { score += 8; matchedFields.push(`bio:${term}`) }

      // Location match
      if (location.includes(term)) { score += 12; matchedFields.push(`location:${term}`) }

      // Company match
      if (company.includes(term)) { score += 10; matchedFields.push(`company:${term}`) }

      // Language match
      if (languagesArr.some(l => l.includes(term))) { score += 10; matchedFields.push(`language:${term}`) }
    }

    // `score` so far is pure keyword relevance.
    const relevance = score

    // Tie-breaker bonus for rating and sessions — added ONLY for ranking,
    // never used to decide whether an expert matches.
    const ratingBonus = (Number(expert.rating) || 0) * 2 + Math.min((expert.past_events || 0) / 10, 10)

    return { expert, relevance, score: relevance + ratingBonus, matchedFields }
  })

  // Only keep experts with a real keyword match.
  const matched = scored.filter(s => s.relevance > 0)

  // Sort by total score (relevance + rating bonus), then by rating
  matched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (Number(b.expert.rating) || 0) - (Number(a.expert.rating) || 0)
  })

  // Transform to ExpertProfile format
  return matched.slice(0, 30).map(({ expert }) => ({
    id: expert.id,
    user_id: expert.user_id || '',
    full_name: expert.name || 'Expert',
    title: expert.title || '',
    bio: expert.bio || '',
    industry_expertise: expert.expertise || [],
    years_experience: expert.experience_years,
    location: expert.location,
    languages: expert.languages || [],
    hourly_rate: expert.hourly_rate,
    status: 'approved' as const,
    verification_level: 'verified' as const,
    rating: Number(expert.rating) || 0,
    total_sessions: expert.past_events || 0,
    intro_video_url: expert.video_url,
    kyc_documents: null,
    availability_timezone: null,
    is_instant_available: true,
    created_at: expert.created_at,
    updated_at: expert.updated_at,
  }))
}
