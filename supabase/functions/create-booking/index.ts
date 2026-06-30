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

    // Get expert details
    const { data: expert, error: expertError } = await supabase
      .from('expert_profiles')
      .select('hourly_rate, commission_rate, user_id, is_active, verification_status')
      .eq('id', expertId)
      .single()

    if (expertError || !expert) {
      return new Response(
        JSON.stringify({ error: 'Expert not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expert.is_active || expert.verification_status !== 'verified') {
      return new Response(
        JSON.stringify({ error: 'Expert is not available for booking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestedEnd = new Date(scheduledDate.getTime() + duration * 60 * 1000)
    const { data: existingBookings, error: existingBookingsError } = await serviceSupabase
      .from('expertise_bookings')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('expert_id', expertId)
      .in('status', activeStatuses)

    if (existingBookingsError) throw existingBookingsError

    const overlapsExistingBooking = (existingBookings || []).some((booking) => {
      if (!booking.scheduled_at) return false

      const existingStart = new Date(booking.scheduled_at)
      if (Number.isNaN(existingStart.getTime())) return false

      const existingDuration = Number(booking.duration_minutes) || 60
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

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('expertise_bookings')
      .insert({
        consumer_id: user.id,
        expert_id: expertId,
        scheduled_at: scheduledDate.toISOString(),
        original_scheduled_at: scheduledDate.toISOString(),
        duration_minutes: duration,
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

