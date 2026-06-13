-- Pros and cons for fluency_tools, shown in the tool detail modal.

CREATE TABLE IF NOT EXISTS public.fluency_tool_pros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid NOT NULL REFERENCES public.fluency_tools(id) ON DELETE CASCADE,
  content    text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.fluency_tool_cons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid NOT NULL REFERENCES public.fluency_tools(id) ON DELETE CASCADE,
  content    text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

ALTER TABLE public.fluency_tool_pros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_tool_cons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tool pros"
  ON public.fluency_tool_pros FOR SELECT TO public USING (true);

CREATE POLICY "Public read tool cons"
  ON public.fluency_tool_cons FOR SELECT TO public USING (true);

CREATE POLICY "Superadmin manage tool pros"
  ON public.fluency_tool_pros FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin manage tool cons"
  ON public.fluency_tool_cons FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
