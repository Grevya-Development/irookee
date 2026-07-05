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

    const deletedEmail = `deleted-${user.id}@deleted.local`

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeUpdate = async (table: string, values: any, matchCol: string, val: any) => {
      try {
        const { error } = await adminClient.from(table).update(values).eq(matchCol, val)
        if (error) console.warn(`Warn: Safe update on ${table} returned: ${error.message}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`Warn: Safe update on ${table} failed: ${msg}`)
      }
    }

    // Clean user-specific notifications and settings
    await safeDelete('notifications', 'user_id', user.id)
    await safeDelete('notification_preferences', 'user_id', user.id)
    await safeDelete('user_profiles', 'user_id', user.id)
    if (user.email) {
      await safeDelete('guest_profiles', 'email', user.email)
    }

    // Unlink organizer/reviewer/seeker/consumer IDs from bookings and reviews
    await safeUpdate('bookings', { organizer_id: null }, 'organizer_id', user.id)
    await safeUpdate('bookings', { seeker_id: null }, 'seeker_id', user.id)
    await safeUpdate('bookings', { user_id: null }, 'user_id', user.id)
    await safeUpdate('expertise_bookings', { consumer_id: null }, 'consumer_id', user.id)
    await safeUpdate('expertise_bookings', { user_id: null }, 'user_id', user.id)
    await safeUpdate('reviews', { reviewer_id: null }, 'reviewer_id', user.id)
    await safeUpdate('expertise_reviews', { reviewer_id: null }, 'reviewer_id', user.id)
    await safeDelete('user_roles', 'user_id', user.id)

    // Anonymize and unlink expert profiles
    await safeUpdate(
      'speakers',
      {
        user_id: null,
        email: null,
        phone: null,
        name: 'Deleted Expert',
        bio: 'This account has been deleted.',
        profile_photo_url: null,
        image_url: null,
        linkedin_url: null,
        website_url: null,
        verification_status: 'deleted'
      },
      'user_id',
      user.id
    )

    await safeUpdate(
      'expert_profiles',
      {
        user_id: null,
        bio: 'This account has been deleted.',
        image_url: null,
        video_url: null,
        verification_status: 'deleted'
      },
      'user_id',
      user.id
    )

    // Anonymize personal profile details
    await adminClient
      .from('profiles')
      .update({
        email: deletedEmail,
        full_name: 'Deleted user',
        first_name: null,
        last_name: null,
        avatar_url: null,
        bio: null,
        phone: null,
      })
      .eq('id', user.id)

    // Delete user from authentication
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
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
