-- Seed: AI Foundations — 1 world, 5 modules, 6 screens each
-- Run after migration 20240615_fluency_learn_modules.sql

-- ── World ──────────────────────────────────────────────────────────────────
INSERT INTO public.fluency_worlds (id, title, description, emoji, color, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001',
   'AI Foundations',
   'Core concepts for working effectively with AI',
   '🧠', '#FFCE00', 1);

-- ── Modules ────────────────────────────────────────────────────────────────
INSERT INTO public.fluency_modules (id, world_id, title, emoji, concepts, sort_order, next_module_hint) VALUES
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'What AI remembers and forgets', '🧠',
   ARRAY['Context window','Memory limits','Conversation reset'],
   1, 'Giving AI your own knowledge'),

  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   'Giving AI your own knowledge', '📚',
   ARRAY['Custom instructions','RAG','Context injection'],
   2, 'When AI does things for you'),

  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   'When AI does things for you', '⚡',
   ARRAY['AI agents','Tool use','Autonomous workflows'],
   3, 'How AI searches and cites sources'),

  ('20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   'How AI searches and cites sources', '🔍',
   ARRAY['Grounded search','Citations','Source verification'],
   4, 'How to reduce hallucinations'),

  ('20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001',
   'How to reduce hallucinations', '🛡️',
   ARRAY['Hallucinations','Grounding','Prompt strategies'],
   5, NULL);

-- ══════════════════════════════════════════════════════════════════════════
-- MODULE 1 — What AI remembers and forgets
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body) VALUES

  ('31000001-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'hook', 0,
   'Have you ever had AI forget something critical?',
   'You set the tone at the start of a conversation. Ten messages later, the AI is writing in a completely different style — as if you never said a thing. This is not a bug. It is how AI memory works. Understanding it changes how you use these tools.'),

  ('31000002-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'idea', 1,
   'AI has a context window, not a memory',
   'Every AI conversation lives inside a context window — a fixed block of text the model can see at once. It reads everything inside that window and uses it to respond. When the conversation grows too long, older parts fall out of the window. The AI does not decide to forget — the information is simply no longer there.'),

  ('31000003-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'example', 2,
   'When context runs out',
   'You open a chat and say: ''Write everything in a formal tone.'' Then you ask 20 follow-up questions. By question 15, the AI is writing casually — because your instruction has been pushed outside the context window. It cannot follow a rule it can no longer see.'),

  ('31000004-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'why', 3,
   'Why this changes how you work',
   'Long sessions drift. Re-state key instructions when you start a new topic. Use AI tools with built-in memory for ongoing projects. And when something critical is not sticking — start fresh and set the context again at the top. Knowing this lets you work with AI instead of fighting it.'),

  ('31000005-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'check', 4,
   NULL, NULL);

UPDATE public.fluency_module_screens
SET question           = 'Why does AI seem to "forget" instructions in a long conversation?',
    feedback_correct   = 'Exactly. The context window is finite — old messages fall out and the AI can no longer see them.',
    feedback_incorrect = 'Not quite. It is not about processing power or a fixed reset — it is the context window size that determines what the AI can see.'
WHERE id = '31000005-0000-0000-0000-000000000001';

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body, next_module_title) VALUES
  ('31000006-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 'unlocked', 5,
   'You got it.',
   'AI does not have persistent memory like you do. It has a window. Now you know how to work with that.',
   'Giving AI your own knowledge');

-- Check options for M1
INSERT INTO public.fluency_screen_options (screen_id, option_text, is_correct, order_index) VALUES
  ('31000005-0000-0000-0000-000000000001', 'It ran out of processing power',                            false, 0),
  ('31000005-0000-0000-0000-000000000001', 'The instructions fell outside its context window',          true,  1),
  ('31000005-0000-0000-0000-000000000001', 'It is designed to reset after a fixed number of messages',  false, 2);

