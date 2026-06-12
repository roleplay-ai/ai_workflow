-- apply_videos: feature/workflow demo videos for the AI Fluency page.
-- Mirrors nudgeable's apply_videos table schema.

CREATE TABLE IF NOT EXISTS public.apply_videos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  video_url     text,
  thumbnail_url text,
  duration      text,
  order_index   int         NOT NULL DEFAULT 0,
  is_published  boolean     NOT NULL DEFAULT true,
  is_locked     boolean     NOT NULL DEFAULT false,
  group_name    text        NOT NULL DEFAULT 'Features',
  category_tag  text,
  platforms     text,
  created_at    timestamptz          DEFAULT now()
);

ALTER TABLE public.apply_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published apply videos"
  ON public.apply_videos FOR SELECT TO public
  USING (is_published = true);

CREATE POLICY "Superadmin manage apply videos"
  ON public.apply_videos FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
