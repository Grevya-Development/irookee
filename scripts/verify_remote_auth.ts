import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyRemoteAuth() {
  console.log('=== VERIFYING REMOTE AUTHENTICATION FOR kavin@grevya.com ===');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'kavin@grevya.com',
    password: 'Grevya@2026',
  });

  if (error) {
    console.error('❌ REMOTE SIGN IN FAILED:', error.message);
  } else {
    console.log('✅ REMOTE SIGN IN PASSED SUCCESSFULLY!');
    console.log('  User ID:', data.user.id);
    console.log('  Email:', data.user.email);
    console.log('  Role:', data.user.role);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    console.log('  Profile user_type:', profile?.user_type);
  }
}

verifyRemoteAuth();
