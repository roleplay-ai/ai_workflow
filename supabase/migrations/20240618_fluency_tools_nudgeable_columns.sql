-- Align fluency_tools with nudgeable's ai_tools schema.
-- Adds letter, color, best_for, pricing, is_featured, is_locked columns.
-- Existing columns (category_label, icon_emoji, company_name, try_url, sort_order, published) are kept.

ALTER TABLE public.fluency_tools
  ADD COLUMN IF NOT EXISTS letter      text,
  ADD COLUMN IF NOT EXISTS color       text NOT NULL DEFAULT '#FFCE00',
  ADD COLUMN IF NOT EXISTS best_for    text,
  ADD COLUMN IF NOT EXISTS pricing     text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked   boolean NOT NULL DEFAULT false;
