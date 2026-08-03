-- ============================================================================
-- live-delta.sql — the part of schema.sql the live project is missing.
-- Verified 2026-08-03 against https://tlsdxbjoghpfzltubshs.supabase.co:
--   * delete_account() and recalculate_expert_stats() do not exist there
--   * anon can still read public.profiles rows (policy not yet dropped)
-- Every statement below is idempotent — safe to run (and re-run) as one batch
-- in the Supabase SQL editor.
--
-- Do NOT run the full schema.sql on the live database: it would abort on the
-- first 'already exists' error and contains one-time data statements (e.g.
-- an admin credential reset) that must not be replayed.
-- ============================================================================
-- ============================================================================
-- Migration: 20260802000000_restrict_public_profile_reads.sql
-- ============================================================================

-- Stop exposing every user's email, phone and full name to anonymous visitors.
--
-- 20250922000000_expertise_marketplace_schema.sql created:
--   CREATE POLICY "Public profiles are viewable by everyone"
--     ON public.profiles FOR SELECT USING (true);
--
-- With that in place, `GET /rest/v1/profiles?select=email,phone,full_name`
-- returns the entire user table to anyone holding the anon key (which ships in
-- the browser bundle). Verified against the live project.
--
-- RLS policies are OR'ed, so dropping this one leaves the access the app
-- actually relies on intact:
--   * "Users can view own profile"  -> auth.uid() = id
--     (20250921102746_b90ecc85-76ac-432c-b230-dd48ef6c28cf.sql)
--   * "Admins can view all profiles" -> public.is_admin()
--     (20260708160000_add_admin_profile_policies.sql)
--
-- Audited callers of public.profiles before writing this: AuthProvider,
-- Settings, ExpertOnboarding, userUtils and lib/auth all read only the signed-in
-- user's own row; every cross-user read (UserManagement, PlatformModeration,
-- ExpertApproval, AnalyticsDashboard, AdminDashboard) is admin-only and covered
-- by is_admin(). The single non-admin cross-user reader, components/ReviewList,
-- is not imported anywhere and renders nowhere in the app.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- ============================================================================
-- Migration: 20260803000000_booking_status_and_stats_fixes.sql
-- ============================================================================

-- Fixes for defects that cannot be closed in application code alone.
-- From the PR #58/#59 and PR #62 verification reports.
--
--   BOOK-4    "No Show" fails from every surface with a generic error.
--   BOOK-5    A session can be marked completed before it starts, which frees
--             the slot and bypasses trg_check_booking_overlap.
--   ADMIN-14  A finished session can be moved back to "pending".
--   STATS-1   Completed sessions and reviews never reach speakers.rating /
--             speakers.past_events / expert_stats.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- BOOK-4 — 'no_show' was never a permitted status.
--
-- 20260630000000_june_functional_bug_fixes.sql set:
--   CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','refunded'))
-- while the UI (Expert Dashboard, Admin Panel, Admin Booking View) and
-- 20260419000000's stats all write 'no_show'. Every attempt violated the
-- constraint, which is why it failed identically from all three surfaces.
-- ---------------------------------------------------------------------------
ALTER TABLE public.expertise_bookings
  DROP CONSTRAINT IF EXISTS expertise_bookings_status_check;

ALTER TABLE public.expertise_bookings
  ADD CONSTRAINT expertise_bookings_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'completed',
    'cancelled', 'no_show', 'refunded'
  ));

