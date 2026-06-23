-- Optional per-activity URL for the overview "Open tool" link (overrides fluency_tools try_url).
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS try_link text;
