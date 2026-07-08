-- Create a migration to fix schema compatibility and triggers
ALTER TABLE public.expertise_bookings
  ADD COLUMN IF NOT EXISTS consumer_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS expert_payout DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS consumer_notes TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Triggers to enforce double-booking overlap checks at the database level
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
  -- If the booking status is not active, skip overlap checks entirely
  IF NEW.status NOT IN ('pending', 'confirmed', 'in_progress') THEN
    RETURN NEW;
  END IF;

  new_id := NEW.id;
  new_expert_id := NEW.expert_id;
  new_start := COALESCE(NEW.scheduled_at, NEW.event_date);
  
  IF new_start IS NULL THEN
    RAISE EXCEPTION 'Booking start time is required.';
  END IF;

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
        AND COALESCE(event_date, scheduled_at) < new_end
        AND new_start < (COALESCE(event_date, scheduled_at) + (COALESCE(duration_hours, (duration_minutes::NUMERIC / 60.0), 1.0) * 60 * INTERVAL '1 minute'))
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
END_VAR BOOLEAN; -- not needed
BEGIN
  -- If the booking status is not active, skip overlap checks entirely
  IF NEW.status NOT IN ('pending', 'confirmed', 'in_progress') THEN
    RETURN NEW;
  END IF;

  new_id := NEW.id;
  new_speaker_id := NEW.speaker_id;
  new_start := COALESCE(NEW.event_date, NEW.scheduled_at);
  
  IF new_start IS NULL THEN
    RAISE EXCEPTION 'Booking start time is required.';
  END IF;

  new_duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.bookings
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE speaker_id = new_speaker_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND COALESCE(event_date, scheduled_at) < new_end
      AND new_start < (COALESCE(event_date, scheduled_at) + (COALESCE(duration_hours, (duration_minutes::NUMERIC / 60.0), 1.0) * 60 * INTERVAL '1 minute'))
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
