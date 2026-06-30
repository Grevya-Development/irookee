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

    await adminClient.from('notifications').delete().eq('user_id', user.id)
    await adminClient.from('notification_preferences').delete().eq('user_id', user.id)
    await adminClient.from('user_profiles').delete().eq('user_id', user.id)
    await adminClient.from('guest_profiles').delete().eq('email', user.email)
    await adminClient.from('bookings').update({ organizer_id: null }).eq('organizer_id', user.id)
    await adminClient.from('reviews').update({ reviewer_id: null }).eq('reviewer_id', user.id)
    await adminClient.from('speakers').update({ user_id: null }).eq('user_id', user.id)

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
