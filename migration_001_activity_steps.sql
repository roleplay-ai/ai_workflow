-- ============================================================
-- Migration 001: Add activity_steps table
-- Replaces workflow_markdown parsing with structured step rows.
-- Run this in Supabase SQL Editor on an existing project.
-- For fresh deployments the table is already in SUPABASE_SCHEMA.sql.
-- ============================================================

create table public.activity_steps (
  id                uuid primary key default gen_random_uuid(),
  activity_id       uuid not null references public.activities(id) on delete cascade,
  step_number       int  not null,
  slide_number      int  not null default 1,
  title             text not null,
  what_learner_sees text not null default 'Not specified in this slide.',
  what_this_means   text not null default 'Not specified in this slide.',
  what_to_do        jsonb not null default '[]',
  if_stuck          text not null default 'Not specified in this slide.',
  callout           text not null default '',
  coach_next        text not null default '',
  created_at        timestamptz default now(),
  unique (activity_id, step_number)
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.activity_steps enable row level security;

create policy "activity_steps: published select"
  on public.activity_steps for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.activities a
      where a.id = activity_steps.activity_id
        and (
          a.published = true
          or exists (
            select 1 from public.modules m
            where m.id = a.module_id and m.published = true
          )
        )
    )
  );

create policy "activity_steps: superadmin select"
  on public.activity_steps for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin'
  ));

create policy "activity_steps: superadmin insert"
  on public.activity_steps for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin'
  ));

create policy "activity_steps: superadmin update"
  on public.activity_steps for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin'
  ));

create policy "activity_steps: superadmin delete"
  on public.activity_steps for delete
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin'
  ));
