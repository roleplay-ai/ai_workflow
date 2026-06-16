-- Track every view of an AI Fluency content item (guests + logged-in users).
-- Polymorphic: one table covers videos, tools, tool guides, deep dives and learn modules.
-- Counts are NOT shown to end users — this is for superadmin analytics only.
CREATE TABLE IF NOT EXISTS public.fluency_views (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text        NOT NULL CHECK (entity_type IN ('video', 'tool', 'tool_guide', 'deep_dive', 'module')),
  entity_id   uuid        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  text,       -- anonymous session UUID (from client localStorage)
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS fluency_views_entity_idx  ON public.fluency_views(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS fluency_views_session_idx ON public.fluency_views(entity_type, entity_id, session_id);

ALTER TABLE public.fluency_views ENABLE ROW LEVEL SECURITY;

-- Public insert: guests can log views
CREATE POLICY "Anyone can insert a fluency view"
  ON public.fluency_views FOR INSERT
  WITH CHECK (true);

-- Public read: needed by the dedup check in the API (also harmless — counts only)
CREATE POLICY "Anyone can read fluency views"
  ON public.fluency_views FOR SELECT
  USING (true);

-- Aggregated view so admin dashboards can fetch counts without row-limit issues
CREATE OR REPLACE VIEW public.fluency_view_counts AS
  SELECT entity_type, entity_id, COUNT(*) AS count
  FROM public.fluency_views
  GROUP BY entity_type, entity_id;
