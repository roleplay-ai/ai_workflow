-- fluency_tools seed — self-contained: creates table + inserts all 52 tools.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.fluency_tools (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_label text       NOT NULL,
  name          text        NOT NULL,
  description   text,
  icon_emoji    text,
  letter        text,
  color         text        NOT NULL DEFAULT '#FFCE00',
  company_name  text,
  try_url       text,
  best_for      text,
  pricing       text,
  is_featured   boolean     NOT NULL DEFAULT false,
  is_locked     boolean     NOT NULL DEFAULT false,
  sort_order    int         NOT NULL DEFAULT 0,
  published     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz          DEFAULT now()
);

ALTER TABLE public.fluency_tools ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fluency_tools' AND policyname = 'Public read published tools'
  ) THEN
    CREATE POLICY "Public read published tools"
      ON public.fluency_tools FOR SELECT TO public USING (published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fluency_tools' AND policyname = 'Superadmin manage tools'
  ) THEN
    CREATE POLICY "Superadmin manage tools"
      ON public.fluency_tools FOR ALL TO authenticated
      USING  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
  END IF;
END $$;

TRUNCATE public.fluency_tools CASCADE;

INSERT INTO public.fluency_tools
  (id, category_label, name, description, letter, color, company_name, try_url,
   best_for, pricing, is_featured, is_locked, sort_order, published)
VALUES

('86113259-831b-4f42-a50c-05fa8c5a0ded', 'Foundation Models', 'ChatGPT',
 'AI chatbot for asking questions, writing, research, coding, image work, and everyday productivity tasks.',
 'C', '#23CE6B', 'OpenAI', 'https://chatgpt.com/',
 'Draft, research, code, and solve daily tasks', 'Free + Plus $20/month', false, false, 0, true),

('7bc10af1-260e-42f7-b1c4-afd60b860a99', 'Foundation Models', 'Claude',
 'Strong general assistant for writing, analysis, reasoning, and long-document work.',
 'C', '#F68A29', 'Anthropic', 'https://claude.ai',
 '1M token context', 'Free / Pro $20/mo', false, false, 1, true),

('7944e90a-cdd1-40dc-bac6-09e9d1e0b3c6', 'Foundation Models', 'Gemini',
 'General AI assistant for writing, reasoning, multimodal help, and productivity.',
 'G', '#FFCE00', 'Google', 'https://gemini.google.com',
 '1M+ context', 'Free / Pro $19.99/mo', false, false, 2, true),

('7a01adcf-5e3f-4e81-935c-9f4a97dd59db', 'Research', 'Perplexity',
 'Answer engine for research, search, and fact-finding with citations.',
 'P', '#23CE68', 'Perplexity', 'https://www.perplexity.ai',
 'Deep Research mode', 'Free / Pro $20/mo', false, false, 3, true),

('2c3e20f2-03d0-47cb-8531-499e6f1033be', 'Foundation Models', 'Grok',
 'Conversational AI with a strong real-time and social/news orientation.',
 'G', '#ED4551', 'xAI', 'https://x.ai',
 '2M token context', 'X Premium $8/mo', false, false, 4, true),

('0c8c11cc-87a1-4b0e-870f-40bbd57929b5', 'Foundation Models', 'Mistral Large',
 'Efficient European frontier model with strong multilingual and reasoning capabilities.',
 'M', '#FF7000', NULL, 'https://mistral.ai',
 'Multilingual tasks and cost-efficient inference', 'API pay-as-you-go', false, false, 5, true),

('ed7d1b0a-5f73-4507-b485-07a47f53dff5', 'Coding', 'Claude Code',
 'Coding-focused version of Claude for software development and code tasks.',
 'C', '#FF6B6B', 'Anthropic', 'https://claude.com/product/claude-code',
 'Prompt caching (90% savings)', 'Pro $20/mo + API usage', false, false, 6, true),

('50d70978-b934-4c5b-9e4a-0da6733d04df', 'Coding', 'Cursor',
 'AI-powered code editor for faster software development.',
 'C', '#4ECDC4', 'Cursor', 'https://cursor.com',
 'Unlimited Tab completions', 'Hobby Free / Pro $20/mo', false, false, 7, true),

('60ae2baa-e92e-4651-837c-efc30c7e308f', 'Foundation Models', 'DeepSeek V3',
 'Open-source frontier model matching top closed models at a fraction of the inference cost.',
 'D', '#4D6BFE', NULL, 'https://deepseek.com',
 'Cost-efficient reasoning and coding tasks', 'Free (open weights) + hosted API', false, false, 8, true),

