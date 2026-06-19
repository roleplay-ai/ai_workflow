-- Allow tracking page-level visits (e.g. /ai-fluency) in fluency_views.
-- entity_id for page visits uses a fixed sentinel UUID defined per page.

ALTER TABLE public.fluency_views
  DROP CONSTRAINT IF EXISTS fluency_views_entity_type_check;

ALTER TABLE public.fluency_views
  ADD CONSTRAINT fluency_views_entity_type_check
  CHECK (entity_type IN ('video', 'tool', 'tool_guide', 'deep_dive', 'module', 'page'));
