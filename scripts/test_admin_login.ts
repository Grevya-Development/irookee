import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminLogin() {
  console.log('=== AUDITING ADMIN LOGIN & AUTHENTICATION ===');
  console.log('Target Email: kavin@grevya.com');
  console.log('Testing password: Grevya@2026...');

  const email = 'kavin@grevya.com';
  const password = 'Grevya@2026';

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ LOGIN FAILED with error:', error.message);
    console.error('  Error Code:', error.code, 'Status:', error.status);

    // Let's check profile role and user type in profiles table
    console.log('\nChecking user row in public.profiles table...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    console.log('Profile Details:', profile);
  } else {
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('User Metadata:', data.user.user_metadata);

    // Check user profile for admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    console.log('Profile Record:', profile);
  }
}

testAdminLogin();
