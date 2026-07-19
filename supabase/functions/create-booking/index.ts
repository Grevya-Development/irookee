import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const activeStatuses = ['pending', 'confirmed', 'in_progress']

const rangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA < endB && startB < endA

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { expertId, scheduledAt, durationMinutes, consumerNotes } = await req.json()
    
    if (!expertId || !scheduledAt || !durationMinutes) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: expertId, scheduledAt, durationMinutes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    const duration = Number(durationMinutes)

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'Please choose a future time slot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      return new Response(
        JSON.stringify({ error: 'Duration must be greater than zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    )

    const serviceSupabase = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : supabase

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get expert details - support both speakers and expert_profiles tables
    let expert = null
    let expertError = null

    const { data: speakerData, error: speakerErr } = await supabase
      .from('speakers')
      .select('hourly_rate, user_id, verification_status')
      .eq('id', expertId)
      .maybeSingle()

    if (speakerData) {
      expert = {
        hourly_rate: speakerData.hourly_rate || 0,
        commission_rate: 15.00,
        user_id: speakerData.user_id,
        is_active: true,
        verification_status: speakerData.verification_status || 'verified'
      }
    } else {
      const { data: profileData, error: profileErr } = await supabase
        .from('expert_profiles')
        .select('hourly_rate, commission_rate, user_id, is_active, verification_status')
        .eq('id', expertId)
        .maybeSingle()

      if (profileData) {
        expert = profileData
      } else {
        expertError = speakerErr || profileErr || new Error('Expert not found')
      }
    }

    if (expertError || !expert) {
      return new Response(
        JSON.stringify({ error: 'Expert not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expert.is_active || (expert.verification_status !== 'verified' && expert.verification_status !== 'pending')) {
      return new Response(
        JSON.stringify({ error: 'Expert is not available for booking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestedEnd = new Date(scheduledDate.getTime() + duration * 60 * 1000)

    // Check overlaps across both expertise_bookings and bookings (legacy) tables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allExisting: any[] = []

    const { data: existingCurrent, error: existingBookingsError } = await serviceSupabase
      .from('expertise_bookings')
      .select('id, scheduled_at, event_date, duration_minutes, duration_hours, status')
      .eq('expert_id', expertId)
      .in('status', activeStatuses)

    if (existingBookingsError) throw existingBookingsError
    if (existingCurrent) {
      allExisting.push(...existingCurrent)
    }

    try {
      const { data: existingLegacy } = await serviceSupabase
        .from('bookings')
        .select('id, scheduled_at, duration_minutes, status')
        .eq('expert_id', expertId)
        .in('status', ['pending', 'confirmed', 'in_progress'])

      if (existingLegacy) {
        allExisting.push(...existingLegacy)
      }
    } catch (err) {
      console.log('Failed to fetch legacy bookings in edge function:', err.message)
    }

    const overlapsExistingBooking = allExisting.some((booking) => {
      const startVal = booking.scheduled_at || booking.event_date
      if (!startVal) return false

      const existingStart = new Date(startVal)
      if (Number.isNaN(existingStart.getTime())) return false

      const existingDuration = Number(booking.duration_minutes) || Number(booking.duration_hours || 0) * 60 || 60
      const existingEnd = new Date(existingStart.getTime() + existingDuration * 60 * 1000)
      return rangesOverlap(scheduledDate, requestedEnd, existingStart, existingEnd)
    })

    if (overlapsExistingBooking) {
      return new Response(
        JSON.stringify({ error: 'That time slot is already booked' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate pricing
    const sessionCost = Number((Number(expert.hourly_rate) * duration) / 60)
    const commissionRate = Number(expert.commission_rate) || 15.00
    const platformFee = Number((sessionCost * commissionRate) / 100)
    const expertPayout = sessionCost - platformFee

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(sessionCost * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        expert_id: expertId,
        consumer_id: user.id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: String(duration)
      }
    })

    // Create booking - write BOTH schemas
    const { data: booking, error: bookingError } = await supabase
      .from('expertise_bookings')
      .insert({
        consumer_id: user.id,
        expert_id: expertId,
        scheduled_at: scheduledDate.toISOString(),
        event_date: scheduledDate.toISOString(),
        original_scheduled_at: scheduledDate.toISOString(),
        duration_minutes: duration,
        duration_hours: duration / 60,
        original_duration_minutes: duration,
        total_amount: sessionCost,
        platform_fee: platformFee,
        expert_payout: expertPayout,
        payment_intent_id: paymentIntent.id,
        meeting_link: `https://meet.jit.si/irookee-${crypto.randomUUID()}`,
        consumer_notes: consumerNotes || null,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      // Try to cancel the payment intent if booking creation fails
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id)
      } catch (cancelError) {
        console.error('Failed to cancel payment intent:', cancelError)
      }
      throw bookingError
    }

    // Synchronize to legacy bookings table safely
    try {
      await serviceSupabase
        .from('bookings')
        .insert({
          seeker_id: user.id,
          expert_id: expertId,
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: duration,
          total_amount: sessionCost,
          status: 'pending',
          meeting_link: booking.meeting_link,
          notes: consumerNotes || null,
        })
    } catch (err) {
      console.log('Failed to sync to legacy bookings table:', err.message)
    }

    return new Response(
      JSON.stringify({ 
        booking, 
        clientSecret: paymentIntent.client_secret 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create booking error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
