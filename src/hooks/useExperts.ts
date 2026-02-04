import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExpertProfile } from '@/lib/supabase'

export function useExperts(expertId?: string) {
  const [expert, setExpert] = useState<ExpertProfile | null>(null)
  const [experts, setExperts] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpert = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('expert_profiles')
        .select(`
          *,
          profiles!inner(full_name, avatar_url, bio, email)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError
      setExpert(data)
    } catch (err) {
      console.error('Error fetching expert:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expert'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchExperts = async (limit = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('expert_profiles')
        .select(`
          *,
          profiles!inner(full_name, avatar_url, bio)
        `)
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      setExperts(data || [])
    } catch (err) {
      console.error('Error fetching experts:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch experts'
      setError(errorMessage)
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