('608f458d-53a2-4477-bc82-77f32f169da0', 'Coding', 'AI Studio',
 'Developer environment for building with Gemini models.',
 'A', '#F97316', 'Google', 'https://aistudio.google.com',
 'Free access to new models', 'Free (rate limited)', false, false, 9, true),

('b1391927-1827-4051-9904-eb3794d9744e', 'Coding', 'Open AI Tokenizer',
 'Tokenization tool for checking how text is split into model tokens.',
 'O', '#06B6D4', 'OpenAI', 'https://platform.openai.com/tokenizer',
 NULL, NULL, false, false, 10, true),

('5548792e-e229-4eda-90c2-4c12ee5eddee', 'Research', 'Notebook LM',
 'Research and note-based AI tool that works from your sources and documents.',
 'N', '#84CC16', 'Google', 'https://notebooklm.google',
 NULL, NULL, false, false, 11, true),

('e5afed2c-6a3b-4712-a0e4-12dd4ad61bf2', 'Research', 'Glean',
 'Enterprise search and knowledge discovery across workplace apps.',
 'G', '#EC4899', 'Glean', 'https://www.glean.com/',
 'Permission-aware', '~$50/user/mo', false, false, 12, true),

('af8d8f0c-0111-4497-b821-79e0ffbd6304', 'Research', 'Atlas',
 'Browser-style tool for using ChatGPT while browsing across web pages.',
 'A', '#14B8A6', 'OpenAI', 'https://chatgpt.com/atlas/',
 NULL, NULL, false, false, 13, true),

('94613f31-49bd-4cd4-b714-5346d1ab3af3', 'Other', 'Claude Cowork',
 'Agentic work tool aimed at knowledge work and team productivity.',
 'C', '#8B5CF6', 'Anthropic', 'https://claude.ai/',
 'Direct file access', 'Pro/Max ($20/mo+)', false, false, 14, true),

('312dfbcd-22d6-4d41-ad4f-951919012b58', 'Research', 'Flow',
 'Creative workflow tool for generating and organizing visual or media ideas.',
 'F', '#F59E0B', 'Google', 'https://labs.google/fx/tools/flow/',
 NULL, NULL, false, false, 15, true),

('be624b56-40fa-4632-a502-c514923ed7a9', 'Writing', 'Grammarly',
 'Writing assistant for clarity, grammar, tone, and refinement.',
 'G', '#10B981', 'Grammarly', 'https://www.grammarly.com/',
 'Works in all apps', 'Free / Premium $12/mo', false, false, 16, true),

('6f371695-3b43-4060-9fbb-db733bfec4f6', 'Writing', 'Jasper',
 'AI writing tool for marketing and business content.',
 'J', '#3B82F6', 'Jasper', 'https://www.jasper.ai/',
 'Learns brand voice', 'Pro $59/mo', false, false, 17, true),

('48add906-1643-413f-a871-3c1aea9d286b', 'Other', 'Notion AI',
 'AI built into workspace docs and knowledge management.',
 'N', '#EF4444', 'Notion', 'https://www.notion.so/product/ai',
 'Ask Notion feature', 'Business $20/mo', false, false, 18, true),

('63a21b12-3c3a-48aa-ac15-0eba4f38d250', 'Other', 'Canva',
 'Design platform with AI features for graphics and presentations.',
 'C', '#6366F1', 'Canva', 'https://www.canva.com',
 NULL, NULL, false, false, 19, true),

('407c69f1-5544-40bc-99d8-3369af2f3761', 'PPT', 'Gamma',
 'AI presentation and content creation tool.',
 'G', '#D946EF', 'Gamma Tech, Inc.', 'https://gamma.app/',
 'Fastest deck creation from notes', 'Free + Pro $10/mo', false, false, 20, true),

('85111687-6584-49e8-9540-10285bae6cd1', 'PPT', 'Napkin',
 'Visual idea-to-diagram tool for turning text into visuals.',
 'N', '#0EA5E9', 'Napkin AI', 'https://www.napkin.ai/',
 'High visual quality', 'Free / $20/mo', true, false, 21, true),

('10186e8b-5403-44a5-889a-e057f1f5c843', 'Video', 'Fireflies.ai',
 'Meeting capture and note-taking tool that records and summarizes calls.',
 'F', '#22C55E', 'Fireflies', 'https://fireflies.ai/',
 'Deep search', 'Free / Pro $10/mo', false, false, 22, true),

('e0d3b56d-cf6c-46a1-930d-68aaabf93606', 'Video', 'Otter.ai',
 'Meeting transcription and summarization tool with collaboration features.',
 'O', '#FB923C', 'Otter', 'https://otter.ai/',
 'Speaker identification', 'Free / Pro $10/mo', false, false, 23, true),

