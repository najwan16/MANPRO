-- Cloud-backed state used by the current UI adapter.
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;
drop policy if exists "users read own app state" on public.user_app_state;
create policy "users read own app state" on public.user_app_state for select using (auth.uid() = user_id);
drop policy if exists "users create own app state" on public.user_app_state;
create policy "users create own app state" on public.user_app_state for insert with check (auth.uid() = user_id);
drop policy if exists "users update own app state" on public.user_app_state;
create policy "users update own app state" on public.user_app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.user_app_state to authenticated;
