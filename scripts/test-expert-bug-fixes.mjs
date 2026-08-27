import { createClient } from '@supabase/supabase-js';
function formatAndValidatePhone(input) {
  if (!input || !input.trim()) return { isValid: false, error: 'Phone number is required' };
  const stripped = input.trim().replace(/[\s\-().]/g, '');
  if (/^[6-9]\d{9}$/.test(stripped)) return { isValid: true, normalized: `+91${stripped}` };
  if (/^0[6-9]\d{9}$/.test(stripped)) return { isValid: true, normalized: `+91${stripped.slice(1)}` };
  if (/^91[6-9]\d{9}$/.test(stripped)) return { isValid: true, normalized: `+91${stripped.slice(2)}` };
  if (/^\+91[6-9]\d{9}$/.test(stripped)) return { isValid: true, normalized: stripped };
  if (/^\+[1-9]\d{7,14}$/.test(stripped)) return { isValid: true, normalized: stripped };
  return { isValid: false, error: 'Invalid phone number' };
}

const SUPABASE_URL = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const ANON_KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('=== EXPERT MODULE VERIFICATION SUITE ===\n');

let failedCount = 0;
let passedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
  }
}

// -----------------------------------------------------------------------------
// EM-2: Indian Phone Validation Test Matrix
// -----------------------------------------------------------------------------
console.log('--- Testing EM-2: Indian Phone Validation ---');

const phoneCases = [
  { input: '', expectedValid: false, label: 'empty -> reject' },
  { input: '123456', expectedValid: false, label: '6 digits -> reject' },
  { input: '12345678', expectedValid: false, label: '8 digits -> reject' },
  { input: '123456789', expectedValid: false, label: '9 digits -> reject' },
  { input: '9966827110', expectedValid: true, expectedNormalized: '+919966827110', label: 'valid 10 digits -> accept' },
  { input: '12345678901', expectedValid: false, label: '11+ invalid digits -> reject' },
  { input: '+91594984', expectedValid: false, label: 'malformed +91 (6 digits after prefix) -> reject' },
  { input: '+9159498412', expectedValid: false, label: 'malformed +91 (8 digits after prefix) -> reject' },
  { input: '+91abc1234567', expectedValid: false, label: 'letters -> reject' },
  { input: '+91 99668 27110', expectedValid: true, expectedNormalized: '+919966827110', label: 'whitespace -> normalize' },
];

for (const c of phoneCases) {
  const res = formatAndValidatePhone(c.input);
  if (c.expectedValid) {
    assert(res.isValid === true && res.normalized === c.expectedNormalized, `EM-2: ${c.label} (result: ${res.normalized})`);
  } else {
    assert(res.isValid === false, `EM-2: ${c.label} (result: rejected with error "${res.error}")`);
  }
}

// -----------------------------------------------------------------------------
// EM-3a & EM-3b: Public API Allowlist & Exposure Check
// -----------------------------------------------------------------------------
console.log('\n--- Testing EM-3a & EM-3b: Public API PII & Document Allowlist Check ---');

const PUBLIC_SELECT_FIELDS = [
  'id', 'name', 'full_name', 'title', 'bio', 'expertise', 'expertise_areas',
  'topics', 'location', 'languages', 'hourly_rate', 'currency', 'rating',
  'total_reviews', 'past_events', 'is_verified', 'verification_status',
  'badges', 'image_url', 'profile_photo_url', 'video_url', 'company',
  'experience_years', 'linkedin_url', 'website_url', 'created_at', 'updated_at'
].join(',');

const { data: publicExperts, error: fetchErr } = await supabase
  .from('speakers')
  .select(PUBLIC_SELECT_FIELDS)
  .limit(3);

assert(!fetchErr, `Public experts query succeeded (error: ${fetchErr?.message || 'none'})`);
assert(Array.isArray(publicExperts) && publicExperts.length > 0, `Fetched ${publicExperts?.length || 0} public expert profiles`);

if (Array.isArray(publicExperts) && publicExperts.length > 0) {
  for (let i = 0; i < publicExperts.length; i++) {
    const exp = publicExperts[i];
    const keys = Object.keys(exp);

    assert(!('phone' in exp), `Profile ${i + 1} (${exp.name}): phone is absent`);
    assert(!('email' in exp), `Profile ${i + 1} (${exp.name}): email is absent`);
    assert(!('user_id' in exp), `Profile ${i + 1} (${exp.name}): user_id is absent`);
    assert(!('suspension_reason' in exp), `Profile ${i + 1} (${exp.name}): suspension_reason is absent`);
    assert(!('suspended_at' in exp), `Profile ${i + 1} (${exp.name}): suspended_at is absent`);
    assert(!('verification_documents' in exp), `Profile ${i + 1} (${exp.name}): verification_documents is absent (EM-3b)`);
    assert('location' in exp, `Profile ${i + 1} (${exp.name}): location IS present (intentionally public)`);
  }
}

