-- ============================================================
-- activity-icons storage bucket for tool / tag logos
-- Run once in Supabase → SQL Editor
-- ============================================================

-- 1. Bucket (public so images load without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-icons',
  'activity-icons',
  true,
  10485760,   -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public          = true,
  file_size_limit = 10485760;

-- 2. Superadmins can upload (INSERT)
DROP POLICY IF EXISTS "superadmin_insert_activity_icons" ON storage.objects;
CREATE POLICY "superadmin_insert_activity_icons"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'activity-icons'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 3. Superadmins can overwrite (UPDATE)
DROP POLICY IF EXISTS "superadmin_update_activity_icons" ON storage.objects;
CREATE POLICY "superadmin_update_activity_icons"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'activity-icons'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 4. Public read (so <img src="..."> works everywhere)
DROP POLICY IF EXISTS "public_read_activity_icons" ON storage.objects;
CREATE POLICY "public_read_activity_icons"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'activity-icons');
