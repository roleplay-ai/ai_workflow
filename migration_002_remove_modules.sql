-- ============================================================
-- Migration 002: Remove modules layer
-- Activities are now standalone — published directly by flag.
-- Run in Supabase SQL Editor AFTER migration_001.
-- ============================================================

-- 1. Drop dependent tables first
drop table if exists public.module_companies cascade;
drop table if exists public.modules cascade;

-- 2. Remove module_id from activities
alter table public.activities drop column if exists module_id;

-- 3. Simplify RLS — activities: published = true is the only gate
drop policy if exists "activities: published select" on public.activities;
create policy "activities: published select"
  on public.activities for select
  using (auth.uid() is not null and activities.published = true);

drop policy if exists "activity_content: published select" on public.activity_content;
create policy "activity_content: published select"
  on public.activity_content for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.activities a
      where a.id = activity_content.activity_id and a.published = true
    )
  );

drop policy if exists "activity_steps: published select" on public.activity_steps;
create policy "activity_steps: published select"
  on public.activity_steps for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.activities a
      where a.id = activity_steps.activity_id and a.published = true
    )
  );
