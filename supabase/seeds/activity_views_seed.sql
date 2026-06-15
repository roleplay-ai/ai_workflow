-- Seed 50–100 random views per published activity
-- CTE forces random() to evaluate once per activity row before generate_series expands it
WITH counts AS (
  SELECT id, (50 + floor(random() * 51))::int AS n
  FROM activities
  WHERE published = true
)
INSERT INTO activity_views (activity_id, user_id, session_id)
SELECT c.id, NULL, gen_random_uuid()::text
FROM counts c
CROSS JOIN generate_series(1, c.n);
