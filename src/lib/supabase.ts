import { createClient } from '@supabase/supabase-js'
import { supabase as supabaseClient } from '@/integrations/supabase/client'

export const supabase = supabaseClient

export const PUBLIC_SPEAKER_SELECT_FIELDS = [
  'id',
  'name',
  'full_name',
  'title',
  'bio',
  'expertise',
  'expertise_areas',
  'topics',
  'location',
  'languages',
  'hourly_rate',
  'currency',
  'rating',
  'total_reviews',
  'past_events',
  'is_verified',
  'verification_status',
  'badges',
  'image_url',
  'profile_photo_url',
  'video_url',
  'company',
  'experience_years',
  'linkedin_url',
  'website_url',
  'created_at',
  'updated_at',
].join(',');

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  user_type: 'consumer' | 'expert' | 'both'
  created_at: string
  updated_at: string
}

export type ExpertProfile = {
  id: string
  user_id: string
  title: string
  expertise_areas: string[]
  experience_years: number | null
  hourly_rate: number
  commission_rate: number
  location: string | null
  languages: string[] | null
  verification_status: 'pending' | 'verified' | 'rejected'
  rating: number
  total_sessions: number
  is_active: boolean
  created_at: string
  profiles?: Profile
  match_score?: number
}

export type Booking = {
  id: string
  user_id: string
  expert_id: string
  event_name: string
  event_date: string | null
  scheduled_at?: string | null
  duration_hours: number | null
  duration_minutes?: number | null
  original_scheduled_at?: string | null
  original_duration_minutes?: number | null
  total_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  notes: string | null
  currency: string
  status: string
  created_at: string

  speakers?: {
    name?: string | null
    full_name?: string | null
    title?: string | null
  } | null
  expert_profile?: {
    full_name: string
    title: string
  }
}

export type AvailabilitySlot = {
  id: string
  expert_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
  created_at: string
}

export type Review = {
  id: string
  booking_id: string
  reviewer_id: string
  expert_id: string
  rating: number
  comment: string | null
  created_at: string
}
