-- =============================================================
-- Nudgeable AI Work Studio — Tag Seed Script
-- Tags assigned by matching activity title + description text.
-- Paste into Supabase SQL Editor and click Run.
-- =============================================================


-- ── 1. Insert tags ────────────────────────────────────────────
INSERT INTO activity_tags (name, icon_url) VALUES
  ('PDF',    NULL),
  ('PPT',    NULL),
  ('XLSX',   NULL),
  ('Docs',   NULL),
  ('Sheets', NULL),
  ('Email',  NULL),
  ('Slides', NULL),
  ('Forms',  NULL),
  ('CSV',    NULL),
  ('Teams',  NULL),
  ('Drive',  NULL),
  ('Images', NULL),
  ('Video',  NULL),
  ('Audio',  NULL),
  ('Chat',   NULL),
  ('Notion', NULL)
ON CONFLICT (name) DO NOTHING;


-- ── 2. Assign 3 tags per activity via title + description match
-- Combine both fields for matching so partial titles still hit.

UPDATE activities
SET tags = CASE

  -- Email / Gmail
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(email|gmail|inbox|follow.up|reply|draft|thread)%')
    THEN ARRAY['Email', 'Docs', 'PDF']

  -- PowerPoint / Slides / Presentation
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(powerpoint|presentation|deck|slide|ppt)%')
    THEN ARRAY['PPT', 'Slides', 'Docs']

  -- Excel / Dashboard / Charts / Data
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(excel|spreadsheet|dashboard|chart|graph|data|analytics|xlsx)%')
    THEN ARRAY['XLSX', 'Sheets', 'CSV']

  -- Survey / Forms / Calculator / Formula
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(survey|form|calculator|formula|questionnaire)%')
    THEN ARRAY['Forms', 'XLSX', 'Sheets']

  -- Teams / Meeting / Recap / Transcript
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(teams|meeting|recap|transcript|standup|summary)%')
    THEN ARRAY['Teams', 'Docs', 'Email']

  -- Research / Notebook / Synthesis / Deep research
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(research|notebook|synthesis|notebooklm|source|grounded|faq)%')
    THEN ARRAY['PDF', 'Docs', 'Sheets']

  -- Podcast / Audio / Sound
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(podcast|audio|sound|listen|voice|transcript)%')
    THEN ARRAY['Audio', 'PDF', 'Docs']

  -- Video / Recording / Walkthrough
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(video|recording|walkthrough|screencast|watch)%')
    THEN ARRAY['Video', 'Docs', 'Slides']

  -- Image / Visual / Campaign / Design / Creative
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(image|visual|campaign|design|creative|photo|banner|illustration)%')
    THEN ARRAY['Images', 'Slides', 'PPT']

  -- App / Tool / Build / Canvas / Artifact
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(app|artifact|canvas|builder|tool|mini.app|lightweight)%')
    THEN ARRAY['Forms', 'Sheets', 'Docs']

  -- Report / Brief / Proposal / Document
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(report|brief|proposal|document|write|draft|structured)%')
    THEN ARRAY['Docs', 'PDF', 'Email']

  -- Drive / Folder / Files / Storage
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(folder|drive|file|storage|cloud|shared)%')
    THEN ARRAY['Drive', 'Docs', 'PDF']

  -- Notion
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(notion|workspace|page|database|wiki)%')
    THEN ARRAY['Notion', 'Docs', 'PDF']

  -- Workflow / Automation / Scheduling / Recurring
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(workflow|automate|automation|schedule|recurring|trigger|repeat)%')
    THEN ARRAY['Docs', 'Email', 'Sheets']

  -- Prompt / Prompting / Model / AI tool
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(prompt|prompting|model|instruction|guardrail|role|rieg|chatbot)%')
    THEN ARRAY['Chat', 'Docs', 'PDF']

  -- Dispatch / Mobile / Remote / Control
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(dispatch|mobile|remote|control|laptop|phone|device)%')
    THEN ARRAY['Chat', 'Docs', 'Email']

  -- Setup / Config / Onboarding / Getting started
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(setup|config|onboard|install|getting.started|cowork|personalise|customize)%')
    THEN ARRAY['Docs', 'Chat', 'PDF']

  -- Analyse / Analyze / Comment / Insight / Theme
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(analys|comment|insight|theme|pattern|group|segment)%')
    THEN ARRAY['Sheets', 'XLSX', 'Docs']

  -- Default
  ELSE ARRAY['Chat', 'Docs', 'PDF']

END
WHERE published = true;


-- ── 3. Verify ────────────────────────────────────────────────
SELECT title, category, tags
FROM activities
WHERE published = true
ORDER BY category, title;
