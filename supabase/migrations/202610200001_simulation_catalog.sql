-- Runtime catalog and learner state. Apply with `supabase db push` or paste into
-- the Supabase SQL editor before running the catalog seeder.
create table if not exists public.simulation_companies (
  id text primary key,
  name text not null,
  definition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id text primary key,
  company_id text not null references public.simulation_companies(id),
  role_name text not null,
  title text not null,
  price_idr integer not null default 0 check (price_idr >= 0),
  status text not null default 'draft' check (status in ('draft','ready','soon','archived')),
  definition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_tasks (
  id text primary key,
  simulation_id text not null references public.simulations(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  title text not null,
  definition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (simulation_id, sequence)
);

create table if not exists public.simulation_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id text not null references public.simulations(id),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  primary key (user_id, simulation_id)
);

create table if not exists public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id text not null references public.simulations(id),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.simulation_submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulation_attempts(id) on delete cascade,
  task_id text not null references public.simulation_tasks(id),
  answers jsonb not null default '{}'::jsonb,
  score integer check (score between 0 and 100),
  assessment jsonb,
  submitted_at timestamptz not null default now(),
  unique (attempt_id, task_id)
);

-- Canonical UI state snapshot lets the current synchronous renderer hydrate
-- immediately while relational APIs are introduced incrementally.
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists simulation_tasks_order_idx on public.simulation_tasks(simulation_id, sequence);
create index if not exists simulation_attempts_owner_idx on public.simulation_attempts(user_id, started_at desc);
create index if not exists simulation_submissions_attempt_idx on public.simulation_submissions(attempt_id);

alter table public.simulation_companies enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_tasks enable row level security;
alter table public.simulation_entitlements enable row level security;
alter table public.simulation_attempts enable row level security;
alter table public.simulation_submissions enable row level security;
alter table public.user_app_state enable row level security;

drop policy if exists "catalog companies are readable" on public.simulation_companies;
create policy "catalog companies are readable" on public.simulation_companies for select using (true);
drop policy if exists "published simulations are readable" on public.simulations;
create policy "published simulations are readable" on public.simulations for select using (status in ('ready','soon'));
drop policy if exists "published tasks are readable" on public.simulation_tasks;
create policy "published tasks are readable" on public.simulation_tasks for select using (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.status in ('ready','soon'))
);

drop policy if exists "users read own entitlements" on public.simulation_entitlements;
create policy "users read own entitlements" on public.simulation_entitlements for select using (auth.uid() = user_id);
drop policy if exists "users read own attempts" on public.simulation_attempts;
create policy "users read own attempts" on public.simulation_attempts for select using (auth.uid() = user_id);
drop policy if exists "users read own submissions" on public.simulation_submissions;
create policy "users read own submissions" on public.simulation_submissions for select using (
  exists (select 1 from public.simulation_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
drop policy if exists "users read own app state" on public.user_app_state;
create policy "users read own app state" on public.user_app_state for select using (auth.uid() = user_id);
drop policy if exists "users create own app state" on public.user_app_state;
create policy "users create own app state" on public.user_app_state for insert with check (auth.uid() = user_id);
drop policy if exists "users update own app state" on public.user_app_state;
create policy "users update own app state" on public.user_app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mutations to entitlements, attempts, and submissions must be added through
-- trusted RPCs/Edge Functions after payment and task-sequence validation.
revoke insert, update, delete on public.simulation_entitlements from anon, authenticated;
revoke insert, update, delete on public.simulation_attempts from anon, authenticated;
revoke insert, update, delete on public.simulation_submissions from anon, authenticated;
grant select on public.simulation_companies, public.simulations, public.simulation_tasks to anon, authenticated;
grant select on public.simulation_entitlements, public.simulation_attempts, public.simulation_submissions to authenticated;
grant select, insert, update on public.user_app_state to authenticated;
