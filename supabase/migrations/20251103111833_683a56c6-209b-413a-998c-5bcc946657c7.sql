-- Rename storage bucket from 'opa-files' to 'oppo-files'
UPDATE storage.buckets 
SET id = 'oppo-files', name = 'oppo-files' 
WHERE id = 'opa-files';

-- Update storage policies to use new bucket name
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'oppo-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'oppo-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'oppo-files' AND
    public.has_role(auth.uid(), 'admin')
  );