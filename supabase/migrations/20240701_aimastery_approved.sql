-- Add aimastery_approved flag to profiles
alter table public.profiles
  add column if not exists aimastery_approved boolean not null default false;
