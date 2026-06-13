-- Pros and cons for fluency_tools.
-- Run AFTER fluency_tools_seed.sql and migration 20240620_fluency_tool_pros_cons.sql.

TRUNCATE public.fluency_tool_pros;
TRUNCATE public.fluency_tool_cons;

INSERT INTO public.fluency_tool_pros (tool_id, content, sort_order) VALUES

-- ChatGPT (86113259-831b-4f42-a50c-05fa8c5a0ded)
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Widest plugin and integration ecosystem of any AI tool', 0),
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'GPT-4o handles text, images, audio, and file uploads in one chat', 1),
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Projects and memory keep context across multiple sessions', 2),

-- Claude (7bc10af1-260e-42f7-b1c4-afd60b860a99)
('7bc10af1-260e-42f7-b1c4-afd60b860a99', '200K+ token context window — handles entire codebases or long documents', 0),
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'Consistently strong at nuanced writing and structured analysis', 1),
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'More cautious and transparent about uncertainty than competitors', 2),

-- Gemini (7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6)
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Deep integration with Google Workspace (Docs, Sheets, Gmail)', 0),
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', '1M+ token context — largest of any major model', 1),
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Built-in Google Search grounding for up-to-date answers', 2),

-- Perplexity (7a01adcf-5e3f-4e81-935c-9f4a97dd59db)
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Every answer comes with numbered citations you can verify', 0),
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Deep Research mode does multi-step web research automatically', 1),
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Much faster at finding current information than pure chatbots', 2),

-- Grok (2c3e20f2-03d0-47cb-8531-499e6f1033be)
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Real-time access to X (Twitter) posts and trending topics', 0),
('2c3e20f2-03d0-47cb-8531-499e6f1033be', '2M token context window — the largest available', 1),

-- Claude Code (ed7d1b0a-5f73-4507-b485-07a47f53dff5)
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Reads and edits your actual codebase files directly', 0),
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Runs tests, linters, and terminal commands autonomously', 1),
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Best-in-class at multi-file refactors and architectural changes', 2),

-- Cursor (50d70978-b934-4c5b-9e4a-0da6733d04df)
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Tab completion is fast and context-aware across the whole repo', 0),
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Familiar VS Code interface — almost no learning curve', 1),
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Composer mode for multi-file changes from a single instruction', 2),

-- DeepSeek V3 (60ae2baa-e92e-4651-837c-efc30c7e308f)
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Matches GPT-4 on coding benchmarks at a fraction of the API cost', 0),
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Open weights — run it locally or self-host for full data control', 1),

-- Grammarly (be624b56-40fa-4632-a502-c514923ed7a9)
('be624b56-40fa-4632-a502-c514923ed7a9', 'Works inside Gmail, Google Docs, Slack, and most web apps', 0),
('be624b56-40fa-4632-a502-c514923ed7a9', 'Tone detector helps match professional or casual register', 1),
('be624b56-40fa-4632-a502-c514923ed7a9', 'Plagiarism checker included in premium tier', 2),

-- Jasper (6f371695-3b43-4060-9fbb-db733bfec4f6)
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'Brand voice feature learns and enforces your company tone', 0),
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'Marketing campaign templates speed up content creation', 1),

-- Notion AI (48add906-1643-413f-a871-3c1aea9d286b)
('48add906-1643-413f-a871-3c1aea9d286b', 'AI lives inside your existing docs — no context switching', 0),
('48add906-1643-413f-a871-3c1aea9d286b', 'Ask questions across your entire workspace with Q&A mode', 1),

-- Gamma (407c69f1-5544-40bc-99d8-3369af2f3761)
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Generates a full styled presentation from a one-line prompt', 0),
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Outputs shareable web links as well as PowerPoint/PDF exports', 1),

-- Napkin (85111687-6584-49e8-9540-10285bae6cd1)
('85111687-6584-49e8-9540-10285bae6cd1', 'Turns plain text into professional diagrams and visuals instantly', 0),
('85111687-6584-49e8-9540-10285bae6cd1', 'High visual quality — suitable for client-facing material', 1),

-- Fireflies (10186e8b-5403-44a5-889a-e057f1f5c843)
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Auto-joins calls across Zoom, Teams, and Meet without setup', 0),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Deep search across all meeting transcripts in one place', 1),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Generates action items, summaries, and follow-up emails', 2),

-- Eleven Labs (3ee1e891-026b-4daf-b125-76ef8a716e4c)
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Most natural-sounding AI voice available — best emotional range', 0),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Clone your own voice from a short audio sample', 1),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', '29+ languages with natural accent and cadence', 2),

