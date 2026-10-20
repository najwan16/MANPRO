# Supabase PostgreSQL Data Model

The deployable catalog schema is in `supabase/migrations/202610200001_simulation_catalog.sql`. Per-user snapshots are added by `supabase/migrations/202610200002_user_app_state.sql`. Apply both migrations, then run `scripts/seed-supabase-catalog.mjs` locally with a service-role key. In Supabase mode, the frontend reads companies, simulations, and task definitions from the database. It loads and persists each user's access, attempts, drafts, timers, submissions, profile details, and dashboard counts through `user_app_state`.

`user_app_state` is a compatibility snapshot for the current synchronous frontend. The normalized `simulation_entitlements`, `simulation_attempts`, and `simulation_submissions` tables are defined for a later backend step; current frontend mutations are not yet written to those tables.

## Legacy proposed model

The original model below is retained for reference.

## Entity schema

```sql
-- IDs are UUID; auth.users from Supabase Auth. All enums below should become CHECK constraints / lookup types.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  role_name text not null,
  company_name text not null,
  company_is_fictional boolean not null default true,
  title text not null,
  price_idr integer not null check (price_idr >= 0),
  status text not null check (status in ('ready','soon','archived')),
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id),
  sequence integer not null check (sequence > 0),
  rubric_version text not null,
  public_description text not null,
  unique(simulation_id,sequence)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  simulation_id uuid not null references public.simulations(id),
  amount_idr integer not null check(amount_idr >= 0),
  status text not null check(status in ('pending','paid','failed','cancelled')),
  provider_ref text unique,
  created_at timestamptz not null default now()
);
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  simulation_id uuid not null references public.simulations(id),
  order_id uuid references public.orders(id),
  status text not null check(status in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique(user_id,simulation_id)
);
create table public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  simulation_id uuid not null references public.simulations(id),
  status text not null check(status in ('in_progress','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulation_attempts(id),
  task_id uuid not null references public.tasks(id),
  version integer not null check(version in (1,2)),
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  unique(attempt_id,task_id,version)
);
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id),
  rubric_version text not null,
  score integer not null check(score between 0 and 100),
  breakdown jsonb not null,
  graded_at timestamptz not null default now()
);
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.simulation_attempts(id),
  verification_code text not null unique,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);
```

## Recommended rules

1. `simulations` public read for `ready` / `soon` catalog; rubric answer keys **must not** be publicly readable.
2. Enable RLS for every private table. A student may read only their own profile, orders, entitlements, attempts, submissions, reports, certificate. Grading and entitlement writes are Edge Function/service-role only.
3. `orders.status=paid` only after verified payment gateway webhook; **never** from frontend success screen.
4. Only an active entitled user can create attempts. Validate ownership on every submission and prevent task skipping.
5. The `(attempt_id, task_id, version)` uniqueness requirement makes V1/V2 immutable snapshots; allow drafts in a separate `drafts` table if needed, with `unique(attempt_id,task_id)`.
6. Certificate issuance requires server-side completion and threshold verification; public verification endpoint must not leak unrelated user data.
7. Keep explicit retention and deletion policy for reports and artifacts, in line with applicable privacy obligations.
8. For optional guest Free Task results, use anonymous session token carefully; avoid storing email or linking to identifiable person until consent.

## RLS example pattern (not a complete migration)

```sql
alter table public.simulation_attempts enable row level security;
create policy "students see own attempts"
  on public.simulation_attempts for select
  using (auth.uid() = user_id);
-- Do not add open INSERT/UPDATE policies. Use security-definer/Edge Function checks
-- for attempts, submissions, grades, and entitlements.
```
