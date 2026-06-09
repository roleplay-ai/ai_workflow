ALTER TABLE tool_deep_dives ALTER COLUMN url DROP NOT NULL;
ALTER TABLE tool_deep_dives ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'external' CHECK (link_type IN ('external', 'html'));
ALTER TABLE tool_deep_dives ADD COLUMN IF NOT EXISTS html_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('deep-dive-pages', 'deep-dive-pages', true, 5242880, ARRAY['text/html', 'text/plain', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

CREATE POLICY "Public read deep dive pages" ON storage.objects FOR SELECT TO public USING (bucket_id = 'deep-dive-pages');
CREATE POLICY "Superadmin insert deep dive pages" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deep-dive-pages' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Superadmin update deep dive pages" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'deep-dive-pages' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Superadmin delete deep dive pages" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'deep-dive-pages' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
