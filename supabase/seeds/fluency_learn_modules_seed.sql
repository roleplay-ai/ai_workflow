-- Seed: AI Foundations — 10 topic cards (matches ai-foundations-cards.html)
-- Run after migrations 20240615_fluency_learn_modules.sql and 20240628_drop_fluency_worlds.sql
-- Content is delivered via superadmin HTML upload (html_path); no screen player data.

TRUNCATE public.fluency_modules CASCADE;

INSERT INTO public.fluency_modules
  (id, title, description, emoji, concepts, sort_order, next_module_hint, published, is_locked)
VALUES
  ('20000001-0000-0000-0000-000000000001',
   'Tokens', 'How AI counts your words', '🪙',
   ARRAY['Tokens', 'Tokenization'], 1, 'Context Window', true, false),

  ('20000002-0000-0000-0000-000000000001',
   'Context Window', 'How much AI remembers', '🪟',
   ARRAY['Context window', 'Memory limits'], 2, 'Tool Calling', true, false),

  ('20000003-0000-0000-0000-000000000001',
   'Tool Calling', 'AI that does things', '🛠️',
   ARRAY['Tool use', 'Function calling'], 3, 'AI Agents', true, false),

  ('20000004-0000-0000-0000-000000000001',
   'AI Agents', 'AI on autopilot', '🤖',
   ARRAY['Agents', 'Autonomous workflows'], 4, 'API', true, false),

  ('20000005-0000-0000-0000-000000000001',
   'API', 'The AI connector', '🔌',
   ARRAY['API', 'Integration'], 5, 'GenAI vs Other AI', true, false),

  ('20000006-0000-0000-0000-000000000001',
   'GenAI vs Other AI', 'Not all AI is the same', '✨',
   ARRAY['Generative AI', 'Traditional AI'], 6, 'Image Generation', true, false),

  ('20000007-0000-0000-0000-000000000001',
   'Image Generation', 'How AI draws from scratch', '🖼️',
   ARRAY['Image models', 'Diffusion'], 7, 'AI Memory', true, false),

  ('20000008-0000-0000-0000-000000000001',
   'AI Memory', 'Why AI forgets everything', '🧠',
   ARRAY['Memory', 'Context limits'], 8, 'Vibe Coding', true, false),

  ('20000009-0000-0000-0000-000000000001',
   'Vibe Coding', 'Where AI-built apps hit a wall', '💻',
   ARRAY['Vibe coding', 'App building'], 9, 'AI Economics', true, false),

  ('20000010-0000-0000-0000-000000000001',
   'AI Economics', 'Who is actually winning in AI', '📈',
   ARRAY['AI market', 'Economics'], 10, NULL, true, false);
