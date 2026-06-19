-- Add IP address tracking to activity_views and fluency_views.
-- Existing seed rows will have ip_address = NULL, which lets analytics filter
-- them out with a simple WHERE ip_address IS NOT NULL check.

ALTER TABLE public.activity_views
  ADD COLUMN IF NOT EXISTS ip_address text;

ALTER TABLE public.fluency_views
  ADD COLUMN IF NOT EXISTS ip_address text;

CREATE INDEX IF NOT EXISTS activity_views_ip_idx ON public.activity_views(ip_address);
CREATE INDEX IF NOT EXISTS fluency_views_ip_idx  ON public.fluency_views(ip_address);