('9edc9b96-4cdc-4cd0-9538-8b0217bd7bee', 'Voice', 'Vapi',
 'Voice AI infrastructure for building voice agents and calling workflows.',
 'V', '#E11D48', 'Vapi', 'https://vapi.ai/',
 'Industry-leading latency', '$0.05/min', false, false, 24, true),

('3ee1e891-026b-4daf-b125-76ef8a716e4c', 'Voice', 'Eleven Labs',
 'AI voice generation and voice cloning platform.',
 'E', '#7C3AED', 'ElevenLabs', 'https://elevenlabs.io/',
 'Best emotional range', 'Free / $5+', true, false, 25, true),

('35f85c91-982b-4341-953b-22bffe4e07f6', 'Other', 'Zapier',
 'Automation platform that connects apps and triggers workflows.',
 'Z', '#059669', 'Zapier', 'https://zapier.com/',
 'Zapier Central agents', 'Free / $20/mo', false, false, 26, true),

('33736daa-da57-4886-9e3c-8fe02c28614a', 'Other', 'Make',
 'Visual automation platform for building app-to-app workflows.',
 'M', '#DC2626', 'Make', 'https://www.make.com/',
 'Visual canvas', 'Free / Core $9/mo', false, false, 27, true),

('66ff7dee-b402-49d0-8e80-ba7123eac301', 'Other', 'N8N',
 'Workflow automation and AI orchestration tool for custom automations.',
 'N', '#2563EB', 'n8n', 'https://n8n.io/',
 'Data privacy', 'Free (Self-host)', false, false, 28, true),

('4a250aca-0dff-484d-8ea1-e44046110e70', 'Other', 'Motion',
 'AI scheduler and task planner that organizes work automatically.',
 'M', '#D97706', 'Motion', 'https://www.usemotion.com/',
 'Auto-rebuilds schedule', '$19/mo (Annual)', false, false, 29, true),

('2353ab81-5dd8-49f3-984b-d7189147fc6e', 'Other', 'Reclaim',
 'Smart scheduling tool for tasks, meetings, and habits.',
 'R', '#9333EA', 'Reclaim.ai', 'https://reclaim.ai',
 'Smart calendar blocking', 'Free / Pro $8/mo', false, false, 30, true),

('2370f176-0cbb-4284-ab89-d5a284740ee6', 'Other', 'Asana AI',
 'Project management with AI help for tasks and coordination.',
 'A', '#16A34A', 'Asana', 'https://asana.com',
 'AI-driven status updates', 'Starter $10.99/mo', false, false, 31, true),

('4930eb94-93f9-432f-90b4-1809e5437238', 'Other', 'Shortcut',
 'Project planning and team workflow platform.',
 'S', '#EA580C', 'Shortcut.ai', 'https://shortcut.ai/',
 'Built for dev-cycle visibility', 'Free / $8.50/mo', false, false, 32, true),

('4b330ade-b290-4d71-8724-ec70815bf79e', 'Other', 'Manus',
 'AI agent platform for task execution and autonomous workflows.',
 'M', '#4F46E5', 'Manus.im', 'https://manus.im',
 'Agentic task completion', 'Pro $25/mo', false, false, 33, true),

('c88571c4-5009-4502-af64-11f803ad3fd3', 'Other', 'DeepSeek',
 'Model family known for strong reasoning and coding value.',
 'D', '#0891B2', 'DeepSeek AI', 'https://www.deepseek.com',
 'Strong coding performance', 'API-based', false, false, 34, true),

('396c0d53-b0a3-4dc2-863b-324f7931c13e', 'Research', 'Llama',
 'Open model family widely used for self-hosting and customization.',
 'L', '#BE185D', 'Meta', 'https://ai.meta.com/llama',
 'Massive community support', 'Open Source', false, false, 35, true),

('96206ae8-3675-4e3e-8bb5-c0f3f3fb92a7', 'Research', 'Mistral',
 'Open and enterprise-friendly model family with strong efficiency.',
 'M', '#15803D', 'Mistral AI', 'https://mistral.ai',
 'Strong performance/size ratio', 'Usage-based', false, false, 36, true),

('19759a8e-11d2-43ea-ac47-97077a4ba97f', 'Research', 'Qwen',
 'Broad model family used for multilingual and general-purpose AI work.',
 'Q', '#C2410C', 'Alibaba', 'https://qwen.ai',
 'Top-tier performance in math and coding', 'Open Source', false, false, 37, true),

('33e167b5-241b-48a4-81a6-dac74ed9d478', 'Research', 'Sarvam',
 'AI company focused on Indian-language models.',
 'S', '#1D4ED8', 'Sarvam AI', 'https://sarvam.ai',
 'Focus on Indic languages', 'Usage-based', false, false, 38, true),

