-- ============================================================
-- AI Work Studio — Supabase Schema
-- Run this in your Supabase SQL Editor (new project)
-- ============================================================

-- 1. Companies
create table public.companies (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  domain    text unique, -- e.g. 'flipkart.com'; NULL = public/default
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Default "Public" company for users whose domain isn't registered
insert into public.companies (name, domain) values ('Public', null);

-- 2. Profiles (one row per auth.users row)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  company_id  uuid references public.companies(id),
  role        text not null default 'user' check (role in ('user','admin','superadmin')),
  created_at  timestamptz default now()
);

-- 3. Modules (created by superadmin, published to companies)
create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  categories  text[] default '{}', -- ['chat','build','automate']
  published   boolean default false,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- 4. Activities (belong to a module)
create table public.activities (
  id                   uuid primary key default gen_random_uuid(),
  module_id            uuid references public.modules(id) on delete cascade,
  title                text not null,
  description          text,
  level                text check (level in ('Beginner','Intermediate','Advanced')),
  time_estimate_minutes int,
  points               int default 0,
  tools                text[] default '{}', -- ['claude','gemini','chatgpt','copilot',...]
  position             int default 0,
  created_at           timestamptz default now()
);

-- 5. Activity content (slides/PDF + quiz, one row per activity)
create table public.activity_content (
  id                uuid primary key default gen_random_uuid(),
  activity_id       uuid references public.activities(id) on delete cascade unique,
  workflow_markdown text,
  slide_images      jsonb default '[]', -- [{url, caption}]
  quiz              jsonb default '[]', -- [{question, options:[], correct_index}]
  updated_at        timestamptz default now()
);

-- 6. User progress
create table public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  activity_id  uuid references public.activities(id) on delete cascade,
  status       text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  quiz_score   int,
  completed_at timestamptz,
  updated_at   timestamptz default now(),
  unique(user_id, activity_id)
);

-- ============================================================
-- Trigger: auto-create profile + assign company on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_domain  text;
  resolved_co  uuid;
begin
  user_domain := split_part(new.email, '@', 2);

  -- Try to find a matching company by domain
  select id into resolved_co from public.companies where domain = user_domain limit 1;

  -- Fall back to the "Public" company (domain IS NULL)
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

alter table public.companies       enable row level security;
alter table public.profiles        enable row level security;
alter table public.modules         enable row level security;
alter table public.activities      enable row level security;
alter table public.activity_content enable row level security;
alter table public.user_progress   enable row level security;

-- Profiles: own row + admin/superadmin can read their scope
create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "admin sees company users" on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','superadmin')
      and (p.company_id = profiles.company_id or p.role = 'superadmin')
  ));
create policy "superadmin manages profiles" on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Companies: superadmin full CRUD, others read
create policy "read companies" on public.companies for select using (auth.uid() is not null);
create policy "superadmin manages companies" on public.companies for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- Modules: all authenticated read published; superadmin full CRUD
create policy "read published modules" on public.modules for select
  using (published = true and auth.uid() is not null);
create policy "superadmin sees all modules" on public.modules for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
create policy "superadmin manages modules" on public.modules for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- Activities: follow module visibility
create policy "read activities of published modules" on public.activities for select
  using (exists (select 1 from public.modules m where m.id = activities.module_id and m.published = true) and auth.uid() is not null);
create policy "superadmin manages activities" on public.activities for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- Activity content: same as activities
create policy "read content of published activities" on public.activity_content for select
  using (exists (
    select 1 from public.activities a
    join public.modules m on m.id = a.module_id
    where a.id = activity_content.activity_id and m.published = true
  ) and auth.uid() is not null);
create policy "superadmin manages content" on public.activity_content for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- User progress: own rows; admin can read company rows
create policy "own progress" on public.user_progress for all using (auth.uid() = user_id);
create policy "admin reads company progress" on public.user_progress for select
  using (exists (
    select 1 from public.profiles admin_p
    join public.profiles learner_p on learner_p.id = user_progress.user_id
    where admin_p.id = auth.uid()
      and admin_p.role in ('admin','superadmin')
      and (admin_p.company_id = learner_p.company_id or admin_p.role = 'superadmin')
  ));

-- ============================================================
-- Storage bucket for activity slides
-- Run this separately in the Supabase Storage UI or via SQL:
-- ============================================================
insert into storage.buckets (id, name, public) values ('activity-slides', 'activity-slides', true)
  on conflict (id) do nothing;

create policy "public read slides" on storage.objects for select
  using (bucket_id = 'activity-slides');
create policy "superadmin upload slides" on storage.objects for insert
  using (bucket_id = 'activity-slides' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'
  ));
create policy "superadmin delete slides" on storage.objects for delete
  using (bucket_id = 'activity-slides' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'
  ));

-- ============================================================
-- MIGRATION v2: Extended activity_content + user_progress
-- Run this block if you already ran the initial schema above.
-- ============================================================

-- Add new columns to activity_content
alter table public.activity_content
  add column if not exists goals        jsonb not null default '[]',
  add column if not exists access_needed jsonb not null default '[]',
  add column if not exists prompts      jsonb not null default '[]',
  add column if not exists downloads    jsonb not null default '[]';

-- Add completed_steps to user_progress (tracks which steps user ticked)
alter table public.user_progress
  add column if not exists completed_steps jsonb not null default '[]';

-- Storage bucket for downloadable files (PDF, XLSX, PPTX, DOCX)
insert into storage.buckets (id, name, public) values ('activity-downloads', 'activity-downloads', true)
  on conflict (id) do nothing;

create policy "public read downloads" on storage.objects for select
  using (bucket_id = 'activity-downloads');
create policy "superadmin upload downloads" on storage.objects for insert
  using (bucket_id = 'activity-downloads' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'
  ));
create policy "superadmin delete downloads" on storage.objects for delete
  using (bucket_id = 'activity-downloads' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'
  ));
