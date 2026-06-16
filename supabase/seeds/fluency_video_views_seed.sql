-- Seed 50–100 random views per published apply video
WITH counts AS (
  SELECT id, (50 + floor(random() * 51))::int AS n
  FROM apply_videos
  WHERE is_published = true
)
INSERT INTO fluency_views (entity_type, entity_id, user_id, session_id)
SELECT 'video', c.id, NULL, gen_random_uuid()::text
FROM counts c
CROSS JOIN generate_series(1, c.n);
