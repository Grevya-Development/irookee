import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixAdminAccount() {
  console.log('=== FIXING ADMIN AUTHENTICATION FOR kavin@grevya.com ===');

  const email = 'kavin@grevya.com';

  // 1. Ensure public.profiles has user_type = 'admin'
  console.log('1. Updating user_type in public.profiles table to admin...');
  const { data: updatedProfile, error: profileErr } = await supabase
    .from('profiles')
    .update({ user_type: 'admin', full_name: 'Kavin N R' })
    .eq('email', email)
    .select('*');

  if (profileErr) {
    console.error('Error updating profiles:', profileErr);
  } else {
    console.log('✓ Updated profiles row:', updatedProfile);
  }

  // 2. Test direct auth signup/password reset if user row is missing or unconfirmed
  console.log('2. Verifying login or creating user credentials...');
  const testPassword = 'Grevya@2026';

  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: testPassword,
  });

  if (signInErr) {
    console.log('SignIn failed with Grevya@2026, attempting signUp / password update:', signInErr.message);
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: testPassword,
      options: {
        data: { full_name: 'Kavin N R', user_type: 'admin' }
      }
    });

    if (signUpErr) {
      console.log('SignUp notice:', signUpErr.message);
    } else {
      console.log('✓ SignUp created user row in auth.users:', signUpData.user?.id);
    }
  } else {
    console.log('✓ Login with Grevya@2026 SUCCESSFUL! User ID:', signInData.user.id);
  }
}

fixAdminAccount();
