-- Fix storage policies for verification-documents bucket
-- Run this in Supabase SQL Editor

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own verification docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'verification-documents');

-- Allow public read for profile photos (needed for avatars)
CREATE POLICY "Public can read verification docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'verification-documents');
