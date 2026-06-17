-- Decouple the "Verified" badge from listing/approval.
--
-- Model after this change:
--   * speakers.verification_status ('pending' | 'verified' | 'rejected')
--     controls whether an expert is LISTED/active (admin approval).
--   * speakers.is_verified (boolean) is the "Verified" badge (tick mark) shown
--     to users. It is granted/revoked by an admin and is independent of listing.
--
-- Verification documents are now OPTIONAL at onboarding. Uploading them simply
-- lets an admin review and grant the Verified badge.

-- Ensure the column exists and defaults to false for new experts.
ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Backfill: experts that are already approved/live keep their Verified badge,
-- so the existing roster (incl. seeded experts) does not lose its tick.
UPDATE public.speakers
SET is_verified = true
WHERE verification_status = 'verified'
  AND is_verified IS DISTINCT FROM true;
