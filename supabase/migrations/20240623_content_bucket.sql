-- Public "content" bucket for video and thumbnail uploads from the admin UI.
-- Videos go under  content/apply-videos/
-- Thumbnails go under content/video-thumbs/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content',
  'content',
  true,
  524288000,   -- 500 MB
  ARRAY[
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public CDN)
CREATE POLICY "content: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'content');

-- Superadmin can write
CREATE POLICY "content: superadmin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'content'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "content: superadmin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'content'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "content: superadmin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'content'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
