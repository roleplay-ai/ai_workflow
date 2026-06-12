-- Full seed: 7 worlds, 22 modules, screens for modules 2.1 and 4.2 (exact from nudgeable).
-- Run AFTER migrations 20240614, 20240615, 20240616.
-- UUIDs: worlds = 0000000N-0000-0000-0000-000000000000
--        modules = 0000000N-000M-0000-0000-000000000000  (N=world, M=module index)

-- ── Clean slate ───────────────────────────────────────────────────────────────
TRUNCATE public.fluency_worlds CASCADE;   -- cascades to modules → screens → progress

-- ══════════════════════════════════════════════════════════════════════════════
-- WORLDS (7)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.fluency_worlds (id, title, description, emoji, color, sort_order) VALUES
  ('00000001-0000-0000-0000-000000000000', 'What is AI?',                     'The basics — what AI is, what it isn''t.',                              '🌱', '#22C55E', 1),
  ('00000002-0000-0000-0000-000000000000', 'How GenAI reads language',        'How AI turns your words into something it understands.',                '🔤', '#3B82F6', 2),
  ('00000003-0000-0000-0000-000000000000', 'How GenAI generates answers',     'Where AI''s answers come from — and when they go wrong.',               '✨', '#A855F7', 3),
  ('00000004-0000-0000-0000-000000000000', 'Get better answers',              'The art of prompting.',                                                '🎯', '#F68A29', 4),
  ('00000005-0000-0000-0000-000000000000', 'What AI remembers (and forgets)', 'Memory, context, and why prompts cost money.',                         '🧠', '#FFCE00', 5),
  ('00000006-0000-0000-0000-000000000000', 'Give AI your own knowledge',      'RAG and grounding AI in your data.',                                   '📚', '#EC4899', 6),
  ('00000007-0000-0000-0000-000000000000', 'When AI does things for you',     'Tools, agents, and automation.',                                       '🤖', '#623CEA', 7);

-- ══════════════════════════════════════════════════════════════════════════════
-- MODULES (22)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.fluency_modules (id, world_id, title, description, emoji, concepts, sort_order, next_module_hint) VALUES

-- World 1 — What is AI? (3 modules)
('00000001-0001-0000-0000-000000000000', '00000001-0000-0000-0000-000000000000',
 'AI vs ML vs Deep Learning',   'Three terms, three layers. Untangle them.',               '🌐',
 ARRAY['AI','ML','Deep Learning'], 1, 'GenAI, LLMs, multimodal'),

('00000001-0002-0000-0000-000000000000', '00000001-0000-0000-0000-000000000000',
 'GenAI, LLMs, multimodal',     'What today''s AI can produce.',                           '🤖',
 ARRAY['GenAI','LLM','Multimodal'], 2, 'What AI can''t do'),

('00000001-0003-0000-0000-000000000000', '00000001-0000-0000-0000-000000000000',
 'What AI can''t do',           'Limitations and built-in bias.',                          '⚠️',
 ARRAY['Limitations','Bias'], 3, 'How AI breaks down your words'),

-- World 2 — How GenAI reads language (2 modules)
('00000002-0001-0000-0000-000000000000', '00000002-0000-0000-0000-000000000000',
 'How AI breaks down your words','Tokens & tokenization.',                                 '✂️',
 ARRAY['Tokens','Tokenization'], 1, 'How AI finds meaning'),

('00000002-0002-0000-0000-000000000000', '00000002-0000-0000-0000-000000000000',
 'How AI finds meaning',        'Embeddings & semantic search.',                           '🔍',
 ARRAY['Embeddings','Semantic Search'], 2, 'Where AI''s knowledge comes from'),

-- World 3 — How GenAI generates answers (3 modules)
('00000003-0001-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
 'Where AI''s knowledge comes from','Training data & parameters.',                         '📖',
 ARRAY['Training Data','Parameters'], 1, 'How AI predicts the next word'),

