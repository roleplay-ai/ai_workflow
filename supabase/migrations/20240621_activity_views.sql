-- Track every page view of an activity (guests + logged-in users)
CREATE TABLE IF NOT EXISTS activity_views (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  text,       -- anonymous session UUID (from client localStorage)
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS activity_views_activity_id_idx ON activity_views(activity_id);
CREATE INDEX IF NOT EXISTS activity_views_session_idx    ON activity_views(activity_id, session_id);

-- Public read: anyone can see counts (via API); public insert: guests can log views
ALTER TABLE activity_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a view"
  ON activity_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read view counts"
  ON activity_views FOR SELECT
  USING (true);

-- Aggregated view so the dashboard can fetch counts without row-limit issues
CREATE OR REPLACE VIEW activity_view_counts AS
  SELECT activity_id, COUNT(*) AS count
  FROM activity_views
  GROUP BY activity_id;
