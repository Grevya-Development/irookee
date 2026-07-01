-- Align admin access with the single administrator account: kavin@grevya.com
--
-- This migration contains NO secrets. It (1) updates the new-user trigger so the
-- admin role is granted to kavin@grevya.com on signup, and (2) backfills the
-- admin role for that account if it already exists. The account itself (and its
-- password) must be created via the Supabase dashboard or Auth Admin API so the
-- password is never committed to source control.

-- 1. Grant the admin role on signup for the designated admin email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default user role.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Promote the designated administrator.
  IF NEW.email = 'kavin@grevya.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill: if the admin account already exists, ensure it has the admin role.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'kavin@grevya.com'
ON CONFLICT (user_id, role) DO NOTHING;
