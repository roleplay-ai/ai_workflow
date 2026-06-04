-- ============================================================
-- activity-videos storage bucket + RLS policies
-- Run once in Supabase → SQL Editor (or via `supabase db push`)
-- ============================================================

-- 1. Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-videos',
  'activity-videos',
  true,                          -- public bucket so getPublicUrl() works without auth
  524288000,                     -- 500 MB per file
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',           -- .mov
    'video/x-msvideo',           -- .avi
    'video/x-matroska'           -- .mkv
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public          = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;


-- 2. Superadmins can upload (INSERT)
DROP POLICY IF EXISTS "superadmin_insert_activity_videos" ON storage.objects;
CREATE POLICY "superadmin_insert_activity_videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-videos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'superadmin'
  )
);


-- 3. Superadmins can overwrite (UPDATE / upsert)
DROP POLICY IF EXISTS "superadmin_update_activity_videos" ON storage.objects;
CREATE POLICY "superadmin_update_activity_videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activity-videos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'superadmin'
  )
);


-- 4. Superadmins can delete
DROP POLICY IF EXISTS "superadmin_delete_activity_videos" ON storage.objects;
CREATE POLICY "superadmin_delete_activity_videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-videos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'superadmin'
  )
);


-- 5. Public read (needed for getPublicUrl to work without tokens)
DROP POLICY IF EXISTS "public_read_activity_videos" ON storage.objects;
CREATE POLICY "public_read_activity_videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'activity-videos');
