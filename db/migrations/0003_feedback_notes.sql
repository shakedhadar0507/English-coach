-- Owner feedback notes written from the floating "notes" button on any screen.
-- Each note records the screen it was written on so it can be fixed in context.
create table public.feedback_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  path text not null check (length(path) <= 500),
  page_title text check (length(page_title) <= 200),
  heading text check (length(heading) <= 300),
  note text not null check (length(note) between 1 and 4000),
  context jsonb not null default '{}'::jsonb,   -- viewport, theme, locale, user agent
  status text not null default 'open' check (status in ('open','done')),
  resolution text check (length(resolution) <= 2000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index feedback_notes_user_status_idx on public.feedback_notes (user_id, status, created_at desc);

alter table public.feedback_notes enable row level security;
create policy feedback_notes_own_select on public.feedback_notes for select to app_user using (user_id = private.uid());
create policy feedback_notes_own_insert on public.feedback_notes for insert to app_user with check (user_id = private.uid());
create policy feedback_notes_own_update on public.feedback_notes for update to app_user using (user_id = private.uid()) with check (user_id = private.uid());
create policy feedback_notes_own_delete on public.feedback_notes for delete to app_user using (user_id = private.uid());
grant select, insert, update, delete on public.feedback_notes to app_user;
