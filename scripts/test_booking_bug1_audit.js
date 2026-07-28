import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlsdxbjoghpfzltubshs.supabase.co',
  'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD'
);

async function auditBookingBug1() {
  console.log('=== AUDITING BUG 1: BOOKING CREATION & PROFILE GUARANTEE ===');
  
  try {
    // 1. Fetch an expert speaker to book against
    const { data: speakers, error: speakerError } = await supabase
      .from('speakers')
      .select('id, name, user_id, email')
      .limit(1);

    if (speakerError || !speakers || speakers.length === 0) {
      console.error('Failed to fetch expert speaker:', speakerError);
      return;
    }
    const expert = speakers[0];
    console.log('Selected Expert:', expert.name, 'ID:', expert.id);

    // 2. Fetch or create a test consumer user profile to verify profiles table consistency
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1);

    if (profileError || !existingProfiles || existingProfiles.length === 0) {
      console.error('Profile fetch error:', profileError);
      return;
    }

    const testConsumer = existingProfiles[0];
    console.log('Consumer Profile ID:', testConsumer.id, 'Name:', testConsumer.full_name);

    // 3. Perform actual booking payload insert into expertise_bookings
    const testScheduledAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours in future
    const bookingPayload = {
      expert_id: expert.id,
      consumer_id: testConsumer.id,
      scheduled_at: testScheduledAt,
      duration_minutes: 30,
      status: 'confirmed',
      notes: 'Automated audit test booking',
    };

    console.log('Sending Booking Insert Payload:', JSON.stringify(bookingPayload, null, 2));

    const { data: insertedBooking, error: insertError, status, statusText } = await supabase
      .from('expertise_bookings')
      .insert([bookingPayload])
      .select('*')
      .single();

    console.log('API Status Code:', status, statusText);

    if (insertError) {
      console.error('❌ Insert Error:', insertError);
    } else {
      console.log('✅ Booking Row Inserted Successfully! ID:', insertedBooking.id);
      console.log('Response Body:', JSON.stringify(insertedBooking, null, 2));

      // Verify row exists by querying table
      const { data: retrievedBooking } = await supabase
        .from('expertise_bookings')
        .select('*')
        .eq('id', insertedBooking.id)
        .single();

      if (retrievedBooking) {
        console.log('✅ Verified booking row retrieved from expertise_bookings database table.');
      }

      // Cleanup test row
      await supabase.from('expertise_bookings').delete().eq('id', insertedBooking.id);
      console.log('Cleaned up test booking row.');
    }
  } catch (err) {
    console.error('Unhandled Execution Error:', err);
  }
}

auditBookingBug1();
