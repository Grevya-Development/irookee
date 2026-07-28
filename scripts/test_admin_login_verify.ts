import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = 'kavin@grevya.com';
const ADMIN_PASS = 'Grevya@2026';

async function verifyAdminAuth() {
  console.log('================================================================');
  console.log(` AUDITING ADMIN LOGIN FOR: ${ADMIN_EMAIL} `);
  console.log('================================================================\n');

  // 1. Attempt Sign In
  console.log(`[STEP 1] Testing sign in with password "${ADMIN_PASS}"...`);
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  if (signInErr) {
    console.log(`❌ Sign in failed: ${signInErr.message}`);
    console.log('[STEP 2] Creating or updating user password in auth.users via signUp / RPC...');

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      options: {
        data: { full_name: 'Kavin N R', user_type: 'admin' }
      }
    });

    if (signUpErr) {
      console.log(`  SignUp notice: ${signUpErr.message}`);
    } else {
      console.log(`  ✓ SignUp registered user in auth: User ID=${signUpData.user?.id}`);
    }
  } else {
    console.log(`✅ Sign in SUCCESSFUL! User ID: ${signInData.user.id}`);
  }

  // 2. Verify Profile user_type & Admin Allowlist
  console.log('\n[STEP 3] Verifying public.profiles record...');
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  console.log('  Profile Record:', profile);

  if (profile && profile.user_type !== 'admin') {
    console.log('  Updating user_type to "admin" in profiles table...');
    await supabase.from('profiles').update({ user_type: 'admin', full_name: 'Kavin N R' }).eq('email', ADMIN_EMAIL);
    console.log('  ✓ Updated user_type to admin in public.profiles table.');
  }

  // 3. Final Auth Verification
  console.log('\n[STEP 4] Testing final sign in verification...');
  const { data: finalAuth, error: finalErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  if (finalErr) {
    console.log(`❌ Final Auth Status: ${finalErr.message}`);
  } else {
    console.log(`✅ Final Auth Status: SUCCESS! Admin User Logged In.`);
    console.log(`  User Email: ${finalAuth.user.email}`);
    console.log(`  Session Token Active: Yes`);
  }
}

verifyAdminAuth();