('00000003-0002-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
 'How AI predicts the next word','Next-token prediction & temperature.',                   '🎲',
 ARRAY['Next-token Prediction','Temperature'], 2, 'When AI makes things up'),

('00000003-0003-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
 'When AI makes things up',     'Hallucinations + chat vs reasoning models.',              '💭',
 ARRAY['Hallucinations','Reasoning Models'], 3, 'Writing clearer prompts'),

-- World 4 — Get better answers (3 modules)
('00000004-0001-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
 'Writing clearer prompts',     'Clarity and specificity wins.',                           '✍️',
 ARRAY['Prompt Clarity','Specificity'], 1, 'Giving AI a role'),

('00000004-0002-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
 'Giving AI a role',            'Role prompting.',                                         '🎭',
 ARRAY['Role Prompting'], 2, 'Showing examples & system prompts'),

('00000004-0003-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
 'Showing examples & system prompts','Few-shot prompting & system prompts.',               '📋',
 ARRAY['Few-shot','System Prompts'], 3, 'The context window'),

-- World 5 — What AI remembers (4 modules)
('00000005-0001-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
 'The context window',          'Input & output tokens.',                                  '🪟',
 ARRAY['Context Window','Input/Output Tokens'], 1, 'Conversation history & memory'),

('00000005-0002-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
 'Conversation history & memory','Short vs long-term memory.',                             '💬',
 ARRAY['Short-term Memory','Long-term Memory'], 2, 'Why prompts cost money'),

('00000005-0003-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
 'Why prompts cost money',      'Cost & latency.',                                         '💰',
 ARRAY['Cost','Latency'], 3, 'Context engineering basics'),

('00000005-0004-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
 'Context engineering basics',  'Set the stage for better answers.',                       '🏗️',
 ARRAY['Context Engineering'], 4, 'What is RAG?'),

-- World 6 — Give AI your own knowledge (3 modules)
('00000006-0001-0000-0000-000000000000', '00000006-0000-0000-0000-000000000000',
 'What is RAG?',                'Retrieval-Augmented Generation & knowledge base.',        '🗄️',
 ARRAY['RAG','Knowledge Base'], 1, 'Chunking & retrieval'),

('00000006-0002-0000-0000-000000000000', '00000006-0000-0000-0000-000000000000',
 'Chunking & retrieval',        'How AI looks up your docs.',                              '📦',
 ARRAY['Chunking','Retrieval'], 2, 'Grounding & citations'),

('00000006-0003-0000-0000-000000000000', '00000006-0000-0000-0000-000000000000',
 'Grounding & citations',       'Trustworthy answers with sources.',                       '📎',
 ARRAY['Grounding','Citations'], 3, 'Tool calling & APIs'),

-- World 7 — When AI does things for you (4 modules)
('00000007-0001-0000-0000-000000000000', '00000007-0000-0000-0000-000000000000',
 'Tool calling & APIs',         'When AI uses other tools.',                               '🔧',
 ARRAY['Tool Calling','APIs'], 1, 'Connectors & workflow automation'),

('00000007-0002-0000-0000-000000000000', '00000007-0000-0000-0000-000000000000',
 'Connectors & workflow automation','Plug AI into your stack.',                            '🔗',
 ARRAY['Connectors','Automation'], 2, 'AI agents'),

('00000007-0003-0000-0000-000000000000', '00000007-0000-0000-0000-000000000000',
 'AI agents',                   'AI that takes actions on its own.',                       '🤖',
 ARRAY['Agents'], 3, 'Guardrails, privacy, evaluation'),

('00000007-0004-0000-0000-000000000000', '00000007-0000-0000-0000-000000000000',
 'Guardrails, privacy, evaluation','Safety, trust, measurement.',                         '🛡️',
 ARRAY['Guardrails','Privacy','Evaluation'], 4, NULL);

