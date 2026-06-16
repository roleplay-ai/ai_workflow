-- AI Tool Guide cards v2: company, strengths, update pill, theme key

ALTER TABLE public.fluency_tool_guides
  ADD COLUMN IF NOT EXISTS company_name  text,
  ADD COLUMN IF NOT EXISTS strengths     text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS update_label  text,
  ADD COLUMN IF NOT EXISTS update_date   text,
  ADD COLUMN IF NOT EXISTS theme_key     text;

COMMENT ON COLUMN public.fluency_tool_guides.company_name IS 'Vendor line shown as "by …" under the tool name';
COMMENT ON COLUMN public.fluency_tool_guides.strengths     IS 'Bullet strengths shown on the card body';
COMMENT ON COLUMN public.fluency_tool_guides.update_label  IS 'Update pill primary text, e.g. "New features added"';
COMMENT ON COLUMN public.fluency_tool_guides.update_date   IS 'Update pill date, e.g. "Jun 2026"';
COMMENT ON COLUMN public.fluency_tool_guides.theme_key     IS 'Card theme slug: claude, gpt, gemini, copilot';
