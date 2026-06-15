-- Re-create superadmin write policies for all AI Fluency tables.
-- Safe to run even if the policies already exist (DROP IF EXISTS first).

-- ── fluency_briefs ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage briefs" ON public.fluency_briefs;
CREATE POLICY "Superadmin manage briefs"
  ON public.fluency_briefs FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ── fluency_brief_items ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage brief items" ON public.fluency_brief_items;
CREATE POLICY "Superadmin manage brief items"
  ON public.fluency_brief_items FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ── fluency_tools ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage tools" ON public.fluency_tools;
CREATE POLICY "Superadmin manage tools"
  ON public.fluency_tools FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ── apply_videos ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage apply videos" ON public.apply_videos;
CREATE POLICY "Superadmin manage apply videos"
  ON public.apply_videos FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ── fluency_worlds ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage worlds" ON public.fluency_worlds;
CREATE POLICY "Superadmin manage worlds"
  ON public.fluency_worlds FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ── fluency_modules ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin manage modules" ON public.fluency_modules;
CREATE POLICY "Superadmin manage modules"
  ON public.fluency_modules FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Superadmin also needs to SELECT unpublished rows (public policy only shows published=true)
-- Drop and re-add the public SELECT policies to avoid conflicts, then ensure superadmin can
-- read ALL rows (published or draft) via the ALL policy above which covers SELECT too.

-- Additionally grant superadmin SELECT on unpublished fluency_tools and fluency_worlds
-- (the ALL policy's USING clause covers SELECT, so no extra SELECT policy needed).
