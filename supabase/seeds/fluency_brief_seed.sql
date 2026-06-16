-- fluency_briefs seed — self-contained: creates tables if needed, inserts Jun 12 brief.
-- Safe to re-run (deactivates previous briefs, inserts fresh one).

CREATE TABLE IF NOT EXISTS public.fluency_briefs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text        NOT NULL,
  published_date date        NOT NULL,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz          DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluency_brief_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id   uuid NOT NULL REFERENCES public.fluency_briefs(id) ON DELETE CASCADE,
  content    text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

ALTER TABLE public.fluency_briefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluency_brief_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fluency_briefs' AND policyname = 'Public read active briefs'
  ) THEN
    CREATE POLICY "Public read active briefs"
      ON public.fluency_briefs FOR SELECT TO public USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fluency_brief_items' AND policyname = 'Public read brief items'
  ) THEN
    CREATE POLICY "Public read brief items"
      ON public.fluency_brief_items FOR SELECT TO public USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fluency_briefs' AND policyname = 'Superadmin manage briefs'
  ) THEN
    CREATE POLICY "Superadmin manage briefs"
      ON public.fluency_briefs FOR ALL TO authenticated
      USING  (public.get_my_role() = 'superadmin')
      WITH CHECK (public.get_my_role() = 'superadmin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fluency_brief_items' AND policyname = 'Superadmin manage brief items'
  ) THEN
    CREATE POLICY "Superadmin manage brief items"
      ON public.fluency_brief_items FOR ALL TO authenticated
      USING  (public.get_my_role() = 'superadmin')
      WITH CHECK (public.get_my_role() = 'superadmin');
  END IF;
END $$;

-- Deactivate all previous briefs
UPDATE public.fluency_briefs SET is_active = false;

-- Insert today's brief
WITH new_brief AS (
  INSERT INTO public.fluency_briefs (id, title, published_date, is_active)
  VALUES (
    gen_random_uuid(),
    'What changed in AI the last 24 hours',
    '2026-06-12',
    true
  )
  RETURNING id
)
INSERT INTO public.fluency_brief_items (brief_id, content, sort_order)
SELECT
  new_brief.id,
  item.content,
  item.sort_order
FROM new_brief,
(VALUES
  (0, '🚀 Google launched Gemini Spark for completing tasks across apps and Gemini Omni for creating and editing videos.'),
  (1, '💰 Salesforce will spend nearly $300 million on Anthropic AI tokens by 2026 to boost software engineer coding efficiency and freeze hiring.'),
  (2, '🪪 Anthropic''s Glasswing, powered by Claude Mythos Preview, shows AI can find critical software bugs faster than teams can verify, disclose, and fix at scale today.')
) AS item(sort_order, content);