-- Zapier (35f85c91-982b-4341-953b-22bffe4e07f6)
('35f85c91-982b-4341-953b-22bffe4e07f6', '7,000+ app integrations — largest of any automation platform', 0),
('35f85c91-982b-4341-953b-22bffe4e07f6', 'No-code builder accessible to non-technical users', 1),

-- Canva (63a21b12-3c3a-48aa-ac15-0eba4f38d250)
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Magic Design generates layouts from a text prompt', 0),
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Massive template library across social, print, and presentation formats', 1),

-- Cursor Replit (7340beca-5f48-4971-adc0-536d94fc0c89)
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Zero local setup — full dev environment runs in the browser', 0),
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Built-in hosting and deployment for quick prototypes', 1),

-- Wispr Flow (a7b0f41c-bba1-488d-a935-65b2559d14d3)
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Works in any text field on desktop and mobile without copy-paste', 0),
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Cleans up filler words and run-ons automatically', 1),

-- NotebookLM (5548792e-e229-4eda-90c2-4c12ee5eddee)
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Answers only from your uploaded sources — no hallucination from training data', 0),
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Audio Overview feature creates a podcast-style summary of your docs', 1);

-- ─── CONS ───────────────────────────────────────────────────────────────────────

INSERT INTO public.fluency_tool_cons (tool_id, content, sort_order) VALUES

-- ChatGPT
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Free tier throttles to GPT-4o mini under load', 0),
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Usage limits on Plus can still be hit during heavy coding sessions', 1),

-- Claude
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'No built-in web search on the free or Pro tier', 0),
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'Rate limits are tighter than ChatGPT at the same price point', 1),

-- Gemini
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Quality can be inconsistent on complex creative writing tasks', 0),
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Workspace integration works best if your team is fully on Google', 1),

-- Perplexity
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Less capable for pure writing or creative generation vs chatbots', 0),
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Deep Research can take several minutes for complex queries', 1),

-- Grok
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Requires an X (Twitter) Premium subscription', 0),
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Fewer integrations and third-party tool support than ChatGPT', 1),

-- Claude Code
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Terminal access means mistakes can modify or delete real files', 0),
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'API usage costs can add up quickly on large codebases', 1),

-- Cursor
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Fast requests quota runs out quickly on the free tier', 0),
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Suggestions can be overconfident on unfamiliar frameworks', 1),

-- DeepSeek V3
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Data is processed on Chinese servers — a concern for sensitive work', 0),
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Chat interface is barebones compared to ChatGPT or Claude', 1),

-- Grammarly
('be624b56-40fa-4632-a502-c514923ed7a9', 'Suggestions can over-sanitise voice in informal writing', 0),
('be624b56-40fa-4632-a502-c514923ed7a9', 'Premium is expensive for individuals at $144/year', 1),

-- Jasper
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'High price point — hard to justify without consistent content volume', 0),
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'Outputs still need editing; rarely publish-ready on first pass', 1),

-- Notion AI
('48add906-1643-413f-a871-3c1aea9d286b', 'Only useful if your team already works in Notion', 0),
('48add906-1643-413f-a871-3c1aea9d286b', 'Less capable than a dedicated AI chatbot for complex reasoning', 1),

-- Gamma
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Design customisation is limited compared to PowerPoint or Figma', 0),
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Free tier watermarks all decks', 1),

-- Fireflies
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Transcription accuracy drops with strong accents or poor audio', 0),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Storage limits on the free plan fill up quickly', 1),

-- Eleven Labs
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Per-character pricing adds up fast for long-form audio', 0),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Real-time voice streaming latency is noticeable in some setups', 1),

-- Zapier
('35f85c91-982b-4341-953b-22bffe4e07f6', 'Becomes expensive quickly — task-based pricing scales poorly', 0),
('35f85c91-982b-4341-953b-22bffe4e07f6', 'Complex multi-step flows can be fragile when APIs change', 1),

-- NotebookLM
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Cannot browse the web — works only from what you upload', 0),
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'No persistent memory between sessions', 1),

-- Wispr Flow
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Requires speaking aloud — not suitable for shared or open-plan offices', 0),

-- Replit
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Performance is slower than a local dev environment for heavy projects', 0),
('7340beca-5f48-4971-adc0-536d94fc0c89', 'AI suggestions are less capable than Cursor or Claude Code', 1),

-- Canva
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'AI features are less powerful than dedicated generation tools', 0),
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Templates can feel generic without significant customisation', 1);
