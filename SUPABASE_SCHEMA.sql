-- ============================================================
-- AI Work Studio — Supabase Schema
-- Run this in your Supabase SQL Editor (new project)
-- ============================================================

-- 1. Companies
create table public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  domain     text unique, -- e.g. 'flipkart.com'; NULL = public/default
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Default "Public" company for users whose domain isn't registered
insert into public.companies (name, domain) values ('Public', null);

-- 2. Profiles (one row per auth.users row)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  company_id uuid references public.companies(id),
  role       text not null default 'user' check (role in ('user','admin','superadmin')),
  created_at timestamptz default now()
);

-- 3. Activities (standalone — no module layer)
create table public.activities (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  level                 text check (level in ('Beginner','Intermediate','Advanced')),
  time_estimate_minutes int,
  points                int default 0,
  tools                 text[] default '{}',
  position              int default 0,
  published             boolean not null default false,
  category              text not null default 'chat',
  created_at            timestamptz default now()
);

-- 4. Activity → Company assignments (many-to-many)
-- No rows = visible to ALL authenticated users when published
-- Has rows  = visible only to listed companies when published
create table public.activity_companies (
  activity_id uuid not null references public.activities(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  primary key (activity_id, company_id)
);

-- 5. Activity content
create table public.activity_content (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid references public.activities(id) on delete cascade unique,
  slide_images  jsonb not null default '[]',
  quiz          jsonb not null default '[]',
  goals         jsonb not null default '[]',
  access_needed jsonb not null default '[]',
  prompts       jsonb not null default '[]',
  downloads     jsonb not null default '[]',
  updated_at    timestamptz default now()
);

-- 6. Activity steps (structured step-by-step content)
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

-- 7. User progress
create table public.user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  activity_id     uuid references public.activities(id) on delete cascade,
  status          text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_steps jsonb not null default '[]',
  quiz_score      int,
  completed_at    timestamptz,
  updated_at      timestamptz default now(),
  unique(user_id, activity_id)
);

-- ============================================================
-- Trigger: auto-create profile + assign company on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_domain text;
  resolved_co uuid;
begin
  user_domain := split_part(new.email, '@', 2);

  select id into resolved_co from public.companies where domain = user_domain limit 1;

  if resolved_co is null then
    select id into resolved_co from public.companies where domain is null limit 1;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, company_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    resolved_co,
    'user'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.companies         enable row level security;
alter table public.profiles          enable row level security;
alter table public.activities        enable row level security;
alter table public.activity_companies enable row level security;
alter table public.activity_content  enable row level security;
alter table public.activity_steps    enable row level security;
alter table public.user_progress     enable row level security;

-- Helper functions
create or replace function public.get_my_role()
returns text
language sql security definer stable set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.get_my_company_id()
returns uuid
language sql security definer stable set search_path = public
as $$ select company_id from public.profiles where id = auth.uid() $$;

-- ── Profiles ──────────────────────────────────────────────────────────────────
create policy "profiles: own select"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: admin select"
  on public.profiles for select
  using (
    public.get_my_role() = 'superadmin'
    or (public.get_my_role() = 'admin' and company_id = public.get_my_company_id())
  );

create policy "profiles: own update"
  on public.profiles for update using (auth.uid() = id);

create policy "profiles: admin update"
  on public.profiles for update
  using (
    public.get_my_role() = 'superadmin'
    or (public.get_my_role() = 'admin' and company_id = public.get_my_company_id())
  );

-- ── Companies ─────────────────────────────────────────────────────────────────
create policy "companies: authenticated select"
  on public.companies for select using (auth.uid() is not null);

create policy "companies: superadmin insert"
  on public.companies for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "companies: superadmin update"
  on public.companies for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "companies: superadmin delete"
  on public.companies for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ── Activity companies ────────────────────────────────────────────────────────
create policy "activity_companies: superadmin all"
  on public.activity_companies for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_companies: superadmin insert"
  on public.activity_companies for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_companies: superadmin delete"
  on public.activity_companies for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ── Activities ────────────────────────────────────────────────────────────────
-- Learner: published = true AND (no company restriction OR user's company is assigned)
create policy "activities: published select"
  on public.activities for select
  using (
    auth.uid() is not null
    and activities.published = true
    and (
      not exists (select 1 from public.activity_companies ac where ac.activity_id = activities.id)
      or exists (
        select 1 from public.activity_companies ac
        join public.profiles p on p.company_id = ac.company_id
        where ac.activity_id = activities.id and p.id = auth.uid()
      )
    )
  );

create policy "activities: superadmin select"
  on public.activities for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activities: superadmin insert"
  on public.activities for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activities: superadmin update"
  on public.activities for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activities: superadmin delete"
  on public.activities for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ── Activity content ──────────────────────────────────────────────────────────
create policy "activity_content: published select"
  on public.activity_content for select
  using (
    auth.uid() is not null
    and exists (select 1 from public.activities a where a.id = activity_content.activity_id and a.published = true)
  );

create policy "activity_content: superadmin select"
  on public.activity_content for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_content: superadmin insert"
  on public.activity_content for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_content: superadmin update"
  on public.activity_content for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_content: superadmin delete"
  on public.activity_content for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ── Activity steps ────────────────────────────────────────────────────────────
create policy "activity_steps: published select"
  on public.activity_steps for select
  using (
    auth.uid() is not null
    and exists (select 1 from public.activities a where a.id = activity_steps.activity_id and a.published = true)
  );

create policy "activity_steps: superadmin select"
  on public.activity_steps for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_steps: superadmin insert"
  on public.activity_steps for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_steps: superadmin update"
  on public.activity_steps for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

create policy "activity_steps: superadmin delete"
  on public.activity_steps for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ── User progress ─────────────────────────────────────────────────────────────
create policy "user_progress: own select"
  on public.user_progress for select using (auth.uid() = user_id);

create policy "user_progress: own insert"
  on public.user_progress for insert with check (auth.uid() = user_id);

create policy "user_progress: own update"
  on public.user_progress for update using (auth.uid() = user_id);

create policy "user_progress: admin select"
  on public.user_progress for select
  using (exists (
    select 1 from public.profiles admin_p
    join public.profiles learner_p on learner_p.id = user_progress.user_id
    where admin_p.id = auth.uid()
      and admin_p.role in ('admin','superadmin')
      and (admin_p.company_id = learner_p.company_id or admin_p.role = 'superadmin')
  ));

-- ============================================================
-- Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('activity-slides', 'activity-slides', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('activity-downloads', 'activity-downloads', true)
  on conflict (id) do nothing;

create policy "slides: public select"
  on storage.objects for select using (bucket_id = 'activity-slides');

create policy "slides: superadmin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'activity-slides' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "slides: superadmin delete"
  on storage.objects for delete
  using (
    bucket_id = 'activity-slides' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "downloads: public select"
  on storage.objects for select using (bucket_id = 'activity-downloads');

create policy "downloads: superadmin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'activity-downloads' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "downloads: superadmin delete"
  on storage.objects for delete
  using (
    bucket_id = 'activity-downloads' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );
