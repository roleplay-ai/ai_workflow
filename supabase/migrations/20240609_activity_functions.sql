-- Functions support for activities (mirrors activity_tags)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS functions text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS activity_functions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        UNIQUE NOT NULL,
  icon_url   text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read activity_functions" ON activity_functions FOR SELECT TO public USING (true);
CREATE POLICY "Superadmin write activity_functions" ON activity_functions FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

INSERT INTO activity_functions (name) VALUES
  ('HR'), ('Finance'), ('Marketing'), ('Sales'), ('Operations'),
  ('Legal'), ('IT'), ('Product'), ('Customer Success'), ('Leadership')
ON CONFLICT (name) DO NOTHING;
