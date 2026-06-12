-- Fluency Learn Modules
-- worlds → modules → screens (6 fixed per module) → options / tokens
-- Completion tracked via fluency_module_progress (simple checkmark, no points)

CREATE TABLE IF NOT EXISTS public.fluency_worlds (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  emoji       text        NOT NULL DEFAULT '🌍',
  color       text        NOT NULL DEFAULT '#FFCE00',
  sort_order  int         NOT NULL DEFAULT 0,
  published   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz          DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluency_modules (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id         uuid        NOT NULL REFERENCES public.fluency_worlds(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  emoji            text        NOT NULL DEFAULT '📖',
  concepts         text[]               DEFAULT '{}',
  sort_order       int         NOT NULL DEFAULT 0,
  published        boolean     NOT NULL DEFAULT true,
  is_locked        boolean     NOT NULL DEFAULT false,
  next_module_hint text,
  created_at       timestamptz          DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluency_module_screens (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id          uuid        NOT NULL REFERENCES public.fluency_modules(id) ON DELETE CASCADE,
  screen_type        text        NOT NULL CHECK (screen_type IN ('hook','idea','example','why','check','unlocked')),
  order_index        int         NOT NULL DEFAULT 0,
  label              text,
  title              text,
  body               text,
  tone               text                 CHECK (tone IN ('neutral','good','bad')),
  question           text,
  feedback_correct   text,
  feedback_incorrect text,
  next_module_title  text,
  created_at         timestamptz          DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluency_screen_options (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id   uuid    NOT NULL REFERENCES public.fluency_module_screens(id) ON DELETE CASCADE,
  option_text text    NOT NULL,
  is_correct  boolean NOT NULL DEFAULT false,
  order_index int     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.fluency_screen_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id   uuid NOT NULL REFERENCES public.fluency_module_screens(id) ON DELETE CASCADE,
  token_text  text NOT NULL,
  style       text NOT NULL DEFAULT 'normal' CHECK (style IN ('normal','highlight','dimmed')),
  order_index int  NOT NULL DEFAULT 0
);

-- Simple completion tracking (no points, no XP)
CREATE TABLE IF NOT EXISTS public.fluency_module_progress (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    uuid        NOT NULL REFERENCES public.fluency_modules(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.fluency_worlds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_module_screens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_screen_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_screen_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published worlds"  ON public.fluency_worlds FOR SELECT TO public USING (published = true);
CREATE POLICY "Public read published modules" ON public.fluency_modules FOR SELECT TO public USING (published = true);
CREATE POLICY "Public read module screens"    ON public.fluency_module_screens FOR SELECT TO public USING (true);
CREATE POLICY "Public read screen options"    ON public.fluency_screen_options FOR SELECT TO public USING (true);
CREATE POLICY "Public read screen tokens"     ON public.fluency_screen_tokens FOR SELECT TO public USING (true);

CREATE POLICY "Users read own module progress"   ON public.fluency_module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own module progress" ON public.fluency_module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own module progress" ON public.fluency_module_progress FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Superadmin manage worlds"  ON public.fluency_worlds FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage modules" ON public.fluency_modules FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage screens" ON public.fluency_module_screens FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage options" ON public.fluency_screen_options FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage tokens" ON public.fluency_screen_tokens FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