('a524b887-44fc-4af7-aada-6e6ae78dd4d9', 'Research', 'Prism',
 'AI-native scientific writing workspace with GPT-5.2 in a LaTeX editor.',
 'P', '#B45309', 'OpenAI', 'https://openai.com/prism/',
 'AI-native scientific editor', 'Free (with GPT-5.2)', false, false, 39, true),

('75929e83-cb2b-4ef2-a8d0-199f6bab036a', 'Other', 'Claude Dispatch',
 'Remote automation tool for complex PC tasks from mobile.',
 'C', '#7E22CE', 'Anthropic', 'https://support.claude.com/',
 'Remote desktop execution', 'Included in Cowork', false, false, 40, true),

('63deadbe-0dc9-40c3-b5aa-f908e0aace88', 'Image', 'Claude Design',
 'Visual AI builder for code and interactive web prototypes.',
 'C', '#047857', 'Anthropic', 'https://www.anthropic.com/news/claude-design',
 'Functional code generation', 'Pro $20/mo', true, false, 41, true),

('a8967f9d-a068-49fb-8ba4-2fc06680cac2', 'Research', 'AI Mode',
 'Multi-step research and task execution within Google Search.',
 'A', '#9F1239', 'Google', 'https://google.com/aimode',
 'Deep grounding', 'Free (Search Labs)', false, false, 42, true),

('bc10afb6-081d-4a38-948f-2f99833323c0', 'Other', 'Computer',
 'Digital worker for long-form workflows and cloud-based analysis.',
 'C', '#1E40AF', 'Perplexity', 'https://www.perplexity.ai/computer',
 'Autonomous data analysis', 'Pro $20/mo', false, false, 43, true),

('88487291-d51f-473b-8db9-9d96d5e9ccda', 'Other', 'Comet',
 'Enterprise browser assistant automating workflows across tabs.',
 'C', '#92400E', 'Perplexity', 'https://www.perplexity.ai/comet',
 'Browser agent assistant', 'Pro $20/mo', false, false, 44, true),

('52cd5efd-0297-43bb-aba7-bddc6eab9706', 'Foundation Models', 'AWS Quick',
 'AI assistant for work that answers questions, analyzes business data, and automates team workflows.',
 'A', '#ED4551', 'Amazon Web Services', 'https://aws.amazon.com/quick/',
 'Answer questions and automate workplace workflows', 'Free + paid from $20/user/mo', true, false, 45, true),

('9be0dc5b-d6ee-4b02-bb90-d6c0530767b2', 'Other', 'Clay',
 'Automates GTM research, data enrichment, and personalized outreach workflows for sales and growth teams.',
 'C', '#ED4551', 'Clay Labs Inc.', 'https://www.clay.com/',
 'Enrich sales leads and automate outbound workflows', 'Free + paid from $167/mo', true, false, 46, true),

('a7b0f41c-bba1-488d-a935-65b2559d14d3', 'Writing', 'Wispr Flow',
 'Voice dictation app that turns spoken words into polished text across desktop, mobile, and web apps.',
 'W', '#23CE6B', 'Wispr AI, Inc.', 'https://wisprflow.ai/',
 'Dictate emails, notes, and messages across apps', 'Free + Pro $12/user/mo', true, false, 47, true),

('0fc26c3d-6b22-461a-a000-2fff4e3546c5', 'Coding', 'Codex',
 'AI coding assistant for generating, editing, and reviewing software code.',
 'C', '#00B4D8', 'OpenAI', 'https://openai.com/codex/',
 'Plugin directory', 'Token-based', false, false, 48, true),

('1bd8df36-8427-4308-bba9-f47cfdd56002', 'Foundation Models', 'Command R+',
 'Cohere''s enterprise-grade model optimised for RAG and tool use in production pipelines.',
 'C', '#39594A', NULL, 'https://cohere.com',
 'Enterprise RAG, search grounding, and tool-calling', 'API pay-as-you-go', false, false, 49, true),

('68451bca-87f6-4525-969e-5308a1588d1f', 'Foundation Models', 'Llama 3',
 'Meta''s open-weight model — run it locally, fine-tune it, or access it via hosted providers.',
 'L', '#0064E0', NULL, 'https://llama.meta.com',
 'Self-hosted AI, privacy-sensitive workloads, fine-tuning', 'Free (open weights)', false, false, 50, true),

('7340beca-5f48-4971-adc0-536d94fc0c89', 'Coding', 'Replit',
 'Online development environment with AI coding support.',
 'R', '#A78BFA', 'Replit', 'https://replit.com',
 'Zero-setup browser IDE', 'Free / Core $25/mo', false, false, 51, true);
