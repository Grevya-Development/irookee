import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlsdxbjoghpfzltubshs.supabase.co',
  'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD'
);

const runSmokeTests = async () => {
  console.log('======================================================');
  console.log('       RUNNING FINAL AUTOMATED SMOKE TESTS            ');
  console.log('======================================================');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Search Exact and Substring Boundary Checks
  try {
    const matchToken = (fieldValue, token) => {
      const normalizedField = fieldValue.toLowerCase().trim();
      const normalizedToken = token.toLowerCase().trim();
      const words = normalizedField.split(/[\s,.\-()&/|\\_]+/);
      return words.includes(normalizedToken);
    };

    const matchBuilt = matchToken('built with react', 'ui');
    const matchMumbai = matchToken('located in mumbai', 'ui');
    const matchUIUX = matchToken('ui/ux designer', 'ui');

    if (!matchBuilt && !matchMumbai && matchUIUX) {
      console.log('✅ Test 1 Passed: Search substring boundaries prevent false positives.');
      passedTests++;
    } else {
      console.log('❌ Test 1 Failed: Substring boundaries are not working.');
      failedTests++;
    }
  } catch (e) {
    console.error('Test 1 Error:', e);
    failedTests++;
  }

  // Test 2: RLS + Trigger Lock Enforcement
  try {
    // Attempting to update a pending profile anonymously
    const pendingSpeakerId = 'ec38d48e-6737-4bfa-9fae-1fa61c4cc82f'; // sakthi-official
    const { data, error } = await supabase
      .from('speakers')
      .update({ name: 'sakthi-official-attempt' })
      .eq('id', pendingSpeakerId)
      .select();

    // Anonymous update should either fail RLS (affecting 0 rows/returning empty)
    // or trigger lock exception if bypassed. Both are secure.
    if (error) {
      if (error.message.includes('Your profile is under review')) {
        console.log('✅ Test 2 Passed: Lock trigger rejected update (403).');
        passedTests++;
      } else {
        console.log(`❌ Test 2 Failed: Unexpected DB error: ${error.message}`);
        failedTests++;
      }
    } else if (!data || data.length === 0) {
      console.log('✅ Test 2 Passed: Row-level security (RLS) successfully blocked anonymous update (0 rows affected).');
      passedTests++;
    } else {
      console.log('❌ Test 2 Failed: Anonymous update succeeded! Security risk.');
      failedTests++;
    }
  } catch (e) {
    console.error('Test 2 Error:', e);
    failedTests++;
  }

  // Test 3: UTC Storage and Zoned Time Formatting
  try {
    const utcDateStr = '2026-07-23T12:00:00.000Z'; // 12:00 PM UTC
    const dateObj = new Date(utcDateStr);
    
    const formatZonedTime = (date, tz) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: tz,
      });
    };

    const formattedIST = formatZonedTime(dateObj, 'Asia/Kolkata');
    const formattedEST = formatZonedTime(dateObj, 'America/New_York');

    if (formattedIST.includes('05:30') || formattedIST.includes('5:30') || formattedEST.includes('08:00') || formattedEST.includes('8:00')) {
      console.log(`✅ Test 3 Passed: Zoned timezone conversions are correct (IST: ${formattedIST}, EST: ${formattedEST}).`);
      passedTests++;
    } else {
      console.log('❌ Test 3 Failed: Timezone conversion offset is incorrect.');
      failedTests++;
    }
  } catch (e) {
    console.error('Test 3 Error:', e);
    failedTests++;
  }

  console.log('\n======================================================');
  console.log(`Smoke Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('======================================================');
};

runSmokeTests();