-- ---------------------------------------------------------------------------
-- BOOK-5 / ADMIN-14 — enforce the status timing rules in the database.
--
-- The app now guards these (src/lib/bookingRules.ts), but the guard must also
-- exist here: the Admin panel, any future client, and direct REST calls all
-- write this column. BOOK-5 is a data-integrity issue (a falsely completed
-- session releases its slot), so it cannot rely on client code.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_booking_status_timing()
RETURNS TRIGGER AS $$
DECLARE
  start_at TIMESTAMPTZ;
  duration_min INTEGER;
  end_at TIMESTAMPTZ;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  start_at := COALESCE(NEW.scheduled_at, NEW.event_date);
  IF start_at IS NULL THEN
    RETURN NEW;
  END IF;

  duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  end_at := start_at + (duration_min * INTERVAL '1 minute');

  -- BOOK-5: completing before the start time falsifies the record and, because
  -- trg_check_booking_overlap only blocks pending/confirmed/in_progress, hands
  -- the slot back out for a second booking.
  IF NEW.status = 'completed' AND start_at > now() THEN
    RAISE EXCEPTION
      'A session cannot be marked completed before its start time (starts %).', start_at
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'no_show' AND start_at > now() THEN
    RAISE EXCEPTION
      'A session cannot be marked as a no-show before its start time (starts %).', start_at
      USING ERRCODE = 'check_violation';
  END IF;

  -- ADMIN-14: reviving a finished session as pending creates inconsistent
  -- historical data and re-blocks the slot.
  IF NEW.status = 'pending' AND end_at <= now() THEN
    RAISE EXCEPTION
      'A session that finished at % cannot be moved back to pending.', end_at
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_booking_status_timing ON public.expertise_bookings;
CREATE TRIGGER trg_enforce_booking_status_timing
BEFORE UPDATE ON public.expertise_bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_status_timing();

-- ---------------------------------------------------------------------------
-- STATS-1 — nothing aggregated completed sessions or reviews into the fields
-- the dashboards read, so an expert with 13 bookings / 4 completed / 2 reviews
-- showed "0 sessions", "0.0" rating and "No stats available yet".
--
-- These recompute from source rather than incrementing, so they are idempotent
-- and self-healing after any manual data edit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_expert_stats(target_expert_id UUID)
RETURNS VOID AS $$
DECLARE
  completed_count   INTEGER := 0;
  no_show_count_v   INTEGER := 0;
  cancelled_count_v INTEGER := 0;
  total_count       INTEGER := 0;
  avg_rating_v      NUMERIC := 0;
  review_count_v    INTEGER := 0;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*)
  INTO completed_count, no_show_count_v, cancelled_count_v, total_count
  FROM public.expertise_bookings
  WHERE expert_id = target_expert_id;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating_v, review_count_v
  FROM public.reviews
  WHERE speaker_id = target_expert_id AND rating IS NOT NULL;

  -- Public profile fields (what /expert/:id and the booking widget read).
  UPDATE public.speakers
  SET rating      = ROUND(avg_rating_v, 1),
      past_events = completed_count,
      updated_at  = now()
  WHERE id = target_expert_id;

  -- expert_stats powers the Stats & Badges tab and the leaderboard.
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'expert_stats') THEN
    INSERT INTO public.expert_stats AS es (
      expert_id, total_sessions, completed_sessions, no_show_count,
      cancellation_count, attendance_rate, total_reviews, avg_rating
    )
    VALUES (
      target_expert_id, total_count, completed_count, no_show_count_v,
      cancelled_count_v,
      CASE WHEN (completed_count + no_show_count_v) > 0
           THEN ROUND((completed_count::NUMERIC / (completed_count + no_show_count_v)) * 100)
           ELSE 100 END,
      review_count_v, ROUND(avg_rating_v, 1)
    )
    ON CONFLICT (expert_id) DO UPDATE SET
      total_sessions     = EXCLUDED.total_sessions,
      completed_sessions = EXCLUDED.completed_sessions,
      no_show_count      = EXCLUDED.no_show_count,
      cancellation_count = EXCLUDED.cancellation_count,
      attendance_rate    = EXCLUDED.attendance_rate,
      total_reviews      = EXCLUDED.total_reviews,
      avg_rating         = EXCLUDED.avg_rating;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute whenever a booking's status changes.
