-- ============================================================
-- Migration 007: functions column + activity_functions lookup
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Functions column on activities (job / team functions, multi-select)
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS functions text[] DEFAULT '{}';

-- 2. Canonical function options (superadmin-managed, like activity_tags)
CREATE TABLE IF NOT EXISTS public.activity_functions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        UNIQUE NOT NULL,
  icon_url   text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_functions: public select" ON public.activity_functions;
CREATE POLICY "activity_functions: public select"
  ON public.activity_functions FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "activity_functions: superadmin write" ON public.activity_functions;
CREATE POLICY "activity_functions: superadmin write"
  ON public.activity_functions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

-- 3. Default functions
INSERT INTO public.activity_functions (name) VALUES
  ('HR'),
  ('Finance'),
  ('Marketing'),
  ('Sales'),
  ('Operations'),
  ('Legal'),
  ('IT'),
  ('Product'),
  ('Customer Success'),
  ('Leadership')
ON CONFLICT (name) DO NOTHING;
