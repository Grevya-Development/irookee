-- Trigger to check for availability slot overlap/duplicates
CREATE OR REPLACE FUNCTION public.check_availability_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.availability_slots
    WHERE expert_id = NEW.expert_id
      AND id <> NEW.id
      AND day_of_week = NEW.day_of_week
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) INTO overlap_exists;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Duplicate availability slot: This slot overlaps with an existing availability slot.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_availability_overlap ON public.availability_slots;
CREATE TRIGGER trg_check_availability_overlap
BEFORE INSERT OR UPDATE ON public.availability_slots
FOR EACH ROW
EXECUTE FUNCTION public.check_availability_overlap();
