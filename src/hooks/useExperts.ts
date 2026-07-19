import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface SpeakerProfile {
  id: string
  user_id: string | null
  name: string
  title: string
  bio: string | null
  expertise: string[] | null
  image_url: string | null
  rating: number | null
  hourly_rate: number | null
  currency: string | null
  location: string | null
  languages: string[] | null
  past_events: number | null
  is_verified: boolean | null
  verification_status: string | null
  badges: string[] | null
  topics: string[] | null
  experience_years: number | null
  company: string | null
  linkedin_url: string | null
  website_url: string | null
  email?: string | null
  created_at: string
  updated_at: string
  categories?: string[]
}

export function useExperts(expertId?: string) {
  const [expert, setExpert] = useState<SpeakerProfile | null>(null)
  const [experts, setExperts] = useState<SpeakerProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpert = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('speakers')
        .select(`
          *,
          speaker_categories (
            category_id,
            categories ( id, name )
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const categoriesList = data.speaker_categories
        ? (data.speaker_categories as unknown as { categories: { name: string } | null }[])
            .map((sc) => sc.categories?.name)
            .filter(Boolean)
        : []

      setExpert({
        ...(data as unknown as Record<string, unknown>),
        categories: categoriesList,
      } as SpeakerProfile)
    } catch (err) {
      console.error('Error fetching expert:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch expert')
    } finally {
      setLoading(false)
    }
  }

  const fetchExperts = async (limit = 50) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('speakers')
        .select('*')
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      setExperts((data || []) as SpeakerProfile[])
    } catch (err) {
      console.error('Error fetching experts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch experts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expertId) {
      fetchExpert(expertId)
    } else {
      fetchExperts()
    }
  }, [expertId])

  return { expert, experts, loading, error, refetch: expertId ? () => fetchExpert(expertId) : fetchExperts }
}
