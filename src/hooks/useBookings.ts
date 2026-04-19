import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface BookingWithExpert {
  id: string
  user_id: string
  expert_id: string
  event_name: string
  event_date: string | null
  duration_hours: number | null
  total_amount: number | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  notes: string | null
  currency: string | null
  status: string | null
  meeting_link?: string | null
  created_at: string
  speakers: {
    name: string | null
    title: string | null
  } | null
}

export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<BookingWithExpert[]>([])
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
          speakers!expertise_bookings_expert_id_fkey (
            name,
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setBookings((data || []) as BookingWithExpert[])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchBookings()
    }
  }, [userId])

  return { bookings, loading, error, refetch: fetchBookings }
}
