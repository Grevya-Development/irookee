import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'Irookee <notifications@irookee.com>'

  if (!resendApiKey) {
    console.warn(`Skipping booking email to ${to} because RESEND_API_KEY is not configured`)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { bookingId } = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!bookingId || !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing booking id or authorization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase service configuration')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: booking, error: bookingError } = await supabase
      .from('expertise_bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) throw bookingError || new Error('Booking not found')

    const { data: consumer } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.consumer_id)
      .maybeSingle()

    // Support both speakers and expert_profiles tables for notification routing
    let expertUserId = null
    const { data: speakerData } = await supabase
      .from('speakers')
      .select('user_id')
      .eq('id', booking.expert_id)
      .maybeSingle()

    if (speakerData) {
      expertUserId = speakerData.user_id
    } else {
      const { data: expertProfile } = await supabase
        .from('expert_profiles')
        .select('user_id')
        .eq('id', booking.expert_id)
        .maybeSingle()
      if (expertProfile) {
        expertUserId = expertProfile.user_id
      }
    }

    const { data: expertUser } = expertUserId
      ? await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', expertUserId)
          .maybeSingle()
      : { data: null }

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, email_booking_confirmed, in_app_notifications')
      .in('user_id', [consumer?.id, expertUser?.id].filter(Boolean))

    const preferencesByUserId = new Map(
      (preferences || []).map((preference) => [preference.user_id, preference])
    )

    const startVal = booking.scheduled_at || booking.event_date
    const sessionDate = new Date(startVal)
    const sessionDateText = sessionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const sessionTimeText = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const durationMinutes = booking.duration_minutes || (booking.duration_hours ? booking.duration_hours * 60 : 60)
    const durationText = `${durationMinutes} minutes`
    const meetingLink = booking.meeting_link || 'Meeting link will be shared before the session.'

    const html = `
      <p>Your Irookee booking is confirmed.</p>
      <p><strong>Date:</strong> ${sessionDateText}</p>
      <p><strong>Time:</strong> ${sessionTimeText}</p>
      <p><strong>Duration:</strong> ${durationText}</p>
      <p><strong>Meeting link:</strong> ${meetingLink}</p>
      <p><strong>Details:</strong> ${booking.consumer_notes || 'No additional notes.'}</p>
    `

    const consumerPreferences = consumer?.id ? preferencesByUserId.get(consumer.id) : null
    const expertPreferences = expertUser?.id ? preferencesByUserId.get(expertUser.id) : null
    const consumerAllowsInApp = consumerPreferences?.in_app_notifications !== false
    const expertAllowsInApp = expertPreferences?.in_app_notifications !== false
    const consumerAllowsEmail = consumerPreferences?.email_booking_confirmed !== false
    const expertAllowsEmail = expertPreferences?.email_booking_confirmed !== false

    const notificationRows = [
      consumer?.id && consumerAllowsInApp && {
        user_id: consumer.id,
        title: 'Booking confirmed',
        body: `Your session on ${sessionDateText} at ${sessionTimeText} is confirmed.`,
        type: 'booking_confirmed',
        related_id: booking.id,
      },
      expertUser?.id && expertAllowsInApp && {
        user_id: expertUser.id,
        title: 'New confirmed booking',
        body: `A session on ${sessionDateText} at ${sessionTimeText} has been confirmed.`,
        type: 'booking_confirmed',
        related_id: booking.id,
      },
    ].filter(Boolean)

    if (notificationRows.length > 0) {
      await supabase.from('notifications').insert(notificationRows)
    }

    if (consumer?.email && consumerAllowsEmail) {
      await sendEmail(consumer.email, 'Your Irookee booking is confirmed', html)
    }

    if (expertUser?.email && expertAllowsEmail) {
      await sendEmail(expertUser.email, 'You have a confirmed Irookee booking', html)
    }

    return new Response(
      JSON.stringify({ notified: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Booking notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
