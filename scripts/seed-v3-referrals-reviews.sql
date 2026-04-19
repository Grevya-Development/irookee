-- =============================================
-- IROOKEE V3 - REFERRALS & REVIEWS SUPPORT
-- =============================================

-- 1. Referral tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referred_email text NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id),
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'completed_session')),
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- 2. Add referral_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- 3. Add session_format to expertise_bookings
ALTER TABLE expertise_bookings ADD COLUMN IF NOT EXISTS session_format text DEFAULT 'video';

-- 4. Make sure reviews table has proper columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name text;

-- 5. Ensure RLS on reviews allows inserts
DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
CREATE POLICY "Users can view reviews" ON reviews FOR SELECT USING (true);

SELECT 'V3 migrations applied: referrals table, session_format, review policies' AS result;
