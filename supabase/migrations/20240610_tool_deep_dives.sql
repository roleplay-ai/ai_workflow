-- Tool deep-dive links shown in dashboard sidebar ("Go deeper with your tools")
CREATE TABLE IF NOT EXISTS tool_deep_dives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  url         text NOT NULL,
  description text,
  tool        text,
  position    int NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE tool_deep_dives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published deep dives" ON tool_deep_dives FOR SELECT TO public
  USING (published = true);

CREATE POLICY "Superadmin manage deep dives" ON tool_deep_dives FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
