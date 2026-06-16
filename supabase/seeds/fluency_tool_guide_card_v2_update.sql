-- AI Tool Guide cards v2 — full setup (safe to re-run)
-- Creates the table if missing, adds v2 columns, seeds/updates the four chatbot cards.

-- ─── 1. Table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fluency_tool_guides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  logo_letter  text        NOT NULL DEFAULT '-',
  description  text,
  accent_color text        NOT NULL DEFAULT '#FFCE00',
  bg_color     text        NOT NULL DEFAULT '#FFF6CF',
  border_color text        NOT NULL DEFAULT '#F0D978',
  guide_url    text,
  sort_order   int         NOT NULL DEFAULT 0,
  published    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz          DEFAULT now(),
  company_name text,
  strengths    text[]               DEFAULT '{}',
  update_label text,
  update_date  text,
  theme_key    text
);

ALTER TABLE public.fluency_tool_guides
  ADD COLUMN IF NOT EXISTS company_name  text,
  ADD COLUMN IF NOT EXISTS strengths     text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS update_label  text,
  ADD COLUMN IF NOT EXISTS update_date   text,
  ADD COLUMN IF NOT EXISTS theme_key     text;

-- ─── 2. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.fluency_tool_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published tool guides" ON public.fluency_tool_guides;
CREATE POLICY "Public read published tool guides"
  ON public.fluency_tool_guides FOR SELECT TO public
  USING (published = true);

DROP POLICY IF EXISTS "Superadmin manage tool guides" ON public.fluency_tool_guides;
CREATE POLICY "Superadmin manage tool guides"
  ON public.fluency_tool_guides FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ─── 3. Seed rows (insert if missing) ────────────────────────────────────────

INSERT INTO public.fluency_tool_guides (name, logo_letter, description, accent_color, bg_color, border_color, company_name, strengths, update_label, update_date, theme_key, sort_order)
SELECT 'Claude', '-', 'Best knowledge work assistant for documents, research, and deep analysis.', '#D85A30', '#FAECE7', '#F0997B', 'Anthropic', ARRAY['Long context window', 'Nuanced reasoning', 'Careful & precise'], 'New features added', 'Jun 2026', 'claude', 1
WHERE NOT EXISTS (SELECT 1 FROM public.fluency_tool_guides WHERE name = 'Claude');

INSERT INTO public.fluency_tool_guides (name, logo_letter, description, accent_color, bg_color, border_color, company_name, strengths, update_label, update_date, theme_key, sort_order)
SELECT 'ChatGPT', '-', 'The everyday AI workhorse — great for drafts, code, and brainstorms.', '#1D9E75', '#E1F5EE', '#5DCAA5', 'OpenAI', ARRAY['Huge plugin ecosystem', 'Image generation', 'Voice mode'], 'Pricing updated', 'May 2026', 'gpt', 2
WHERE NOT EXISTS (SELECT 1 FROM public.fluency_tool_guides WHERE name = 'ChatGPT');

INSERT INTO public.fluency_tool_guides (name, logo_letter, description, accent_color, bg_color, border_color, company_name, strengths, update_label, update_date, theme_key, sort_order)
SELECT 'Gemini', '-', 'Google''s AI built into Workspace — ideal if your work lives in Drive.', '#7F77DD', '#EEEDFE', '#AFA9EC', 'Google', ARRAY['Google Docs & Sheets native', 'Real-time web search', 'Multimodal inputs'], 'New features added', 'Jun 2026', 'gemini', 3
WHERE NOT EXISTS (SELECT 1 FROM public.fluency_tool_guides WHERE name = 'Gemini');

INSERT INTO public.fluency_tool_guides (name, logo_letter, description, accent_color, bg_color, border_color, company_name, strengths, update_label, update_date, theme_key, sort_order)
SELECT 'Copilot', '-', 'Microsoft''s 365 AI layer for emails, slides, Teams, and meeting notes.', '#BA7517', '#FAEEDA', '#EF9F27', 'Microsoft', ARRAY['Office apps integration', 'Teams meeting summaries', 'Outlook drafts'], 'Model update', 'Apr 2026', 'copilot', 4
WHERE NOT EXISTS (SELECT 1 FROM public.fluency_tool_guides WHERE name = 'Copilot');

-- ─── 4. Patch existing rows ──────────────────────────────────────────────────

UPDATE public.fluency_tool_guides SET
  description   = 'Best knowledge work assistant for documents, research, and deep analysis.',
  company_name  = 'Anthropic',
  strengths     = ARRAY['Long context window', 'Nuanced reasoning', 'Careful & precise'],
  update_label  = 'New features added',
  update_date   = 'Jun 2026',
  theme_key     = 'claude',
  accent_color  = '#D85A30',
  bg_color      = '#FAECE7',
  border_color  = '#F0997B',
  sort_order    = 1
WHERE name = 'Claude';

UPDATE public.fluency_tool_guides SET
  description   = 'The everyday AI workhorse — great for drafts, code, and brainstorms.',
  company_name  = 'OpenAI',
  strengths     = ARRAY['Huge plugin ecosystem', 'Image generation', 'Voice mode'],
  update_label  = 'Pricing updated',
  update_date   = 'May 2026',
  theme_key     = 'gpt',
  accent_color  = '#1D9E75',
  bg_color      = '#E1F5EE',
  border_color  = '#5DCAA5',
  sort_order    = 2
WHERE name = 'ChatGPT';

UPDATE public.fluency_tool_guides SET
  description   = 'Google''s AI built into Workspace — ideal if your work lives in Drive.',
  company_name  = 'Google',
  strengths     = ARRAY['Google Docs & Sheets native', 'Real-time web search', 'Multimodal inputs'],
  update_label  = 'New features added',
  update_date   = 'Jun 2026',
  theme_key     = 'gemini',
  accent_color  = '#7F77DD',
  bg_color      = '#EEEDFE',
  border_color  = '#AFA9EC',
  sort_order    = 3
WHERE name = 'Gemini';

UPDATE public.fluency_tool_guides SET
  description   = 'Microsoft''s 365 AI layer for emails, slides, Teams, and meeting notes.',
  company_name  = 'Microsoft',
  strengths     = ARRAY['Office apps integration', 'Teams meeting summaries', 'Outlook drafts'],
  update_label  = 'Model update',
  update_date   = 'Apr 2026',
  theme_key     = 'copilot',
  accent_color  = '#BA7517',
  bg_color      = '#FAEEDA',
  border_color  = '#EF9F27',
  sort_order    = 4
WHERE name = 'Copilot';
