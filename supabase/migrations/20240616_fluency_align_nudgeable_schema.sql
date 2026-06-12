-- Align fluency_module_screens with nudgeable's module_screens schema.
-- Drops separate options/tokens tables; adds JSONB columns to match nudgeable exactly.

-- ── Drop dependent tables ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.fluency_screen_options CASCADE;
DROP TABLE IF EXISTS public.fluency_screen_tokens  CASCADE;

-- ── Drop old columns ──────────────────────────────────────────────────────────
ALTER TABLE public.fluency_module_screens
  DROP COLUMN IF EXISTS tone,
  DROP COLUMN IF EXISTS feedback_correct,
  DROP COLUMN IF EXISTS feedback_incorrect,
  DROP COLUMN IF EXISTS next_module_title;

-- ── Add nudgeable-aligned columns ─────────────────────────────────────────────
ALTER TABLE public.fluency_module_screens
  ADD COLUMN IF NOT EXISTS examples      jsonb,   -- [{tone,label,text,tokens:[]}]
  ADD COLUMN IF NOT EXISTS caption       text,
  ADD COLUMN IF NOT EXISTS options       jsonb,   -- ["A","B","C"]
  ADD COLUMN IF NOT EXISTS correct_index int,
  ADD COLUMN IF NOT EXISTS feedback      text,
  ADD COLUMN IF NOT EXISTS next_text     text;

-- ── Add color to fluency_worlds (nudgeable doesn't have it; we need it) ───────
ALTER TABLE public.fluency_worlds
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#FFCE00';
