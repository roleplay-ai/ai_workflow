-- AI Fluency page content: briefs, foundations, videos, tools, tool guides

-- 1. Daily brief card
CREATE TABLE IF NOT EXISTS public.fluency_briefs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text        NOT NULL,
  published_date date        NOT NULL,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz          DEFAULT now()
);

-- 2. Brief bullet items
CREATE TABLE IF NOT EXISTS public.fluency_brief_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id   uuid NOT NULL REFERENCES public.fluency_briefs(id) ON DELETE CASCADE,
  content    text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

-- 3. AI Foundation cards
CREATE TABLE IF NOT EXISTS public.fluency_foundations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  emoji        text        NOT NULL DEFAULT '🧠',
  module_count int         NOT NULL DEFAULT 0,
  time_minutes int         NOT NULL DEFAULT 0,
  sort_order   int         NOT NULL DEFAULT 0,
  published    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz          DEFAULT now()
);

-- 4. Video cards (videos stored in fluency-videos Supabase bucket)
CREATE TABLE IF NOT EXISTS public.fluency_videos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kicker        text        NOT NULL,
  title         text        NOT NULL,
  description   text,
  video_url     text,
  thumbnail_url text,
  sort_order    int         NOT NULL DEFAULT 0,
  published     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz          DEFAULT now()
);

-- 5. Product / tool cards
CREATE TABLE IF NOT EXISTS public.fluency_tools (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_label text        NOT NULL,
  name           text        NOT NULL,
  description    text,
  icon_emoji     text        NOT NULL DEFAULT '✨',
  company_name   text,
  try_url        text,
  sort_order     int         NOT NULL DEFAULT 0,
  published      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz          DEFAULT now()
);

-- 6. AI Tool Guide cards (Claude, Gemini, ChatGPT, Copilot)
CREATE TABLE IF NOT EXISTS public.fluency_tool_guides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  logo_letter  text        NOT NULL,
  description  text,
  accent_color text        NOT NULL DEFAULT '#FFCE00',
  bg_color     text        NOT NULL DEFAULT '#FFF6CF',
  border_color text        NOT NULL DEFAULT '#F0D978',
  guide_url    text,
  sort_order   int         NOT NULL DEFAULT 0,
  published    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz          DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.fluency_briefs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_brief_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_foundations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_videos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_tools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_tool_guides  ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read active briefs"
  ON public.fluency_briefs FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Public read brief items"
  ON public.fluency_brief_items FOR SELECT TO public USING (true);

CREATE POLICY "Public read published foundations"
  ON public.fluency_foundations FOR SELECT TO public USING (published = true);

CREATE POLICY "Public read published videos"
  ON public.fluency_videos FOR SELECT TO public USING (published = true);

CREATE POLICY "Public read published tools"
  ON public.fluency_tools FOR SELECT TO public USING (published = true);

CREATE POLICY "Public read published tool guides"
  ON public.fluency_tool_guides FOR SELECT TO public USING (published = true);

-- Superadmin full access
CREATE POLICY "Superadmin manage briefs"
  ON public.fluency_briefs FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage brief items"
  ON public.fluency_brief_items FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage foundations"
  ON public.fluency_foundations FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage videos"
  ON public.fluency_videos FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage tools"
  ON public.fluency_tools FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage tool guides"
  ON public.fluency_tool_guides FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ─── Storage bucket for fluency videos ───────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fluency-videos',
  'fluency-videos',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read fluency videos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'fluency-videos');

CREATE POLICY "Superadmin manage fluency videos"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'fluency-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    bucket_id = 'fluency-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
