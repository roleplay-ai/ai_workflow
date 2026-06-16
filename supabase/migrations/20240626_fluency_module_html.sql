-- Add html_path to fluency_modules for superadmin-uploaded HTML content
ALTER TABLE public.fluency_modules ADD COLUMN IF NOT EXISTS html_path text;

-- Storage bucket for module HTML files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fluency-module-html', 'fluency-module-html', false, 10485760, ARRAY['text/html', 'text/plain', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = 10485760;

CREATE POLICY "Superadmin insert module html" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fluency-module-html' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin update module html" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fluency-module-html' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin delete module html" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fluency-module-html' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Authenticated read module html" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fluency-module-html');
