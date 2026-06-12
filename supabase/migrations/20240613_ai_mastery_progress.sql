-- Track which AI Mastery Course modules each user has completed
create table public.ai_mastery_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table public.ai_mastery_progress enable row level security;

create policy "Users can read own mastery progress"
  on public.ai_mastery_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own mastery progress"
  on public.ai_mastery_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own mastery progress"
  on public.ai_mastery_progress for delete
  using (auth.uid() = user_id);