-- ══════════════════════════════════════════════════════════════════════════════
-- SCREENS — Module 2.1: How AI breaks down your words (exact from nudgeable)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.fluency_module_screens
  (module_id, screen_type, order_index, label, title, body, examples, caption, question, options, correct_index, feedback, next_text)
VALUES

('00000002-0001-0000-0000-000000000000', 'hook', 0,
  'HOOK',
  'Ever wonder how AI actually "reads" what you type?',
  'It doesn''t see words the way you do.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000002-0001-0000-0000-000000000000', 'idea', 1,
  'THE IDEA',
  'AI breaks your sentence into chunks called tokens.',
  'A token can be a whole word, part of a word, or punctuation. The process is called tokenization.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000002-0001-0000-0000-000000000000', 'example', 2,
  'SEE IT',
  'Tokens in action',
  NULL,
  '[
    {"tone":"neutral","label":"Whole words","text":"\"I love pizza\"","tokens":["I","love","pizza"]},
    {"tone":"neutral","label":"Word pieces","text":"\"Unbelievable\"","tokens":["Un","believ","able"]}
  ]'::jsonb,
  'Notice: long or unusual words get split into pieces.',
  NULL, NULL, NULL, NULL, NULL),

('00000002-0001-0000-0000-000000000000', 'why', 3,
  'WHY IT MATTERS',
  'Why this should matter to you',
  'AI charges by tokens. More tokens = higher cost + slower replies. Short, clear prompts win.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000002-0001-0000-0000-000000000000', 'check', 4,
  'QUICK CHECK',
  NULL, NULL, NULL, NULL,
  'Roughly how many tokens is "AI is amazing"?',
  '["1","3","10"]'::jsonb, 1,
  'Each short word ≈ 1 token. So 3 words ≈ 3 tokens.',
  NULL),

('00000002-0001-0000-0000-000000000000', 'unlocked', 5,
  NULL,
  'Module complete',
  'You now understand how AI reads and counts your words — and why it matters.',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'How AI finds meaning');

-- ══════════════════════════════════════════════════════════════════════════════
-- SCREENS — Module 4.2: Giving AI a role (exact from nudgeable)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.fluency_module_screens
  (module_id, screen_type, order_index, label, title, body, examples, caption, question, options, correct_index, feedback, next_text)
VALUES

('00000004-0002-0000-0000-000000000000', 'hook', 0,
  'HOOK',
  'Same question. Different answers.',
  'The trick? Tell AI who to be.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000004-0002-0000-0000-000000000000', 'idea', 1,
  'THE IDEA',
  'Role prompting',
  'Tell AI to act as a specific persona. Example: "You are a strict editor." It shifts tone, depth, and focus instantly.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000004-0002-0000-0000-000000000000', 'example', 2,
  'SEE THE DIFFERENCE',
  'Same task. Sharper answer.',
  NULL,
  '[
    {"tone":"bad","label":"Without a role","text":"Review my email."},
    {"tone":"good","label":"With a role","text":"You are a no-nonsense executive coach. Review my email for clarity and confidence."}
  ]'::jsonb,
  NULL, NULL, NULL, NULL, NULL, NULL),

('00000004-0002-0000-0000-000000000000', 'why', 3,
  'WHY IT MATTERS',
  'Roles give AI a lens',
  'Without one: generic answers. With one: focused, useful answers.',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL),

('00000004-0002-0000-0000-000000000000', 'check', 4,
  'QUICK CHECK',
  NULL, NULL, NULL, NULL,
  'Which prompt will likely give a sharper answer?',
  '["Tell me about leadership","You are a Harvard executive coach. Give me 3 leadership traits that fail in remote teams."]'::jsonb,
  1,
  'Specific role + specific task = focused, useful answer.',
  NULL),

('00000004-0002-0000-0000-000000000000', 'unlocked', 5,
  NULL,
  'Module complete',
  'You now know how to set AI''s perspective before you start — and why it changes everything.',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'Showing examples & system prompts');
