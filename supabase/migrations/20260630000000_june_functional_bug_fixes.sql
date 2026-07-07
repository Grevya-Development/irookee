-- June functional testing fixes: bookings, notifications, account settings, and verification documents.

ALTER TABLE public.expertise_bookings
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC;

UPDATE public.expertise_bookings
SET
  original_scheduled_at = COALESCE(original_scheduled_at, scheduled_at, event_date),
  original_duration_minutes = COALESCE(original_duration_minutes, duration_minutes, (duration_hours * 60)::INTEGER)
WHERE original_scheduled_at IS NULL OR original_duration_minutes IS NULL;

ALTER TABLE public.expertise_bookings
  DROP CONSTRAINT IF EXISTS expertise_bookings_status_check;

ALTER TABLE public.expertise_bookings
  ADD CONSTRAINT expertise_bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_expertise_bookings_scheduled_at
  ON public.expertise_bookings(scheduled_at);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_booking_confirmed BOOLEAN DEFAULT TRUE NOT NULL,
  email_expert_application BOOLEAN DEFAULT TRUE NOT NULL,
  email_expert_approved BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can manage own notification preferences'
  ) THEN
    CREATE POLICY "Users can manage own notification preferences"
      ON public.notification_preferences FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own verification documents'
  ) THEN
    CREATE POLICY "Users can upload own verification documents"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own verification documents'
  ) THEN
    CREATE POLICY "Users can read own verification documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can read verification documents'
  ) THEN
    CREATE POLICY "Admins can read verification documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND public.has_role(auth.uid(), 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read avatars'
  ) THEN
    CREATE POLICY "Anyone can read avatars"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND (storage.foldername(name))[2] = 'avatars'
      );
  END IF;
END $$;

-- Triggers to enforce double-booking overlap checks at the database query level (prevents race conditions)
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_expert_id UUID;
  new_id UUID;
BEGIN
  new_id := NEW.id;
  new_expert_id := NEW.expert_id;
  new_start := COALESCE(NEW.scheduled_at, NEW.event_date);
  new_duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.expertise_bookings
  SELECT EXISTS (
    SELECT 1 FROM public.expertise_bookings
    WHERE expert_id = new_expert_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND COALESCE(scheduled_at, event_date) < new_end
      AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.bookings
    SELECT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE speaker_id = new_expert_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND event_date < new_end
        AND new_start < (event_date + (COALESCE(duration_hours, 1) * 60 * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_booking_overlap ON public.expertise_bookings;
CREATE TRIGGER trg_check_booking_overlap
BEFORE INSERT OR UPDATE ON public.expertise_bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_overlap();

CREATE OR REPLACE FUNCTION public.check_legacy_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_speaker_id UUID;
  new_id UUID;
BEGIN
  new_id := NEW.id;
  new_speaker_id := NEW.speaker_id;
  new_start := NEW.event_date;
  new_duration_min := COALESCE((NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.bookings
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE speaker_id = new_speaker_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND event_date < new_end
      AND new_start < (event_date + (COALESCE(duration_hours, 1) * 60 * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.expertise_bookings
    SELECT EXISTS (
      SELECT 1 FROM public.expertise_bookings
      WHERE expert_id = new_speaker_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND COALESCE(scheduled_at, event_date) < new_end
        AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_legacy_booking_overlap ON public.bookings;
CREATE TRIGGER trg_check_legacy_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_legacy_booking_overlap();