-- Example tokens for M1
INSERT INTO public.fluency_screen_tokens (screen_id, token_text, style, order_index) VALUES
  ('31000003-0000-0000-0000-000000000001', 'formal tone',                   'highlight', 0),
  ('31000003-0000-0000-0000-000000000001', 'pushed outside the context window', 'highlight', 1),
  ('31000003-0000-0000-0000-000000000001', 'cannot follow a rule it cannot see', 'dimmed', 2);

-- ══════════════════════════════════════════════════════════════════════════
-- MODULE 2 — Giving AI your own knowledge
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body) VALUES

  ('32000001-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'hook', 0,
   'Generic AI gives generic answers.',
   'What if you could brief an AI on your company, your product, your writing style, or your policies — before you even start? This changes AI from a tool into something that actually understands your world.'),

  ('32000002-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'idea', 1,
   'Your knowledge, the AI''s intelligence',
   'You can feed AI your own documents, instructions, or data — a technique called Retrieval-Augmented Generation (RAG) or context injection. The underlying model does not change, but it now has access to your specific context. It can answer questions, write in your style, and make decisions using your actual material instead of generic training data.'),

  ('32000003-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'example', 2,
   'Same question, very different answers',
   'Without context: ''Write a proposal intro.'' Result: something generic and forgettable. With context: ''Here is our brand guide and three past proposals. Write a proposal intro.'' Result: matches your voice, references your real differentiators, hits the right tone. Same AI. Different input.'),

  ('32000004-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'why', 3,
   'Why it matters beyond writing',
   'Any task requiring institutional knowledge — onboarding docs, policy summaries, contract analysis, customer comms — gets dramatically better when you give AI the source material. The skill is knowing what to include and how to frame it. Most people skip this step. That gap is where your advantage lives.'),

  ('32000005-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'check', 4,
   NULL, NULL);

UPDATE public.fluency_module_screens
SET question           = 'What does giving AI your own knowledge actually achieve?',
    feedback_correct   = 'Exactly. RAG and context injection let AI reason over your specific material without any model retraining.',
    feedback_incorrect = 'Not quite. You are not retraining the model and speed is not the benefit. Relevance and accuracy are.'
WHERE id = '32000005-0000-0000-0000-000000000001';

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body, next_module_title) VALUES
  ('32000006-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', 'unlocked', 5,
   'You got it.',
   'Grounding AI in your world transforms it from a generic tool into something that actually knows your context.',
   'When AI does things for you');

-- Check options for M2
INSERT INTO public.fluency_screen_options (screen_id, option_text, is_correct, order_index) VALUES
  ('32000005-0000-0000-0000-000000000001', 'It trains a new custom AI model just for you',                         false, 0),
  ('32000005-0000-0000-0000-000000000001', 'The AI can answer using your specific documents and context',          true,  1),
  ('32000005-0000-0000-0000-000000000001', 'It makes the AI faster at responding',                                 false, 2);

-- Example tokens for M2
INSERT INTO public.fluency_screen_tokens (screen_id, token_text, style, order_index) VALUES
  ('32000003-0000-0000-0000-000000000001', 'brand guide and three past proposals', 'highlight', 0),
  ('32000003-0000-0000-0000-000000000001', 'generic and forgettable',              'dimmed',    1),
  ('32000003-0000-0000-0000-000000000001', 'Same AI. Different input.',            'highlight', 2);

-- ══════════════════════════════════════════════════════════════════════════
-- MODULE 3 — When AI does things for you
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body) VALUES

  ('33000001-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'hook', 0,
   'AI can now take action, not just answer.',
   'Browsing the web. Writing code. Sending emails. Booking meetings. Completing multi-step tasks — all without you doing each step. This is agentic AI. And it changes what is actually possible.'),

  ('33000002-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'idea', 1,
   'From answering to acting',
   'Agentic AI uses tools — web search, code execution, file access, APIs — to complete tasks across multiple steps. It does not just tell you how to do something. It does it. The key distinction is AI as a responder versus AI as an agent taking real actions in your world.'),

  ('33000003-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'example', 2,
   'Two ways to prepare for a meeting',
   'Without agents: ''How do I research a company before a meeting?'' AI gives you a list of tips. With agents: ''Research Acme Corp before my Tuesday meeting.'' AI searches the web, summarizes their recent news, identifies competitors, and drafts a one-page brief — automatically.'),

  ('33000004-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'why', 3,
   'What this means for your work',
   'Repetitive, multi-step workflows — the tasks that take hours — are the best candidates for agents. The skill is not doing less. It is deciding which steps need your judgment and which ones can be handed off. That discernment is what separates people who gain leverage from those who just get more notifications.'),

  ('33000005-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'check', 4,
   NULL, NULL);

