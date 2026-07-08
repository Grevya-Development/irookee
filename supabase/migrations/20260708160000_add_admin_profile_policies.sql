-- Allow admins to view, update, and delete all profiles for User Management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());
