-- =============================================================
-- Nudgeable AI Work Studio — Function Seed Script
-- Assigns 1–2 job functions per activity via title + description match.
-- Paste into Supabase SQL Editor and click Run.
-- =============================================================


-- ── 1. Ensure canonical functions exist ───────────────────────
INSERT INTO activity_functions (name, icon_url) VALUES
  ('HR',               NULL),
  ('Finance',          NULL),
  ('Marketing',        NULL),
  ('Sales',            NULL),
  ('Operations',       NULL),
  ('Legal',            NULL),
  ('IT',               NULL),
  ('Product',          NULL),
  ('Customer Success', NULL),
  ('Leadership',       NULL)
ON CONFLICT (name) DO NOTHING;


-- ── 2. Assign functions per activity via title + description match
UPDATE activities
SET functions = CASE

  -- HR / People / Talent
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(hr|human.resources|hiring|recruit|onboard|employee|performance.review|leave|benefits|people|talent|workforce|staff)%')
    THEN ARRAY['HR', 'Operations']

  -- Finance / Budget / Accounting
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(finance|budget|invoice|expense|accounting|forecast|revenue|cost|financial|payroll|p&l|profit|cash.flow)%')
    THEN ARRAY['Finance', 'Operations']

  -- Marketing / Brand / Campaign
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(marketing|campaign|brand|content|social|seo|audience|creative|advertis|newsletter|copywriting|positioning)%')
    THEN ARRAY['Marketing', 'Sales']

  -- Sales / Pipeline / Prospecting
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(sales|prospect|pipeline|deal|crm|outreach|lead|quota|closing|pitch|proposal.client|account.executive)%')
    THEN ARRAY['Sales', 'Marketing']

  -- Legal / Compliance / Policy
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(legal|compliance|contract|policy|regulation|terms|gdpr|privacy|audit|risk)%')
    THEN ARRAY['Legal', 'Operations']

  -- IT / Security / Engineering
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(security|server|software|api|integration|system|developer|code|technical|infrastructure|devops|cyber|helpdesk|help.desk)%')
    THEN ARRAY['IT', 'Product']

  -- Product / UX / Roadmap
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(product|feature|roadmap|user.research|prototype|launch|ux|design.system|backlog|spec|requirements)%')
    THEN ARRAY['Product', 'Operations']

  -- Customer Success / Support / Retention
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(customer.success|customer.support|support ticket|retention|churn|client.onboard|help.desk|csat|nps|customer.feedback|service.desk)%')
    THEN ARRAY['Customer Success', 'Sales']

  -- Leadership / Strategy / Executive
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(leadership|executive|strategy|vision|decision|board|management|ceo|cfo|cto|director|stakeholder|all-hands)%')
    THEN ARRAY['Leadership', 'Operations']

  -- Operations / Workflow / Automation (broad catch for process work)
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(operations|workflow|automate|automation|process|schedule|recurring|efficiency|logistics|supply|dispatch|standup|meeting)%')
    THEN ARRAY['Operations', 'IT']

  -- Research / Analysis (often cross-functional — default to Product + Operations)
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(research|analys|analysis|insight|report|dashboard|data|survey|synthesis)%')
    THEN ARRAY['Product', 'Operations']

  -- Email / Docs / Writing (general knowledge work)
  WHEN (lower(title || ' ' || coalesce(description, ''))
        SIMILAR TO '%(email|gmail|document|write|draft|brief|memo|summary|report|presentation|slide)%')
    THEN ARRAY['Operations', 'Marketing']

  -- Default
  ELSE ARRAY['Operations']

END;


-- ── 3. Verify ────────────────────────────────────────────────
SELECT title, category, functions
FROM activities
ORDER BY category, title;
