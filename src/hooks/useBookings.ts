import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface BookingWithExpert {
  id: string
  user_id: string
  expert_id: string
  event_name: string
  event_date: string | null
  duration_hours: number | null
  duration_minutes?: number | null
  scheduled_at?: string | null
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
    full_name?: string | null
    title: string | null
  } | null
  expert_profile?: {
    full_name: string
    title: string
  }
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
        .eq('consumer_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      const rows = (data || []) as BookingWithExpert[]
      setBookings(rows.map((booking) => ({
        ...booking,
        event_date: booking.event_date || booking.scheduled_at || null,
        duration_hours: booking.duration_hours ?? ((booking.duration_minutes || 0) / 60),
        expert_profile: {
          full_name: booking.speakers?.full_name || booking.speakers?.name || 'Expert',
          title: booking.speakers?.title || '',
        },
      })))
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
