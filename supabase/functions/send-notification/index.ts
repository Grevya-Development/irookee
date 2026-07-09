import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing configuration')
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { event, recipient_id, data } = await req.json()

    // Helper to send email via SMTP
    const sendMail = async (toEmail: string, subject: string, body: string) => {
      try {
        const client = new SmtpClient()
        // Connect to the local inbucket container.
        // In local Supabase development, the SMTP service is running in container supabase_inbucket_jctawltvlnooqqkltjvb.
        // Deno container resolves this via the Docker network DNS.
        await client.connect({
          hostname: 'supabase_inbucket_jctawltvlnooqqkltjvb',
          port: 1025,
        })

        await client.send({
          from: 'no-reply@irookee.com',
          to: toEmail,
          subject: subject,
          content: body,
        })
        await client.close()
        console.log(`Email successfully sent to ${toEmail}`)
      } catch (err) {
        console.error(`Failed to send email to ${toEmail}:`, err)
      }
    }

    // Helper to get preferences
    const getPreferences = async (userId: string) => {
      const { data: prefs } = await adminClient
        .from('notification_preferences' as never)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      // Default preferences if not set
      return prefs || {
        email_booking_confirmed: true,
        email_expert_application: true,
        email_expert_approved: true,
        in_app_notifications: true,
      }
    }

    // Helper to get user email
    const getUserEmail = async (userId: string) => {
      const { data: userData, error } = await adminClient.auth.admin.getUserById(userId)
      if (error || !userData?.user) {
        throw new Error(`User not found: ${userId}`)
      }
      return userData.user.email || ''
    }

    if (event === 'expert_application') {
      // Find admin profile
      const { data: adminProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('email', 'kavin@grevya.com')
        .maybeSingle()

      if (!adminProfile) {
        return new Response(JSON.stringify({ error: 'Admin profile not found' }), { status: 404, headers: corsHeaders })
      }

      const adminId = adminProfile.id
      const adminEmail = adminProfile.email || 'kavin@grevya.com'
      const prefs = await getPreferences(adminId)

      // 1. In-app notification
      if (prefs.in_app_notifications) {
        await adminClient.from('notifications' as never).insert({
          user_id: adminId,
          title: 'New Expert Application',
          body: `Expert ${data.expert_name} has applied for verification.`,
          type: 'expert_application',
          related_id: data.speaker_id || null,
        } as never)
      }

      // 2. Email notification
      if (prefs.email_expert_application) {
        await sendMail(
          adminEmail,
          'New Expert Application Received',
          `Hello Admin,\n\nA new expert application has been submitted by ${data.expert_name}.\nProfessional Title: ${data.expert_title}\n\nPlease review it in the admin panel.\n\nBest regards,\nirookee Team`
        )
      }
    } else if (event === 'expert_approved' || event === 'expert_rejected') {
      const isApproved = event === 'expert_approved'
      const prefs = await getPreferences(recipient_id)
      const email = await getUserEmail(recipient_id)

      // 1. In-app notification
      if (prefs.in_app_notifications) {
        await adminClient.from('notifications' as never).insert({
          user_id: recipient_id,
          title: isApproved ? 'Expert Profile Approved' : 'Expert Profile Update',
          body: isApproved 
            ? 'Congratulations! Your expert profile application has been approved. You are now live!' 
            : 'Your expert profile application has been rejected/suspended. Please review details.',
          type: event,
          related_id: data.speaker_id || null,
        } as never)
      }

      // 2. Email notification
      if (prefs.email_expert_approved) {
        await sendMail(
          email,
          isApproved ? 'Your Expert Profile is Approved!' : 'Expert Profile Status Update',
          isApproved
            ? `Hello,\n\nWe are pleased to inform you that your expert profile on irookee has been approved. You are now listed and users can book sessions with you!\n\nBest regards,\nirookee Team`
            : `Hello,\n\nYour expert profile status has been set to rejected/suspended by our administrator. If you believe this is in error, please contact support.\n\nBest regards,\nirookee Team`
        )
      }
    } else if (event === 'booking_confirmed') {
      // Data contains customer_id, expert_user_id, booking_id, customer_name, expert_name, scheduled_at
      const { customer_id, expert_user_id, booking_id, customer_name, expert_name, scheduled_at } = data

      // Send to Expert
      const expertPrefs = await getPreferences(expert_user_id)
      const expertEmail = await getUserEmail(expert_user_id)

      if (expertPrefs.in_app_notifications) {
        await adminClient.from('notifications' as never).insert({
          user_id: expert_user_id,
          title: 'New Booking Confirmed',
          body: `You have a new session booked with ${customer_name} on ${scheduled_at}.`,
          type: 'booking_confirmed',
          related_id: booking_id,
        } as never)
      }

      if (expertPrefs.email_booking_confirmed) {
        await sendMail(
          expertEmail,
          'New Booking Confirmed on irookee',
          `Hello ${expert_name},\n\nYou have a new session booked by ${customer_name}.\nScheduled Time: ${scheduled_at}\n\nPlease review your dashboard for details.\n\nBest regards,\nirookee Team`
        )
      }

      // Send to Seeker/Consumer
      const seekerPrefs = await getPreferences(customer_id)
      const seekerEmail = await getUserEmail(customer_id)

      if (seekerPrefs.in_app_notifications) {
        await adminClient.from('notifications' as never).insert({
          user_id: customer_id,
          title: 'Session Booking Confirmed',
          body: `Your session booking with ${expert_name} on ${scheduled_at} is confirmed.`,
          type: 'booking_confirmed',
          related_id: booking_id,
        } as never)
      }

      if (seekerPrefs.email_booking_confirmed) {
        await sendMail(
          seekerEmail,
          'Your Session Booking is Confirmed',
          `Hello ${customer_name},\n\nYour session booking with expert ${expert_name} has been confirmed.\nScheduled Time: ${scheduled_at}\n\nBest regards,\nirookee Team`
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Send-notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
