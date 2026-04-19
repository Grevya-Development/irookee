import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'

export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!userId) {
      console.warn("useBookings: userId not available yet")
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('expertise_bookings')
        .select(`
          *,
          speakers!expertise_bookings_expert_id_fkey (
            full_name,
            title
          )
        `)
        .eq('user_id',userId)
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
  if (userId !== undefined) {
  fetchBookings()
}
}, [userId])

  return { bookings, loading, error, refetch: fetchBookings }
}

