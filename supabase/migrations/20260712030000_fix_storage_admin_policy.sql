DROP POLICY IF EXISTS "Admins can read verification documents" ON storage.objects;
CREATE POLICY "Admins can read verification documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
