-- =============================================================
-- Fix company-based activity filtering
--
-- Root cause: regular users have no SELECT policy on
-- activity_companies, so the subquery inside the
-- "activities: published select" policy always sees empty rows.
-- NOT EXISTS(...) is always TRUE → every activity appears
-- unrestricted to every logged-in user.
--
-- Fix: let authenticated users read activity_companies (it only
-- contains UUID pairs — no sensitive data).  The existing
-- activities policy subquery then works as intended.
-- =============================================================

-- 1. Allow any logged-in user to read activity_companies
--    (needed so the activities RLS subquery can see assignments)
DROP POLICY IF EXISTS "activity_companies: authenticated select"
  ON public.activity_companies;

CREATE POLICY "activity_companies: authenticated select"
  ON public.activity_companies FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- 2. Rebuild the learner activity policy (clean version)
DROP POLICY IF EXISTS "activities: published select" ON public.activities;

CREATE POLICY "activities: published select"
  ON public.activities FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND published = true
    AND (
      -- No company restriction → open to all
      NOT EXISTS (
        SELECT 1 FROM public.activity_companies ac
        WHERE ac.activity_id = activities.id
      )
      OR
      -- User's company is explicitly assigned
      EXISTS (
        SELECT 1
        FROM   public.activity_companies ac
        JOIN   public.profiles p ON p.company_id = ac.company_id
        WHERE  ac.activity_id = activities.id
          AND  p.id = auth.uid()
      )
    )
  );


-- 3. Mirror the same company check on activity_content
--    (so users can't fetch content for activities they can't see)
DROP POLICY IF EXISTS "activity_content: published select" ON public.activity_content;

CREATE POLICY "activity_content: published select"
  ON public.activity_content FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activities a
      WHERE  a.id = activity_content.activity_id
        AND  a.published = true
        AND (
          NOT EXISTS (
            SELECT 1 FROM public.activity_companies ac
            WHERE ac.activity_id = a.id
          )
          OR EXISTS (
            SELECT 1
            FROM   public.activity_companies ac
            JOIN   public.profiles p ON p.company_id = ac.company_id
            WHERE  ac.activity_id = a.id AND p.id = auth.uid()
          )
        )
    )
  );


-- 4. Mirror on activity_steps
DROP POLICY IF EXISTS "activity_steps: published select" ON public.activity_steps;

CREATE POLICY "activity_steps: published select"
  ON public.activity_steps FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activities a
      WHERE  a.id = activity_steps.activity_id
        AND  a.published = true
        AND (
          NOT EXISTS (
            SELECT 1 FROM public.activity_companies ac
            WHERE ac.activity_id = a.id
          )
          OR EXISTS (
            SELECT 1
            FROM   public.activity_companies ac
            JOIN   public.profiles p ON p.company_id = ac.company_id
            WHERE  ac.activity_id = a.id AND p.id = auth.uid()
          )
        )
    )
  );


-- 5. Quick sanity-check query — run this after the migration and
--    verify you see only the expected activities for each user.
--    (Replace the uuid with a real user id from auth.users)
--
-- SELECT a.title, a.published,
--        array_agg(ac.company_id) FILTER (WHERE ac.company_id IS NOT NULL) AS assigned_to
-- FROM   activities a
-- LEFT   JOIN activity_companies ac ON ac.activity_id = a.id
-- WHERE  a.published = true
-- GROUP  BY a.id, a.title, a.published
-- ORDER  BY a.title;