UPDATE public.fluency_module_screens
SET question           = 'What makes agentic AI different from regular AI chat?',
    feedback_correct   = 'Exactly. Agentic AI acts — it uses tools and completes tasks across multiple steps, not just responses.',
    feedback_incorrect = 'Not quite. Length and cost are not the defining factors. The ability to take action is.'
WHERE id = '33000005-0000-0000-0000-000000000001';

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body, next_module_title) VALUES
  ('33000006-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003', 'unlocked', 5,
   'You got it.',
   'You now understand what agentic AI is — and where it fits in real workflows.',
   'How AI searches and cites sources');

-- Check options for M3
INSERT INTO public.fluency_screen_options (screen_id, option_text, is_correct, order_index) VALUES
  ('33000005-0000-0000-0000-000000000001', 'It gives longer, more detailed answers',                          false, 0),
  ('33000005-0000-0000-0000-000000000001', 'It can take actions and use external tools to complete tasks',    true,  1),
  ('33000005-0000-0000-0000-000000000001', 'It costs significantly less to run',                              false, 2);

-- Example tokens for M3
INSERT INTO public.fluency_screen_tokens (screen_id, token_text, style, order_index) VALUES
  ('33000003-0000-0000-0000-000000000001', 'Research Acme Corp before my Tuesday meeting', 'highlight', 0),
  ('33000003-0000-0000-0000-000000000001', 'automatically',                                'highlight', 1),
  ('33000003-0000-0000-0000-000000000001', 'list of tips',                                 'dimmed',    2);

-- ══════════════════════════════════════════════════════════════════════════
-- MODULE 4 — How AI searches and cites sources
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body) VALUES

  ('34000001-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'hook', 0,
   'AI stated a fact confidently. It was completely wrong.',
   'You asked a simple research question. The answer was detailed, polished, and totally fabricated. Search-connected AI with citations changes this calculus entirely. Here is how.'),

  ('34000002-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'idea', 1,
   'How search-grounded AI works',
   'Some AI tools can search the web in real time and base their answers on actual retrieved pages — not just training data. The critical difference is citations. They let you verify whether the AI''s answer matches what the source actually says, turning AI output into something you can check.'),

  ('34000003-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'example', 2,
   'Cited vs. uncited answers',
   'Uncited: ''Company X raised $50M last year.'' Could be true. Could be hallucinated. You cannot tell. Cited: ''Company X raised $50M in Series B. Source: TechCrunch, March 2024.'' Now you can click the link and verify. Same fact — very different confidence.'),

  ('34000004-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'why', 3,
   'Why citations are a workflow upgrade',
   'Use cited AI for research, fact-checking, competitive analysis — anywhere the source matters as much as the answer. Uncited answers still have their place for brainstorming and drafting. The skill is knowing which mode you need and choosing tools accordingly.'),

  ('34000005-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'check', 4,
   NULL, NULL);

UPDATE public.fluency_module_screens
SET question           = 'What does a cited AI answer give you that an uncited answer does not?',
    feedback_correct   = 'Exactly. Citations let you verify the source — transforming AI output into something you can actually check.',
    feedback_incorrect = 'Close, but not quite. Citations do not guarantee correctness — they give you a way to verify. Speed is not the benefit either.'
WHERE id = '34000005-0000-0000-0000-000000000001';

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body, next_module_title) VALUES
  ('34000006-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004', 'unlocked', 5,
   'You got it.',
   'You now know how to work with search-connected AI and why verifiability matters more than confidence.',
   'How to reduce hallucinations');

