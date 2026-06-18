alter table public.profiles
  add column if not exists aimastery_requested boolean not null default false;
