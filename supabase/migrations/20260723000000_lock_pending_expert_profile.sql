-- Prevent non-admin users from updating their speaker profile when its verification_status is 'pending'
CREATE OR REPLACE FUNCTION public.check_pending_speaker_profile_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status = 'pending' AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Your profile is under review. Editing is temporarily disabled until verification completes.'
      USING ERRCODE = '40300';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_pending_speaker_profile_lock ON public.speakers;

CREATE TRIGGER enforce_pending_speaker_profile_lock
BEFORE UPDATE ON public.speakers
FOR EACH ROW
EXECUTE FUNCTION public.check_pending_speaker_profile_lock();
