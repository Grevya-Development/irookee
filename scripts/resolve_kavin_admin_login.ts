import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = 'kavin@grevya.com';
const ADMIN_PASS = 'Grevya@2026';

async function resolveKavinAdminLogin() {
  console.log('================================================================');
  console.log(` RESOLVING ADMIN LOGIN CREDENTIALS FOR: ${ADMIN_EMAIL} `);
  console.log('================================================================\n');

  // 1. Check if login currently works
  const { data: initialLogin, error: initialErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  if (!initialErr && initialLogin.user) {
    console.log(`✅ Admin login ALREADY WORKING for ${ADMIN_EMAIL}!`);
    console.log(`  User ID: ${initialLogin.user.id}`);
    return;
  }

  console.log(`Login failed initially (${initialErr?.message}). Provisioning admin user...`);

  // 2. SignUp user with password Grevya@2026
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    options: {
      data: { full_name: 'Kavin N R', user_type: 'admin' }
    }
  });

  if (signUpErr) {
    console.log(`SignUp message: ${signUpErr.message}`);
  } else if (signUpData.user) {
    console.log(`✓ SignUp created auth.users entry: ${signUpData.user.id}`);
  }

  // 3. Upsert public.profiles record with user_type = 'admin'
  console.log('Updating public.profiles record to user_type = "admin"...');
  const { data: targetProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL);

  if (targetProfiles && targetProfiles.length > 0) {
    for (const p of targetProfiles) {
      await supabase.from('profiles').update({ user_type: 'admin', full_name: 'Kavin N R' }).eq('id', p.id);
    }
    console.log(`✓ Updated ${targetProfiles.length} profiles rows for ${ADMIN_EMAIL} to user_type = "admin".`);
  } else {
    await supabase.from('profiles').upsert({
      id: signUpData.user?.id || 'fb70e487-326e-4182-bb63-bf0ffd4b6957',
      email: ADMIN_EMAIL,
      full_name: 'Kavin N R',
      user_type: 'admin',
    });
    console.log(`✓ Created new admin profile row for ${ADMIN_EMAIL}.`);
  }

  // 4. Test Final Auth Verification
  const { data: finalAuth, error: finalErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });

  if (finalErr) {
    console.log(`❌ Final Auth Status: ${finalErr.message}`);
  } else {
    console.log(`✅ FINAL VERIFICATION SUCCESSFUL!`);
    console.log(`  Admin Email: ${finalAuth.user.email}`);
    console.log(`  User ID: ${finalAuth.user.id}`);
    console.log(`  Session Active: YES`);
  }
}

resolveKavinAdminLogin();
