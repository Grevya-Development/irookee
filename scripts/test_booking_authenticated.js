import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlsdxbjoghpfzltubshs.supabase.co',
  'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD'
);

async function testAuthenticatedBooking() {
  console.log('=== TESTING AUTHENTICATED BOOKING FLOW & PROFILE INTEGRITY ===');

  // Attempt login with a known test account or sign up a temporary test user
  const testEmail = `test_audit_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log(`1. Signing up test user: ${testEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: 'Audit Test User' }
    }
  });

  if (authError || !authData.user) {
    console.log('Sign up error, attempting direct sign in:', authError?.message);
    return;
  }

  const user = authData.user;
  console.log('✅ User created/authenticated. User ID:', user.id);

  // 2. Test ensureUserProfileExists logic
  console.log('2. Running ensureUserProfileExists logic...');
  const customerEmail = user.email || '';
  const customerName = user.user_metadata?.full_name || 'Audit Test User';

  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: customerEmail, full_name: customerName, user_type: 'consumer' })
    .select('*')
    .single();

  if (profileErr) {
    console.error('❌ Profile Upsert Error:', profileErr);
    return;
  }
  console.log('✅ Profile row verified in public.profiles table:', profileRow.id, profileRow.full_name);

  // 3. Fetch speaker to book
  const { data: speakers } = await supabase.from('speakers').select('id, name').limit(1);
  if (!speakers || speakers.length === 0) {
    console.error('No speakers found');
    return;
  }
  const expert = speakers[0];

  // 4. Create booking row as authenticated user
  const scheduledAt = new Date(Date.now() + 86400000).toISOString();
  console.log(`3. Executing booking for expert "${expert.name}" (${expert.id})...`);

  const { data: booking, error: bookingErr, status } = await supabase
    .from('expertise_bookings')
    .insert([{
      expert_id: expert.id,
      consumer_id: user.id,
      scheduled_at: scheduledAt,
      duration_minutes: 30,
      status: 'confirmed',
      notes: 'Audit confirmation booking',
    }])
    .select('*')
    .single();

  console.log('Booking API Response Status Code:', status);

  if (bookingErr) {
    console.error('❌ Booking Insertion Error:', bookingErr);
  } else {
    console.log('✅ Free session booking completed successfully!');
    console.log('Booking Object Response Body:', JSON.stringify(booking, null, 2));

    // 5. Query expertise_bookings table to confirm persistence
    const { data: fetchBooking } = await supabase
      .from('expertise_bookings')
      .select('*')
      .eq('id', booking.id)
      .single();

    if (fetchBooking) {
      console.log('✅ Confirmed new row inserted into expertise_bookings table. ID:', fetchBooking.id);
    }

    // Clean up test booking & profile
    await supabase.from('expertise_bookings').delete().eq('id', booking.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    console.log('✅ Cleaned up test records.');
  }
}

testAuthenticatedBooking();
