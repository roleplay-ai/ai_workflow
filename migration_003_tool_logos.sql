-- Tool logos: superadmin uploads per tool (claude, gemini, etc.)
-- Run in Supabase SQL Editor after prior migrations.

create table if not exists public.tool_logos (
  tool       text primary key,
  logo_url   text not null,
  updated_at timestamptz default now()
);

alter table public.tool_logos enable row level security;

create policy "tool_logos: authenticated select"
  on public.tool_logos for select
  to authenticated
  using (true);

create policy "tool_logos: superadmin insert"
  on public.tool_logos for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "tool_logos: superadmin update"
  on public.tool_logos for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "tool_logos: superadmin delete"
  on public.tool_logos for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

insert into storage.buckets (id, name, public)
  values ('tool-logos', 'tool-logos', true)
  on conflict (id) do nothing;

create policy "tool-logos storage: public select"
  on storage.objects for select
  using (bucket_id = 'tool-logos');

create policy "tool-logos storage: superadmin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'tool-logos' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "tool-logos storage: superadmin update"
  on storage.objects for update
  using (
    bucket_id = 'tool-logos' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

create policy "tool-logos storage: superadmin delete"
  on storage.objects for delete
  using (
    bucket_id = 'tool-logos' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );
