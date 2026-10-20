-- Backend foundation for SiMagang. Apply with Supabase CLI or SQL editor.
-- Scores must be computed by a trusted server/Edge Function before production use.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  nickname text not null default '',
  interest text not null default '',
  institution text not null default '',
  major text not null default '',
  education_level text not null default '',
  city text not null default '',
  bio text not null default '',
  avatar_color text not null default 'navy' check (avatar_color in ('navy','teal','purple')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_id text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed','expired','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_submissions
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists attempt_id uuid references public.test_attempts(id) on delete cascade,
  add column if not exists expired boolean not null default false;

alter table public.user_submissions alter column score drop not null;
alter table public.user_submissions alter column submitted_at set default now();

create index if not exists user_submissions_owner_attempt_idx
  on public.user_submissions(user_id, attempt_id, submitted_at desc);
create index if not exists test_attempts_owner_idx
  on public.test_attempts(user_id, created_at desc);
create unique index if not exists user_submissions_attempt_task_uidx
  on public.user_submissions(attempt_id, task_id) where attempt_id is not null;

alter table public.profiles enable row level security;
alter table public.test_attempts enable row level security;
alter table public.user_submissions enable row level security;

drop policy if exists "profile owner read" on public.profiles;
create policy "profile owner read" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
drop policy if exists "profile owner insert" on public.profiles;
create policy "profile owner insert" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists "profile owner update" on public.profiles;
create policy "profile owner update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "attempt owner read" on public.test_attempts;
create policy "attempt owner read" on public.test_attempts for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "attempt owner create" on public.test_attempts;
create policy "attempt owner create" on public.test_attempts for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "attempt owner update" on public.test_attempts;

drop policy if exists "submission owner read" on public.user_submissions;
create policy "submission owner read" on public.user_submissions for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "submission owner create" on public.user_submissions;
create policy "submission owner create" on public.user_submissions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and user_email = (select auth.jwt() ->> 'email')
    and score is null
    and exists (
      select 1 from public.test_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );

-- Never allow a browser to change a graded answer, score, or submission timestamp.
revoke update, delete on public.user_submissions from anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();
