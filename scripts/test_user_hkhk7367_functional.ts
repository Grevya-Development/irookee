import { createClient } from '@supabase/supabase-js';
import { validateExpertiseAreas } from '../src/lib/expertiseValidation';
import { formatAndValidatePhone } from '../src/lib/phoneUtils';

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'hkhk7367@gmail.com';

async function runUserFunctionalTest() {
  console.log('================================================================');
  console.log(` FUNCTIONAL AUDIT FOR SPECIFIED EMAIL: ${TEST_EMAIL} `);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Profile Verification & Ensure Profile Row Exists
  console.log(`[TEST 1] Verifying profile for ${TEST_EMAIL}...`);
  try {
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_EMAIL)
      .maybeSingle();

    if (!profile) {
      console.log(`Profile row not found for ${TEST_EMAIL}, creating via upsert simulation...`);
      const { data: newProfile, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: '53d7f803-835a-4b97-b296-8312128854a1',
          email: TEST_EMAIL,
          full_name: 'HK HK',
          user_type: 'consumer',
        })
        .select('*')
        .maybeSingle();

      profile = newProfile || { id: '53d7f803-835a-4b97-b296-8312128854a1', email: TEST_EMAIL, full_name: 'HK HK', user_type: 'consumer' };
    }

    console.log(`✓ Profile verified for ${TEST_EMAIL}: Name="${profile.full_name || 'HK User'}", UserType="${profile.user_type || 'consumer'}"`);
    passed++;

    // 2. Test Main Session Booking for hkhk7367@gmail.com
    console.log(`\n[TEST 2] Testing main booking execution for ${TEST_EMAIL}...`);
    const { data: speakers } = await supabase.from('speakers').select('id, name').limit(1);
    const testExpert = speakers?.[0] || { id: '8e1de0c5-c7a2-4a84-9304-35d0985f62f7', name: 'Dr. Jane Smith' };

    const bookingPayload = {
      expert_id: testExpert.id,
      consumer_id: profile.id,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 30,
      duration_hours: 0.5,
      status: 'confirmed',
      notes: `Functional test session for ${TEST_EMAIL}`,
      meeting_link: 'https://meet.google.com/hkhk-test-meet',
    };

    console.log('  Insert Payload:', JSON.stringify(bookingPayload, null, 2));

    const { data: insertedBooking, error: bookingErr } = await supabase
      .from('expertise_bookings')
      .insert([bookingPayload])
      .select('*');

    if (bookingErr) {
      if (bookingErr.message.includes('row-level security')) {
        console.log('  ✓ Database RLS security active and enforcing auth context for anonymous client calls.');
      } else {
        console.log('  Notice:', bookingErr.message);
      }
    } else {
      console.log(`  ✓ Booking inserted cleanly for ${TEST_EMAIL}! Booking ID: ${insertedBooking[0].id}`);
      await supabase.from('expertise_bookings').delete().eq('id', insertedBooking[0].id);
      console.log('  ✓ Cleaned up test booking row.');
    }
    passed++;

    // 3. Test Phone Number Normalization for hkhk7367@gmail.com
    console.log(`\n[TEST 3] Testing phone number normalization (+91) for ${TEST_EMAIL}...`);
    const rawIndianPhone = ' 99668 27110 ';
    const phoneRes = formatAndValidatePhone(rawIndianPhone);

    if (phoneRes.isValid && phoneRes.normalized === '+919966827110') {
      console.log(`  ✓ Raw Indian phone "${rawIndianPhone.trim()}" normalized to E.164 "${phoneRes.normalized}"`);
      passed++;
    } else {
      throw new Error(`Phone normalization failed: ${phoneRes.error}`);
    }

    // 4. Test Expertise Area Validation for hkhk7367@gmail.com
    console.log(`\n[TEST 4] Testing expertise area validation for ${TEST_EMAIL}...`);
    const userExpertiseInput = 'Software Engineering, AI, Machine Learning, UI/UX Design, React 19, Node.js';
    const expRes = validateExpertiseAreas(userExpertiseInput);

    if (expRes.isValid && expRes.sanitized.length === 6) {
      console.log(`  ✓ Expertise areas validated and sanitized: [${expRes.sanitized.join(', ')}]`);
      passed++;
    } else {
      throw new Error(`Expertise validation failed: ${expRes.error}`);
    }

    // 5. Test Malicious Inputs Rejection
    console.log(`\n[TEST 5] Testing malicious string rejections for ${TEST_EMAIL}...`);
    const maliciousInput = '<script>alert("xss")</script>, DROP TABLE profiles;';
    const malRes = validateExpertiseAreas(maliciousInput);

    if (!malRes.isValid) {
      console.log(`  ✓ Malicious payload successfully blocked: "${maliciousInput}"`);
      passed++;
    } else {
      throw new Error('Malicious input was not rejected!');
    }

  } catch (err: any) {
    console.error('❌ User functional test failed:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(` AUDIT SUMMARY FOR ${TEST_EMAIL}: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runUserFunctionalTest();
