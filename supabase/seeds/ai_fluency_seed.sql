-- Seed: AI Fluency page — data matching the Nudgeable design (Jun 12 2026 snapshot)
-- Run once after applying migration 20240614_ai_fluency.sql

-- ─── Brief ───────────────────────────────────────────────────────────────────

INSERT INTO public.fluency_briefs (id, title, published_date, is_active) VALUES
  ('00000000-0000-0001-0000-000000000001',
   'What changed in AI in the last 24 hours',
   '2026-06-12',
   true);

INSERT INTO public.fluency_brief_items (brief_id, content, sort_order) VALUES
  ('00000000-0000-0001-0000-000000000001',
   'Google launched Gemini Spark for completing tasks across apps and Gemini Omni for creating and editing videos.',
   1),
  ('00000000-0000-0001-0000-000000000001',
   'Salesforce will spend nearly $300 million on Anthropic AI tokens by 2026 to boost software engineer coding efficiency.',
   2),
  ('00000000-0000-0001-0000-000000000001',
   'Anthropic''s Glasswing, powered by Claude Mythos Preview, shows AI can find critical software bugs faster than teams can verify and fix at scale.',
   3);

-- ─── AI Foundations ──────────────────────────────────────────────────────────

INSERT INTO public.fluency_foundations (title, emoji, module_count, time_minutes, sort_order) VALUES
  ('What AI remembers and forgets',      '🧠', 4, 19, 1),
  ('Giving AI your own knowledge',       '📚', 3, 14, 2),
  ('When AI does things for you',        '⚡', 4, 19, 3),
  ('How AI searches and cites sources',  '🔍', 3, 12, 4),
  ('How to reduce hallucinations',       '🛡️', 5, 21, 5);

-- ─── Videos ──────────────────────────────────────────────────────────────────
-- video_url and thumbnail_url left NULL — upload files to the fluency-videos bucket
-- and update these rows with the Supabase storage paths.

INSERT INTO public.fluency_videos (kicker, title, description, sort_order) VALUES
  ('Google Workspace',
   'We''re introducing Workspace Intelligence.',
   'Introduces Workspace Intelligence as a unified AI layer across Google Workspace.',
   1),
  ('Google Workspace',
   'Google Vids: Direct avatars',
   'Covers direct avatars in Google Vids and how teams can create controlled video drafts.',
   2),
  ('Google Workspace',
   'Learn how Chat helps you move from meeting to action',
   'Explains how Google Chat can help teams continue momentum after meetings.',
   3),
  ('Google Workspace',
   'Learn how Gemini helps you schedule your meetings',
   'Shows how Gemini can reduce back-and-forth in meeting scheduling.',
   4),
  ('Gemini',
   'Build better first drafts with Gemini',
   'Shows how to move from a rough idea to a structured draft faster.',
   5),
  ('Gemini',
   'Use Gemini to summarize long documents',
   'Demonstrates how to extract key points, risks, and decisions from long files.',
   6);

-- ─── Tools ───────────────────────────────────────────────────────────────────

INSERT INTO public.fluency_tools (category_label, name, description, icon_emoji, company_name, sort_order) VALUES
  ('GTM automation',  'Clay',        'Automates GTM research, data enrichment, and personalized outreach workflows for sales and growth teams.', '✨', 'Clay Labs Inc.',  1),
  ('Voice dictation', 'Wispr Flow',  'Voice dictation app that turns spoken words into polished text across desktop, mobile, and web apps.',    '✨', 'Wispr AI, Inc.',  2),
  ('Visual diagrams', 'Napkin',      'Visual idea-to-diagram tool for turning text into visuals.',                                               '✨', 'Napkin AI',       3),
  ('Voice AI',        'ElevenLabs',  'AI voice generation and voice design for audio, narration, and synthetic speech workflows.',               '✨', 'ElevenLabs',      4),
  ('Presentations',   'Gamma',       'AI presentation and page creation tool for quick first drafts and visual storytelling.',                   '✨', 'Gamma',           5),
  ('Research',        'Perplexity',  'Answer engine for web research, source-backed search, and quick market scanning.',                         '✨', 'Perplexity AI',   6);

-- ─── Tool Guides ─────────────────────────────────────────────────────────────

INSERT INTO public.fluency_tool_guides (
  name, logo_letter, description, accent_color, bg_color, border_color,
  company_name, strengths, update_label, update_date, theme_key, sort_order
) VALUES
  ('Claude',  'Cl',
   'Best knowledge work assistant for documents, research, and deep analysis.',
   '#D85A30', '#FAECE7', '#F0997B',
   'Anthropic', ARRAY['Long context window', 'Nuanced reasoning', 'Careful & precise'],
   'New features added', 'Jun 2026', 'claude', 1),
  ('ChatGPT', 'GP',
   'The everyday AI workhorse — great for drafts, code, and brainstorms.',
   '#1D9E75', '#E1F5EE', '#5DCAA5',
   'OpenAI', ARRAY['Huge plugin ecosystem', 'Image generation', 'Voice mode'],
   'Pricing updated', 'May 2026', 'gpt', 2),
  ('Gemini',  'Ge',
   'Google''s AI built into Workspace — ideal if your work lives in Drive.',
   '#7F77DD', '#EEEDFE', '#AFA9EC',
   'Google', ARRAY['Google Docs & Sheets native', 'Real-time web search', 'Multimodal inputs'],
   'New features added', 'Jun 2026', 'gemini', 3),
  ('Copilot', 'Co',
   'Microsoft''s 365 AI layer for emails, slides, Teams, and meeting notes.',
   '#BA7517', '#FAEEDA', '#EF9F27',
   'Microsoft', ARRAY['Office apps integration', 'Teams meeting summaries', 'Outlook drafts'],
   'Model update', 'Apr 2026', 'copilot', 4);