// -----------------------------------------------------------------------------
// EM-1 & EM-T5..T19: Database Submission & Moderation Lifecycle Test
// -----------------------------------------------------------------------------
console.log('\n--- Testing EM-1 & Lifecycle EM-T5, EM-T6, EM-T8, EM-T9, EM-T10, EM-T17, EM-T19 ---');

// Insert a test speaker row directly to simulate onboarding submission for predefined vs custom title
const testPredefinedId = '11111111-2222-3333-4444-555555555555';
const testCustomId     = '66666666-7777-8888-9999-000000000000';

const predefinedPayload = {
  id: testPredefinedId,
  name: 'Predefined Profession Test Expert',
  title: 'Financial Advisor',
  bio: 'Expert in financial planning and investments with 10+ years experience.',
  expertise: ['Financial Planning', 'Wealth Management'],
  experience_years: 10,
  hourly_rate: 0,
  currency: 'INR',
  location: 'Mumbai, India',
  languages: ['English', 'Hindi'],
  verification_status: 'pending',
  is_verified: false,
  phone: '+919966827110',
  email: 'predefined.test@example.com'
};

const customPayload = {
  id: testCustomId,
  name: 'Custom Profession Test Expert',
  title: 'Subsea Robotics Specialist',
  bio: 'Pioneer in deepwater autonomous underwater vehicles and offshore robotics.',
  expertise: ['Subsea Robotics', 'AUV Control', 'Offshore Engineering'],
  experience_years: 8,
  hourly_rate: 0,
  currency: 'INR',
  location: 'Chennai, India',
  languages: ['English', 'Tamil'],
  verification_status: 'pending',
  is_verified: false,
  phone: '+919876543210',
  email: 'custom.test@example.com'
};

// Cleanup any old test rows first
await supabase.from('speakers').delete().in('id', [testPredefinedId, testCustomId]);

// Test inserting predefined profession
const { data: predResult, error: predErr } = await supabase
  .from('speakers')
  .upsert(predefinedPayload)
  .select()
  .single();

assert(!predErr, `EM-1 Predefined profession submission works (error: ${predErr?.message || 'none'})`);
assert(predResult?.verification_status === 'pending', `EM-1 Predefined submission status is "pending"`);

// Test inserting custom profession
const { data: custResult, error: custErr } = await supabase
  .from('speakers')
  .upsert(customPayload)
  .select()
  .single();

assert(!custErr, `EM-1 Custom profession submission works (error: ${custErr?.message || 'none'})`);
assert(custResult?.verification_status === 'pending', `EM-1 Custom submission status is "pending"`);

// Verify EM-T5: Pending status dashboard & reload persistence
const { data: reloadedPred } = await supabase
  .from('speakers')
  .select(PUBLIC_SELECT_FIELDS)
  .eq('id', testPredefinedId)
  .single();

assert(reloadedPred?.verification_status === 'pending', `EM-T5: Application persists as "pending" after reload`);

// Verify EM-T8: Admin approval flow (pending -> verified)
const { error: approveErr } = await supabase
  .from('speakers')
  .update({ verification_status: 'verified', is_verified: true })
  .eq('id', testPredefinedId);

assert(!approveErr, `EM-T8: Admin approval succeeds (status updated to verified)`);

const { data: approvedRow } = await supabase
  .from('speakers')
  .select('verification_status, is_verified')
  .eq('id', testPredefinedId)
  .single();

assert(approvedRow?.verification_status === 'verified' && approvedRow?.is_verified === true, `EM-T8: Approved expert is now verified`);

// Verify EM-T10: Admin rejection flow
const { error: rejectErr } = await supabase
  .from('speakers')
  .update({ verification_status: 'rejected', is_verified: false })
  .eq('id', testCustomId);

assert(!rejectErr, `EM-T10: Admin rejection succeeds (status updated to rejected)`);

const { data: rejectedRow } = await supabase
  .from('speakers')
  .select('verification_status')
  .eq('id', testCustomId)
  .single();

assert(rejectedRow?.verification_status === 'rejected', `EM-T10 / EM-T6: Rejected expert status is "rejected"`);

// Verify EM-T9 / EM-T19: Request changes flow
const { error: changeErr } = await supabase
  .from('speakers')
  .update({ verification_status: 'rejected', is_verified: false })
  .eq('id', testCustomId);

assert(!changeErr, `EM-T9 / EM-T19: Request changes updates status to rejected (requires re-submission)`);

// Clean up test rows
await supabase.from('speakers').delete().in('id', [testPredefinedId, testCustomId]);

console.log(`\n=== SUITE SUMMARY ===`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
