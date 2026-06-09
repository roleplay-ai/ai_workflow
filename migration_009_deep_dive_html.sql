-- ============================================================
-- Migration 009: HTML pages for tool deep dives
-- Run in Supabase SQL Editor (after migration 008)
-- ============================================================

ALTER TABLE public.tool_deep_dives
  ALTER COLUMN url DROP NOT NULL;

ALTER TABLE public.tool_deep_dives
  ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'external'
    CHECK (link_type IN ('external', 'html'));

ALTER TABLE public.tool_deep_dives
  ADD COLUMN IF NOT EXISTS html_path text;

-- Storage bucket for uploaded HTML pages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deep-dive-pages',
  'deep-dive-pages',
  true,
  5242880,
  ARRAY['text/html', 'text/plain', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public          = true,
  file_size_limit = 5242880;

DROP POLICY IF EXISTS "deep_dive_pages: public read" ON storage.objects;
CREATE POLICY "deep_dive_pages: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'deep-dive-pages');

DROP POLICY IF EXISTS "deep_dive_pages: superadmin insert" ON storage.objects;
CREATE POLICY "deep_dive_pages: superadmin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deep-dive-pages'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

DROP POLICY IF EXISTS "deep_dive_pages: superadmin update" ON storage.objects;
CREATE POLICY "deep_dive_pages: superadmin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deep-dive-pages'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

DROP POLICY IF EXISTS "deep_dive_pages: superadmin delete" ON storage.objects;
CREATE POLICY "deep_dive_pages: superadmin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'deep-dive-pages'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );
