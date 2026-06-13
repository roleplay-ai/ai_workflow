-- Add is_featured flag to apply_videos so the AI Fluency page can show
-- a curated subset without exposing all 22 rows.

ALTER TABLE public.apply_videos
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Mark the first 10 by order_index as featured
UPDATE public.apply_videos
SET is_featured = true
WHERE order_index < 10;
