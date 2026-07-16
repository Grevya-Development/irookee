import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!authHeader || !supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing account deletion configuration')
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if caller is admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    const isAdmin = !!roleData;

    let targetUserId = user.id;
    let targetUserEmail = user.email;

    try {
      const body = await req.json();
      if (isAdmin && body?.target_user_id) {
        targetUserId = body.target_user_id;
        const { data: targetUser } = await adminClient.auth.admin.getUserById(targetUserId);
        targetUserEmail = targetUser?.user?.email || null;
      }
    } catch (_) {
      // no body or invalid json
    }

    // Find speaker profile ID for this user if it exists
    const { data: speaker } = await adminClient
      .from('speakers')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    const speakerId = speaker?.id

    // Helper to safely execute a delete or update on tables that might not exist or might fail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeDelete = async (table: string, matchCol: string, val: any) => {
      try {
        const { error } = await adminClient.from(table).delete().eq(matchCol, val)
        if (error) console.warn(`Warn: Safe delete on ${table} returned: ${error.message}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`Warn: Safe delete on ${table} failed: ${msg}`)
      }
    }

    // Clean user-specific notifications and preferences
    await safeDelete('notifications', 'user_id', targetUserId)
    await safeDelete('notification_preferences', 'user_id', targetUserId)
    await safeDelete('user_profiles', 'user_id', targetUserId)
    await safeDelete('user_roles', 'user_id', targetUserId)
    if (targetUserEmail) {
      await safeDelete('guest_profiles', 'email', targetUserEmail)
    }

    // Clean user-specific messages and reviews
    await safeDelete('expertise_messages', 'sender_id', targetUserId)
    await safeDelete('expertise_reviews', 'reviewer_id', targetUserId)
    await safeDelete('reviews', 'reviewer_id', targetUserId)

    // Clean expert reports where the user is reporter
    await safeDelete('expert_reports', 'reporter_id', targetUserId)

    if (speakerId) {
      await safeDelete('achievements', 'speaker_id', speakerId)
      await safeDelete('expertise_reviews', 'expert_id', speakerId)
      await safeDelete('reviews', 'speaker_id', speakerId)
      await safeDelete('testimonials', 'speaker_id', speakerId)
      await safeDelete('verification_requests', 'speaker_id', speakerId)
      await safeDelete('availability_slots', 'expert_id', speakerId)
      await safeDelete('speaker_availability', 'speaker_id', speakerId)
      await safeDelete('speaker_categories', 'expert_id', speakerId)
      await safeDelete('expert_reports', 'expert_id', speakerId)
    }

    // Delete bookings in correct order
    if (speakerId) {
      await safeDelete('expertise_bookings', 'expert_id', speakerId)
      await safeDelete('bookings', 'speaker_id', speakerId)
      await safeDelete('bookings', 'expert_id', speakerId) // support both column names
    }

    await safeDelete('expertise_bookings', 'user_id', targetUserId)
    await safeDelete('expertise_bookings', 'consumer_id', targetUserId)
    await safeDelete('bookings', 'seeker_id', targetUserId)
    await safeDelete('bookings', 'organizer_id', targetUserId)

    // Delete the expert profiles completely
    await safeDelete('speakers', 'user_id', targetUserId)
    await safeDelete('expert_profiles', 'user_id', targetUserId)

    // Delete user from authentication - this will cascade and delete from profiles table too
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ deleted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete account error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
