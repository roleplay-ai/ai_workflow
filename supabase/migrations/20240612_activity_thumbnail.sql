-- ============================================================
-- Activity card thumbnails
-- Run once in Supabase → SQL Editor
-- ============================================================

-- 1. Add thumbnail_url column to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. Storage bucket (public so <img> works without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-thumbnails',
  'activity-thumbnails',
  true,
  10485760,   -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public          = true,
  file_size_limit = 10485760;

-- 3. Superadmins can upload
DROP POLICY IF EXISTS "superadmin_insert_activity_thumbnails" ON storage.objects;
CREATE POLICY "superadmin_insert_activity_thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'activity-thumbnails'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 4. Superadmins can overwrite
DROP POLICY IF EXISTS "superadmin_update_activity_thumbnails" ON storage.objects;
CREATE POLICY "superadmin_update_activity_thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'activity-thumbnails'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 5. Public read
DROP POLICY IF EXISTS "public_read_activity_thumbnails" ON storage.objects;
CREATE POLICY "public_read_activity_thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'activity-thumbnails');
