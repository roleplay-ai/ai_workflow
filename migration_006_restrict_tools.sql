-- ============================================================
-- Migration 006: seed default tools (custom tools allowed)
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO public.tool_logos (tool, logo_url, updated_at) VALUES
  ('claude',              '', now()),
  ('chatgpt',             '', now()),
  ('gemini',              '', now()),
  ('copilot',             '', now()),
  ('agentic-workflows',   '', now())
ON CONFLICT (tool) DO NOTHING;
