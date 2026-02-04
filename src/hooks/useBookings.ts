import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'

export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('expertise_bookings')
        .select(`
          *,
          expert_profiles!expert_id (
            *,
            profiles!inner(full_name, avatar_url)
          )
        `)
        .or(`consumer_id.eq.${userId},expert_profiles.user_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { bookings, loading, error, refetch: fetchBookings }
}

