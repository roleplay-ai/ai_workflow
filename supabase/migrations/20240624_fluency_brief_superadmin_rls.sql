-- Ensure superadmin can write fluency briefs (seed-only setups often miss these policies).
-- Uses security-definer get_my_role() so the check is not blocked by profiles RLS.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

DROP POLICY IF EXISTS "Superadmin manage briefs" ON public.fluency_briefs;
CREATE POLICY "Superadmin manage briefs"
  ON public.fluency_briefs FOR ALL TO authenticated
  USING  (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin manage brief items" ON public.fluency_brief_items;
CREATE POLICY "Superadmin manage brief items"
  ON public.fluency_brief_items FOR ALL TO authenticated
  USING  (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');
