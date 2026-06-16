-- Allow anyone (including unauthenticated) to read module HTML files.
-- The content is educational and not sensitive; the API route already
-- restricts which modules are accessible via the fluency_modules table.

-- Drop the old authenticated-only policy if it exists
DROP POLICY IF EXISTS "Authenticated read module html" ON storage.objects;

-- Add a public read policy so the server-side download works regardless of session
CREATE POLICY "Public read module html" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'fluency-module-html');
