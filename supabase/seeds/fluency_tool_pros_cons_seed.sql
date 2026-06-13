-- Pros and cons for all fluency_tools (52 tools).
-- Run AFTER fluency_tools_seed.sql and migration 20240620_fluency_tool_pros_cons.sql.

TRUNCATE public.fluency_tool_pros;
TRUNCATE public.fluency_tool_cons;

-- ─── PROS ───────────────────────────────────────────────────────────────────────

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
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Strong at current news and social media analysis', 2),

-- Mistral Large (0c8c11cc-87a1-4b0e-870f-40bbd57929b5)
('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'Strong multilingual support across all major European languages', 0),
('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'Competitive with GPT-4 on benchmarks at lower API cost', 1),
('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'Data residency in Europe — suitable for GDPR-sensitive workloads', 2),

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

-- AI Studio (608f458d-53a2-4477-bc82-77f32f169da0)
('608f458d-53a2-4477-bc82-77f32f169da0', 'Free access to Gemini models for prototyping with no billing required', 0),
('608f458d-53a2-4477-bc82-77f32f169da0', '1M token context available even on the free tier', 1),
('608f458d-53a2-4477-bc82-77f32f169da0', 'Instant API key generation — go from idea to working call in minutes', 2),

-- OpenAI Tokenizer (b1391927-1827-4051-9904-eb3794d9744e)
('b1391927-1827-4051-9904-eb3794d9744e', 'Free tool that shows exactly how text maps to model tokens', 0),
('b1391927-1827-4051-9904-eb3794d9744e', 'Helps optimise prompts to stay within context window limits', 1),
('b1391927-1827-4051-9904-eb3794d9744e', 'Works across GPT-3.5, GPT-4, and all major OpenAI models', 2),

-- NotebookLM (5548792e-e229-4eda-90c2-4c12ee5eddee)
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Answers only from your uploaded sources — no hallucination from training data', 0),
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Audio Overview feature creates a podcast-style summary of your docs', 1),
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Supports PDFs, Google Docs, YouTube links, and audio files', 2),

-- Glean (e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2)
('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'Searches Slack, Docs, Jira, Confluence, and 100+ tools in one query', 0),
('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'Permission-aware — employees only see results they are authorised to access', 1),
('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'AI summaries surface answers without opening each source document', 2),

-- Atlas (af8d8f0c-0111-4497-b821-79e0ffbd6304)
('af8d8f0c-0111-4497-b821-79e0ffbd6304', 'Use ChatGPT while browsing any page without switching tabs', 0),
('af8d8f0c-0111-4497-b821-79e0ffbd6304', 'Can summarise, extract, and analyse any web content in context', 1),

-- Claude Cowork (94613f31-49bd-4cd4-b714-5346d1ab3af3)
('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Direct file and tool access for longer autonomous work sessions', 0),
('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Handles multi-step knowledge work without constant prompting', 1),
('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Tight integration with Claude''s best reasoning and writing abilities', 2),

-- Flow (312dfbcd-22d6-4d41-ad4f-951919012b58)
('312dfbcd-22d6-4d41-ad4f-951919012b58', 'Generates and organises visual creative ideas from a text description', 0),
('312dfbcd-22d6-4d41-ad4f-951919012b58', 'Integrates with Google''s creative suite for fast iteration', 1),

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

-- Canva (63a21b12-3c3a-48aa-ac15-0eba4f38d250)
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Magic Design generates layouts from a text prompt', 0),
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Massive template library across social, print, and presentation formats', 1),
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'AI background removal and image editing built into the free plan', 2),

-- Gamma (407c69f1-5544-40bc-99d8-3369af2f3761)
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Generates a full styled presentation from a one-line prompt', 0),
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Outputs shareable web links as well as PowerPoint/PDF exports', 1),

-- Napkin (85111687-6584-49e8-9540-10285bae6cd1)
('85111687-6584-49e8-9540-10285bae6cd1', 'Turns plain text into professional diagrams and visuals instantly', 0),
('85111687-6584-49e8-9540-10285bae6cd1', 'High visual quality — suitable for client-facing material', 1),

-- Fireflies (10186e8b-5403-44a5-889a-e057f1f5c843)
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Auto-joins calls across Zoom, Teams, and Meet without setup', 0),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Deep search across all meeting transcripts in one place', 1),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Generates action items, summaries, and follow-up emails automatically', 2),

-- Otter.ai (e0d3b56d-cf6c-46a1-930d-68aaabf93606)
('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Identifies and labels different speakers automatically', 0),
('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Collaborative notes let team members highlight and comment in real time', 1),
('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Integrates directly with Zoom, Teams, and Google Meet', 2),

-- Vapi (9edc9b96-4cdc-4cd0-9538-8b0217bd7bee)
('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Industry-leading sub-500ms latency for natural real-time voice conversations', 0),
('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Supports function calling so agents can take real actions mid-call', 1),
('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Works with any LLM as the reasoning layer — not locked to one model', 2),

-- Eleven Labs (3ee1e891-026b-4daf-b125-76ef8a716e4c)
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Most natural-sounding AI voice available — best emotional range', 0),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Clone your own voice from a short audio sample', 1),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', '29+ languages with natural accent and cadence', 2),

-- Zapier (35f85c91-982b-4341-953b-22bffe4e07f6)
('35f85c91-982b-4341-953b-22bffe4e07f6', '7,000+ app integrations — largest of any automation platform', 0),
('35f85c91-982b-4341-953b-22bffe4e07f6', 'No-code builder accessible to non-technical users', 1),
('35f85c91-982b-4341-953b-22bffe4e07f6', 'Zapier Central for building AI agents on top of your automations', 2),

-- Make (33736daa-da57-4886-9e3c-8fe02c28614a)
('33736daa-da57-4886-9e3c-8fe02c28614a', 'Visual canvas makes complex multi-step workflows easy to understand and debug', 0),
('33736daa-da57-4886-9e3c-8fe02c28614a', 'Significantly cheaper than Zapier for high task volumes', 1),
('33736daa-da57-4886-9e3c-8fe02c28614a', 'Strong error handling and execution logs out of the box', 2),

-- N8N (66ff7dee-b402-49d0-8e80-ba7123eac301)
('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Self-hosted option keeps all data entirely on your own servers', 0),
('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Free forever on self-hosted — no per-task pricing ever', 1),
('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Strong LLM and AI agent nodes for building custom AI workflows', 2),

-- Motion (4a250aca-0dff-484d-8ea1-e44046110e70)
('4a250aca-0dff-484d-8ea1-e44046110e70', 'Automatically schedules tasks around your calendar without drag-and-drop', 0),
('4a250aca-0dff-484d-8ea1-e44046110e70', 'Rebuilds your entire schedule in seconds when priorities shift', 1),
('4a250aca-0dff-484d-8ea1-e44046110e70', 'Single dashboard for tasks, meetings, and projects in one view', 2),

-- Reclaim (2353ab81-5dd8-49f3-984b-d7189147fc6e)
('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Automatically blocks time for deep work, habits, and breaks around meetings', 0),
('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Free plan is generous for individual use', 1),
('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Works natively with Google Calendar with minimal setup', 2),

-- Asana AI (2370f176-0cbb-4284-ab89-d5a284740ee6)
('2370f176-0cbb-4284-ab89-d5a284740ee6', 'AI-generated status updates reduce time spent on manual reporting', 0),
('2370f176-0cbb-4284-ab89-d5a284740ee6', 'Smart Goals connects individual tasks directly to team objectives', 1),
('2370f176-0cbb-4284-ab89-d5a284740ee6', 'Strong integrations with Slack, Jira, and Google Workspace', 2),

-- Shortcut (4930eb94-93f9-432f-90b4-1809e5437238)
('4930eb94-93f9-432f-90b4-1809e5437238', 'Built specifically for engineering teams — understands sprints, cycles, and velocity', 0),
('4930eb94-93f9-432f-90b4-1809e5437238', 'Clean, fast interface with minimal setup overhead', 1),
('4930eb94-93f9-432f-90b4-1809e5437238', 'Git integration links code commits to stories automatically', 2),

-- Manus (4b330ade-b290-4d71-8724-ec70815bf79e)
('4b330ade-b290-4d71-8724-ec70815bf79e', 'Executes multi-step tasks autonomously — browse, code, write, and deliver in one run', 0),
('4b330ade-b290-4d71-8724-ec70815bf79e', 'Returns deliverables (files, code, reports) not just text responses', 1),
('4b330ade-b290-4d71-8724-ec70815bf79e', 'Handles tasks that require chaining multiple tools without human handoff', 2),

-- DeepSeek (model family page) (c88571c4-5009-4502-af64-11f803ad3fd3)
('c88571c4-5009-4502-af64-11f803ad3fd3', 'R1 reasoning model rivals o1 at a fraction of the cost', 0),
('c88571c4-5009-4502-af64-11f803ad3fd3', 'Open-source weights allow self-hosting and fine-tuning', 1),
('c88571c4-5009-4502-af64-11f803ad3fd3', 'Strong coding and maths benchmark results across all model sizes', 2),

-- Llama (396c0d53-b0a3-4dc2-863b-324f7931c13e)
('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Fully open — free to use, modify, and deploy at any scale', 0),
('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Massive community of fine-tunes, tools, and hosted versions', 1),
('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Available across all major cloud providers with no vendor lock-in', 2),

-- Mistral (96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7)
('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'Efficient models punch above their size — Mistral 7B competes with much larger models', 0),
('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'Open-weight models available for self-hosting and customisation', 1),
('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'Strong JSON mode and function calling for structured production outputs', 2),

-- Qwen (19759a8e-11d2-43ea-ac47-97077a4ba97f)
('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Top-tier performance on maths and coding tasks across benchmarks', 0),
('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Best-in-class Chinese and Asian language support', 1),
('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Open-source weights available for self-hosting', 2),

-- Sarvam (33e167b5-241b-48a4-81a6-dac74ed9d478)
('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Purpose-built for Indian languages — far better than general models on regional content', 0),
('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Covers 10+ Indic scripts and dialects with native-level understanding', 1),
('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Low-cost API pricing optimised for the Indian market', 2),

-- Prism (a524b887-44fc-4af7-aada-6e6ae78dd4d9)
('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Native LaTeX editor with AI directly embedded — no copy-paste workflow', 0),
('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Access to GPT-5.2 within a structured scientific writing environment', 1),
('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Citation and formula support built in alongside AI assistance', 2),

-- Claude Dispatch (75929e83-cb2b-4ef2-a8d0-199f6bab036a)
('75929e83-cb2b-4ef2-a8d0-199f6bab036a', 'Control your PC remotely using natural language from mobile', 0),
('75929e83-cb2b-4ef2-a8d0-199f6bab036a', 'Handles long-running desktop tasks while you''re away from your computer', 1),

-- Claude Design (63deadbe-0dc9-40c3-b5aa-f908e0aace88)
('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Generates functional interactive web prototypes — not just static mockups', 0),
('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Outputs real deployable code (HTML/CSS/JS) ready for developers to refine', 1),
('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Exceptional at data visualisation and dashboard layout generation', 2),

-- AI Mode (a8967f9d-a068-49fb-8ba4-2fc06680cac2)
('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Multi-step research inside the familiar Google Search interface', 0),
('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Deeply grounded in real-time web results with inline citations', 1),
('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Free through Google Search Labs — no extra subscription required', 2),

-- Computer (bc10afb6-081d-4a38-948f-2f99833323c0)
('bc10afb6-081d-4a38-948f-2f99833323c0', 'Runs long-form data analysis and cloud tasks fully autonomously', 0),
('bc10afb6-081d-4a38-948f-2f99833323c0', 'Returns structured reports and downloadable files as deliverables', 1),
('bc10afb6-081d-4a38-948f-2f99833323c0', 'Can browse, search, and synthesise across multiple sources in one run', 2),

-- Comet (88487291-d51f-473b-8db9-9d96d5e9ccda)
('88487291-d51f-473b-8db9-9d96d5e9ccda', 'Operates across browser tabs autonomously — fills forms, searches, and extracts data', 0),
('88487291-d51f-473b-8db9-9d96d5e9ccda', 'Handles repetitive multi-site workflows without any coding', 1),

-- AWS Quick (52cd5efd-0297-43bb-aba7-bddc6eab9706)
('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Securely connects to internal business data, documents, and databases', 0),
('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Permission-aware — employees only see outputs from authorised data sources', 1),
('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Supports 40+ built-in business actions across AWS services', 2),

-- Clay (9be0dc5b-d6ee-4b02-bb90-d6c0530767b2)
('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'Automatically enriches lead records from 75+ data sources in one workflow', 0),
('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'AI-generated personalised outreach based on real enriched lead data', 1),
('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'No-code builder accessible to non-technical sales and growth teams', 2),

-- Wispr Flow (a7b0f41c-bba1-488d-a935-65b2559d14d3)
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Works in any text field on desktop and mobile without copy-paste', 0),
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Cleans up filler words and run-ons automatically', 1),
('a7b0f41c-bba1-488d-a935-65b2559d14d3', '3x faster than typing for most users once trained to your voice', 2),

-- Codex (0fc26c3d-6b22-461a-a000-2fff4e3546c5)
('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Runs in a sandboxed cloud environment — no local setup required', 0),
('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Can write, test, and debug code across a full codebase autonomously', 1),
('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Accessible via API for embedding into developer tools and pipelines', 2),

-- Command R+ (1bd8df36-8427-4308-bba9-f47cfdd56002)
('1bd8df36-8427-4308-bba9-f47cfdd56002', 'Optimised specifically for Retrieval-Augmented Generation pipelines', 0),
('1bd8df36-8427-4308-bba9-f47cfdd56002', 'Strong tool-use and function calling for agentic production workflows', 1),
('1bd8df36-8427-4308-bba9-f47cfdd56002', 'Designed for enterprise — low hallucination rate on grounded tasks', 2),

-- Llama 3 (68451bca-87f6-4525-969e-5308a1588d1f)
('68451bca-87f6-4525-969e-5308a1588d1f', 'Strongest open-weight model — competitive with GPT-4 on many benchmarks', 0),
('68451bca-87f6-4525-969e-5308a1588d1f', 'Full commercial use licence — deploy without royalties', 1),
('68451bca-87f6-4525-969e-5308a1588d1f', 'Fine-tunable for domain-specific applications with extensive community tooling', 2),

-- Replit (7340beca-5f48-4971-adc0-536d94fc0c89)
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Zero local setup — full dev environment runs in the browser', 0),
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Built-in hosting and one-click deployment for quick prototypes', 1);

-- ─── CONS ───────────────────────────────────────────────────────────────────────

INSERT INTO public.fluency_tool_cons (tool_id, content, sort_order) VALUES

-- ChatGPT
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Free tier throttles to GPT-4o mini under heavy load', 0),
('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Usage limits on Plus can be hit during heavy coding sessions', 1),

-- Claude
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'No built-in web search on the free or Pro tier', 0),
('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'Rate limits are tighter than ChatGPT at the same price point', 1),

-- Gemini
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Quality can be inconsistent on complex creative writing tasks', 0),
('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Workspace integration works best if your whole team is on Google', 1),

-- Perplexity
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Less capable for pure writing or creative generation vs chatbots', 0),
('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Deep Research can take several minutes for complex queries', 1),

-- Grok
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Requires an X (Twitter) Premium subscription to access', 0),
('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Fewer integrations and third-party tool support than ChatGPT', 1),

-- Mistral Large
('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'No free consumer product — API-only access', 0),
('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'Smaller developer ecosystem than OpenAI or Google', 1),

-- Claude Code
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Terminal access means mistakes can modify or delete real files', 0),
('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'API usage costs add up quickly on large codebases', 1),

-- Cursor
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Fast request quota runs out quickly on the free tier', 0),
('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Suggestions can be overconfident on unfamiliar frameworks', 1),

-- DeepSeek V3
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Data is processed on Chinese servers — a concern for sensitive work', 0),
('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Chat interface is barebones compared to ChatGPT or Claude', 1),

-- AI Studio
('608f458d-53a2-4477-bc82-77f32f169da0', 'Rate-limited on the free tier — not suitable for production traffic', 0),
('608f458d-53a2-4477-bc82-77f32f169da0', 'Interface is developer-focused, not accessible to non-technical users', 1),

-- OpenAI Tokenizer
('b1391927-1827-4051-9904-eb3794d9744e', 'Single-purpose utility — not a full AI product or assistant', 0),
('b1391927-1827-4051-9904-eb3794d9744e', 'No API or programmatic access to token counts', 1),

-- NotebookLM
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Cannot browse the web — works only from what you upload', 0),
('5548792e-e229-4eda-90c2-4c12ee5eddee', 'No persistent memory or learning between sessions', 1),

-- Glean
('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'Enterprise pricing makes it out of reach for small teams', 0),
('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'Requires significant IT setup and SSO integration to deploy', 1),

-- Atlas
('af8d8f0c-0111-4497-b821-79e0ffbd6304', 'Requires a ChatGPT Plus subscription to use', 0),
('af8d8f0c-0111-4497-b821-79e0ffbd6304', 'Limited to Chrome browser — no other browser support', 1),

-- Claude Cowork
('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Still experimental — reliability varies on complex multi-step tasks', 0),
('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Requires Pro or Max subscription', 1),

-- Flow
('312dfbcd-22d6-4d41-ad4f-951919012b58', 'Limited availability — access through Google Labs only', 0),
('312dfbcd-22d6-4d41-ad4f-951919012b58', 'Feature set is narrower than dedicated creative tools like Canva or Adobe', 1),

-- Grammarly
('be624b56-40fa-4632-a502-c514923ed7a9', 'Suggestions can over-sanitise voice in informal or creative writing', 0),
('be624b56-40fa-4632-a502-c514923ed7a9', 'Premium plan is expensive for individuals at $144/year', 1),

-- Jasper
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'High price point — hard to justify without consistent content volume', 0),
('6f371695-3b43-4060-9fbb-db733bfec4f6', 'Outputs still need editing; rarely publish-ready on first pass', 1),

-- Notion AI
('48add906-1643-413f-a871-3c1aea9d286b', 'Only useful if your team already works inside Notion', 0),
('48add906-1643-413f-a871-3c1aea9d286b', 'Less capable than a dedicated chatbot for complex reasoning tasks', 1),

-- Canva
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'AI features are less powerful than dedicated generation tools', 0),
('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Templates can feel generic without significant customisation', 1),

-- Gamma
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Design customisation is limited compared to PowerPoint or Figma', 0),
('407c69f1-5544-40bc-99d8-3369af2f3761', 'Free tier watermarks all exported decks', 1),

-- Napkin
('85111687-6584-49e8-9540-10285bae6cd1', 'Limited control over exact layout — AI makes most design decisions', 0),
('85111687-6584-49e8-9540-10285bae6cd1', 'Fewer export options than traditional diagramming tools', 1),

-- Fireflies
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Transcription accuracy drops with strong accents or poor audio quality', 0),
('10186e8b-5403-44a5-889a-e057f1f5c843', 'Storage limits on the free plan fill up quickly with frequent meetings', 1),

-- Otter.ai
('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Free tier limits transcription to 300 minutes per month', 0),
('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Accuracy drops on fast-paced or highly technical conversations', 1),

-- Vapi
('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Developer-only — requires engineering effort to set up and deploy', 0),
('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Per-minute pricing adds up quickly for high-volume calling scenarios', 1),

-- Eleven Labs
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Per-character pricing adds up fast for long-form audio content', 0),
('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Real-time voice streaming latency is noticeable in some network setups', 1),

-- Zapier
('35f85c91-982b-4341-953b-22bffe4e07f6', 'Becomes expensive quickly — task-based pricing scales poorly at volume', 0),
('35f85c91-982b-4341-953b-22bffe4e07f6', 'Complex multi-step flows can be fragile when third-party APIs change', 1),

-- Make
('33736daa-da57-4886-9e3c-8fe02c28614a', 'Steeper learning curve than Zapier for beginners', 0),
('33736daa-da57-4886-9e3c-8fe02c28614a', 'Some niche apps have limited or missing Make modules', 1),

-- N8N
('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Self-hosted option requires a server to maintain — not for non-technical teams', 0),
('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Cloud-hosted version is expensive compared to Make or Zapier', 1),

-- Motion
('4a250aca-0dff-484d-8ea1-e44046110e70', 'Takes a week of use before scheduling feels truly accurate', 0),
('4a250aca-0dff-484d-8ea1-e44046110e70', 'Higher price than most calendar tools at $19/month billed annually', 1),

-- Reclaim
('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Outlook support requires a paid plan — free tier is Google Calendar only', 0),
('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Less powerful than Motion for complex multi-person project scheduling', 1),

-- Asana AI
('2370f176-0cbb-4284-ab89-d5a284740ee6', 'AI features are locked behind higher-tier plans', 0),
('2370f176-0cbb-4284-ab89-d5a284740ee6', 'Can feel like overkill for small teams — simpler tools may serve better', 1),

-- Shortcut
('4930eb94-93f9-432f-90b4-1809e5437238', 'Limited usefulness for non-engineering teams like marketing or ops', 0),
('4930eb94-93f9-432f-90b4-1809e5437238', 'Reporting and analytics are basic compared to Jira', 1),

-- Manus
('4b330ade-b290-4d71-8724-ec70815bf79e', 'Invite-only access with limited availability', 0),
('4b330ade-b290-4d71-8724-ec70815bf79e', 'Agent reliability drops on highly ambiguous or open-ended instructions', 1),

-- DeepSeek (company)
('c88571c4-5009-4502-af64-11f803ad3fd3', 'Data processed in China — a significant privacy concern for enterprise use', 0),
('c88571c4-5009-4502-af64-11f803ad3fd3', 'Chat interface and ecosystem are significantly behind OpenAI', 1),

-- Llama
('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Requires technical expertise to run locally or fine-tune effectively', 0),
('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Smaller models underperform frontier closed models on complex tasks', 1),

-- Mistral
('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'No consumer product — primarily API and developer-focused', 0),
('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'Smaller community than OpenAI or Meta Llama outside of Europe', 1),

-- Qwen
('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Data privacy concerns given Alibaba''s Chinese ownership', 0),
('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Smaller community and tooling ecosystem outside of Asia', 1),

-- Sarvam
('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Limited use outside South Asian language contexts', 0),
('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Ecosystem and documentation are still maturing', 1),

-- Prism
('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Very specialised — only valuable for researchers and scientists', 0),
('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Limited to OpenAI''s model family with no model choice', 1),

-- Claude Dispatch
('75929e83-cb2b-4ef2-a8d0-199f6bab036a', 'Requires Cowork subscription and desktop app installation', 0),
('75929e83-cb2b-4ef2-a8d0-199f6bab036a', 'Experimental — reliability varies on complex multi-step desktop workflows', 1),

-- Claude Design
('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Complex multi-component apps still need significant developer refinement', 0),
('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Requires a Pro subscription', 1),

-- AI Mode
('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Still experimental — quality is inconsistent compared to Perplexity or ChatGPT Search', 0),
('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Requires opting in via Google Search Labs — not available by default', 1),

-- Computer
('bc10afb6-081d-4a38-948f-2f99833323c0', 'Requires a Perplexity Pro subscription', 0),
('bc10afb6-081d-4a38-948f-2f99833323c0', 'Task success rate drops on ambiguous or loosely defined briefs', 1),

-- Comet
('88487291-d51f-473b-8db9-9d96d5e9ccda', 'Limited to Perplexity Pro users — not available on the free plan', 0),
('88487291-d51f-473b-8db9-9d96d5e9ccda', 'Early access product — feature set is still developing', 1),

-- AWS Quick
('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Requires AWS infrastructure and IT setup — not self-serve', 0),
('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Per-user pricing adds up quickly for large organisations', 1),

-- Clay
('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'Expensive — serious plans start at $167/month', 0),
('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'Steep learning curve for users unfamiliar with data enrichment', 1),

-- Wispr Flow
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Requires speaking aloud — not suitable for shared or open-plan offices', 0),
('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Accuracy drops with background noise or strong accents', 1),

-- Codex
('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Token-based pricing with no flat monthly cap — costs are hard to predict', 0),
('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Less context-aware for large repos compared to Cursor or Claude Code', 1),

-- Command R+
('1bd8df36-8427-4308-bba9-f47cfdd56002', 'No consumer product — API and enterprise contracts only', 0),
('1bd8df36-8427-4308-bba9-f47cfdd56002', 'Smaller community means fewer guides, fine-tunes, and examples', 1),

-- Llama 3
('68451bca-87f6-4525-969e-5308a1588d1f', 'Running the largest 405B model locally requires significant GPU compute', 0),
('68451bca-87f6-4525-969e-5308a1588d1f', 'No built-in safety layer — teams must implement their own guardrails', 1),

-- Replit
('7340beca-5f48-4971-adc0-536d94fc0c89', 'Performance is slower than a local dev environment for heavy projects', 0),
('7340beca-5f48-4971-adc0-536d94fc0c89', 'AI suggestions are less capable than Cursor or Claude Code', 1);
