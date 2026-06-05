-- ============================================================
-- Tags support for activities
-- Run once in Supabase → SQL Editor
-- ============================================================

-- 1. Tags column on activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Tag options table (canonical list of tags superadmins can pick from)
CREATE TABLE IF NOT EXISTS activity_tags (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        UNIQUE NOT NULL,
  icon_url   text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read activity_tags"  ON activity_tags FOR SELECT TO public    USING (true);
CREATE POLICY "Superadmin write activity_tags" ON activity_tags FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- 3. Default tags
INSERT INTO activity_tags (name) VALUES
  ('Chat'), ('Email'), ('PPT'), ('XLSX'), ('PDF')
ON CONFLICT (name) DO NOTHING;

-- 4. Default tools in tool_logos (if not already present)
INSERT INTO tool_logos (tool, logo_url, updated_at) VALUES
  ('ChatGPT', '', now()),
  ('Gemini',  '', now()),
  ('Claude',  '', now()),
  ('Copilot', '', now())
ON CONFLICT (tool) DO NOTHING;

-- 5. Storage bucket for tool/tag icons (create manually in Supabase dashboard
--    or uncomment below if your Supabase version supports it via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('activity-icons', 'activity-icons', true) ON CONFLICT DO NOTHING;
