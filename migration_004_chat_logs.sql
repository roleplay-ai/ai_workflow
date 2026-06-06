-- ============================================================
-- Migration 004: chat_logs
-- Stores every user ↔ AI Q&A exchange from the learner view.
-- ============================================================

create table public.chat_logs (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  activity_id       uuid        not null references public.activities(id) on delete cascade,
  step_index        int         not null,          -- 0-based index of the step the user was on
  step_title        text        not null default '',
  user_message      text        not null,
  ai_response       text        not null,
  navigated_to_step int         null,              -- 0-based index if AI issued a GOTO_STEP
  created_at        timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index chat_logs_user_id_idx        on public.chat_logs (user_id);
create index chat_logs_activity_id_idx    on public.chat_logs (activity_id);
create index chat_logs_created_at_idx     on public.chat_logs (created_at desc);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.chat_logs enable row level security;

-- Learners: insert and read their own logs
create policy "chat_logs: own insert"
  on public.chat_logs for insert
  with check (auth.uid() = user_id);

create policy "chat_logs: own select"
  on public.chat_logs for select
  using (auth.uid() = user_id);

-- Admins & superadmins: read logs for users in their company
create policy "chat_logs: admin select"
  on public.chat_logs for select
  using (exists (
    select 1
    from public.profiles admin_p
    join public.profiles learner_p on learner_p.id = chat_logs.user_id
    where admin_p.id = auth.uid()
      and admin_p.role in ('admin', 'superadmin')
      and (admin_p.company_id = learner_p.company_id or admin_p.role = 'superadmin')
  ));