CREATE OR REPLACE FUNCTION public.trg_recalc_stats_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_expert_stats(COALESCE(NEW.expert_id, OLD.expert_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_stats_sync ON public.expertise_bookings;
CREATE TRIGGER trg_booking_stats_sync
AFTER INSERT OR UPDATE OF status OR DELETE ON public.expertise_bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_stats_from_booking();

-- Recompute whenever a review lands.
CREATE OR REPLACE FUNCTION public.trg_recalc_stats_from_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_expert_stats(COALESCE(NEW.speaker_id, OLD.speaker_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_review_stats_sync ON public.reviews;
CREATE TRIGGER trg_review_stats_sync
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_stats_from_review();

-- Backfill every expert once, so existing completed sessions and reviews stop
-- displaying as zero.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.speakers LOOP
    PERFORM public.recalculate_expert_stats(r.id);
  END LOOP;
END $$;

-- ============================================================================
-- delete_account() — in-database replacement for the removed `delete-account`
-- edge function. Deletes the caller's own account, or any account when the
-- caller has the admin role, then removes the auth.users row itself.
--
-- SECURITY DEFINER is required to delete from auth.users; the function is
-- locked down accordingly: EXECUTE revoked from PUBLIC/anon, caller identity
-- re-checked in the body, empty search_path with fully qualified names.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_account(target_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  target_id uuid;
  target_email text;
  v_speaker_id uuid;
  rec record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  target_id := COALESCE(delete_account.target_user_id, caller_id);

  IF target_id <> caller_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = caller_id AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Only admins can delete other users';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_id;
  SELECT id INTO v_speaker_id FROM public.speakers WHERE user_id = target_id LIMIT 1;

  -- Dependent rows, in FK-safe order. Each (table, column) pair is verified
  -- against information_schema and failures are downgraded to warnings, so the
  -- function tolerates schema drift exactly like the old edge function's
  -- safeDelete helper. The final auth.users delete is the hard gate: anything
  -- still referencing the user without ON DELETE CASCADE will surface there.
  FOR rec IN
    SELECT * FROM (VALUES
      ('notifications',            'user_id',      target_id::text),
      ('notification_preferences', 'user_id',      target_id::text),
      ('user_profiles',            'user_id',      target_id::text),
      ('user_roles',               'user_id',      target_id::text),
      ('guest_profiles',           'email',        target_email),
      ('expertise_messages',       'sender_id',    target_id::text),
      ('expertise_reviews',        'reviewer_id',  target_id::text),
      ('reviews',                  'reviewer_id',  target_id::text),
      ('expert_reports',           'reporter_id',  target_id::text),
      ('achievements',             'speaker_id',   v_speaker_id::text),
      ('expertise_reviews',        'expert_id',    v_speaker_id::text),
      ('reviews',                  'speaker_id',   v_speaker_id::text),
      ('testimonials',             'speaker_id',   v_speaker_id::text),
      ('verification_requests',    'speaker_id',   v_speaker_id::text),
      ('availability_slots',       'expert_id',    v_speaker_id::text),
      ('speaker_availability',     'speaker_id',   v_speaker_id::text),
      ('speaker_categories',       'expert_id',    v_speaker_id::text),
      ('expert_reports',           'expert_id',    v_speaker_id::text),
      ('expertise_bookings',       'expert_id',    v_speaker_id::text),
      ('bookings',                 'speaker_id',   v_speaker_id::text),
      ('bookings',                 'expert_id',    v_speaker_id::text),
      ('expertise_bookings',       'user_id',      target_id::text),
      ('expertise_bookings',       'consumer_id',  target_id::text),
      ('bookings',                 'seeker_id',    target_id::text),
      ('bookings',                 'organizer_id', target_id::text),
      ('speakers',                 'user_id',      target_id::text),
      ('expert_profiles',          'user_id',      target_id::text),
      ('profiles',                 'id',           target_id::text)
    ) AS t(tbl, col, val)
  LOOP
    IF rec.val IS NOT NULL AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = rec.tbl
        AND column_name = rec.col
    ) THEN
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE %I = %L', rec.tbl, rec.col, rec.val);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'delete_account: skipping %.% (%)', rec.tbl, rec.col, SQLERRM;
      END;
    END IF;
  END LOOP;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_account(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_account(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_account(uuid) TO authenticated;
