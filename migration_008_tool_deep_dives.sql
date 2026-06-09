-- ============================================================
-- Migration 008: tool deep-dive links (dashboard sidebar)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tool_deep_dives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  url         text NOT NULL,
  description text,
  tool        text,
  position    int  NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tool_deep_dives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tool_deep_dives: public select published" ON public.tool_deep_dives;
CREATE POLICY "tool_deep_dives: public select published"
  ON public.tool_deep_dives FOR SELECT TO public
  USING (published = true);

DROP POLICY IF EXISTS "tool_deep_dives: superadmin all" ON public.tool_deep_dives;
CREATE POLICY "tool_deep_dives: superadmin all"
  ON public.tool_deep_dives FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );
