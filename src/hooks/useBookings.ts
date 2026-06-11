import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'

type ExpertSummary = {
  id: string
  title?: string | null
  profiles?: {
    full_name?: string | null
  } | null
}

export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('expertise_bookings' as never)
        .select('*')
        .eq('consumer_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const rows = (data || []) as Booking[]
      const expertIds = Array.from(new Set(rows.map((booking) => booking.expert_id).filter(Boolean)))
      let expertsById = new Map<string, ExpertSummary>()

      if (expertIds.length > 0) {
        const { data: experts } = await supabase
          .from('expert_profiles' as never)
          .select('id, title, profiles(full_name)')
          .in('id', expertIds)

        expertsById = new Map(
          ((experts || []) as ExpertSummary[]).map((expert) => [expert.id, expert])
        )
      }

      setBookings(rows.map((booking) => {
        const expert = expertsById.get(booking.expert_id)
        return {
          ...booking,
          event_date: booking.event_date || booking.scheduled_at || booking.created_at,
          duration_hours: booking.duration_hours ?? ((booking.duration_minutes || 0) / 60),
          expert_profile: {
            full_name: expert?.profiles?.full_name || 'Expert',
            title: expert?.title || '',
          },
        }
      }))
    } catch (err) {
      console.error('Error fetching bookings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings'
      setError(errorMessage)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return { bookings, loading, error, refetch: fetchBookings }
}
