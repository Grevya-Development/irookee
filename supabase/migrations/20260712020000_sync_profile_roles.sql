CREATE OR REPLACE FUNCTION public.sync_profile_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_type = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.user_type <> 'admin' AND NEW.email <> 'kavin@grevya.com' THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_profile_to_user_roles
  AFTER UPDATE OF user_type OR INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_user_roles();