-- Check options for M4
INSERT INTO public.fluency_screen_options (screen_id, option_text, is_correct, order_index) VALUES
  ('34000005-0000-0000-0000-000000000001', 'A guarantee that the answer is correct',              false, 0),
  ('34000005-0000-0000-0000-000000000001', 'A way to verify where the information came from',    true,  1),
  ('34000005-0000-0000-0000-000000000001', 'Faster responses from the AI',                       false, 2);

-- Example tokens for M4
INSERT INTO public.fluency_screen_tokens (screen_id, token_text, style, order_index) VALUES
  ('34000003-0000-0000-0000-000000000001', 'Source: TechCrunch, March 2024', 'highlight', 0),
  ('34000003-0000-0000-0000-000000000001', 'hallucinated',                   'dimmed',    1),
  ('34000003-0000-0000-0000-000000000001', 'click the link and verify',      'highlight', 2);

-- ══════════════════════════════════════════════════════════════════════════
-- MODULE 5 — How to reduce hallucinations
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body) VALUES

  ('35000001-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'hook', 0,
   'AI said it confidently. It was completely made up.',
   'Not a small error. A detailed, plausible-sounding answer that had no basis in reality. Why does this happen — even with advanced AI — and what can you actually do about it?'),

  ('35000002-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'idea', 1,
   'AI predicts. It does not verify.',
   'Hallucinations happen because AI generates the most plausible-sounding text — it does not look up facts. When there is no ground truth in its context, it fills the gap with confident text that may be entirely false. It is not lying. It is pattern-matching without a fact-checking layer.'),

  ('35000003-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'example', 2,
   'Same task, very different risk',
   'High risk: ''What are the FDA requirements for drug X?'' AI may confidently fabricate regulatory details. Lower risk: ''Here is the FDA guidance document — summarize the key requirements.'' The document is the ground truth. AI is now summarizing, not inventing.'),

  ('35000004-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'why', 3,
   'How to use this in practice',
   'The pattern: high-stakes answers need grounding. Give AI the source documents. Ask it to cite within its answer. Then verify the parts that matter most. This is not about avoiding AI — it is about knowing when to provide the ground truth it needs to be reliable.'),

  ('35000005-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'check', 4,
   NULL, NULL);

UPDATE public.fluency_module_screens
SET question           = 'Which approach best reduces the risk of AI hallucination?',
    feedback_correct   = 'Exactly. Giving AI source documents and asking for citations is the most reliable way to ground its answers.',
    feedback_incorrect = 'Not quite. Shorter prompts and avoiding AI do not address the root cause. Grounding is the answer.'
WHERE id = '35000005-0000-0000-0000-000000000001';

INSERT INTO public.fluency_module_screens
  (id, module_id, screen_type, order_index, title, body, next_module_title) VALUES
  ('35000006-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000005', 'unlocked', 5,
   'You got it.',
   'You now understand why AI hallucinates and the prompt strategies that reduce it. That is all five foundations.',
   NULL);

-- Check options for M5
INSERT INTO public.fluency_screen_options (screen_id, option_text, is_correct, order_index) VALUES
  ('35000005-0000-0000-0000-000000000001', 'Use shorter prompts',                                              false, 0),
  ('35000005-0000-0000-0000-000000000001', 'Give AI source documents and ask it to cite its answer',           true,  1),
  ('35000005-0000-0000-0000-000000000001', 'Only use AI for creative tasks, not factual ones',                 false, 2);

-- Example tokens for M5
INSERT INTO public.fluency_screen_tokens (screen_id, token_text, style, order_index) VALUES
  ('35000003-0000-0000-0000-000000000001', 'fabricate regulatory details',     'dimmed',    0),
  ('35000003-0000-0000-0000-000000000001', 'ground truth',                     'highlight', 1),
  ('35000003-0000-0000-0000-000000000001', 'summarizing, not inventing',        'highlight', 2);
