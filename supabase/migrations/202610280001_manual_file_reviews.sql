alter table public.simulation_submissions
  add column if not exists review_status text not null default 'not_required',
  add column if not exists manual_score integer,
  add column if not exists manual_feedback text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.simulation_submissions
  drop constraint if exists simulation_submissions_review_status_check;
alter table public.simulation_submissions
  add constraint simulation_submissions_review_status_check
  check (review_status in ('not_required', 'pending', 'reviewed'));
alter table public.simulation_submissions
  drop constraint if exists simulation_submissions_manual_score_check;
alter table public.simulation_submissions
  add constraint simulation_submissions_manual_score_check
  check (manual_score is null or manual_score between 0 and 100);

create or replace function public.set_submission_review_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_manual boolean;
begin
  select coalesce((t.definition->>'manualReview')::boolean, false)
    or exists (
      select 1 from jsonb_array_elements(coalesce(t.definition->'fields', '[]'::jsonb)) f
      where f->>'type' = 'file'
    )
  into v_manual
  from public.simulation_tasks t where t.id = new.task_id;

  if v_manual and new.review_status = 'not_required' then
    new.review_status := 'pending';
  elsif not v_manual and new.review_status is null then
    new.review_status := 'not_required';
  end if;
  return new;
end;
$$;
revoke all on function public.set_submission_review_status() from public, anon, authenticated;
drop trigger if exists set_submission_review_status on public.simulation_submissions;
create trigger set_submission_review_status
before insert or update of task_id, review_status on public.simulation_submissions
for each row execute function public.set_submission_review_status();

create or replace function public.preserve_manual_review_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.review_status = 'reviewed' and new.reviewed_at is not distinct from old.reviewed_at then
    new.score := old.score;
    new.assessment := old.assessment;
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_manual_review_result() from public, anon, authenticated;
drop trigger if exists preserve_manual_review_result on public.simulation_submissions;
create trigger preserve_manual_review_result
before update on public.simulation_submissions
for each row execute function public.preserve_manual_review_result();

update public.simulation_submissions ss
set review_status = 'pending'
from public.simulation_tasks t
where t.id = ss.task_id
  and ss.review_status = 'not_required'
  and (
    coalesce((t.definition->>'manualReview')::boolean, false)
    or exists (
      select 1 from jsonb_array_elements(coalesce(t.definition->'fields', '[]'::jsonb)) f
      where f->>'type' = 'file'
    )
  );

drop policy if exists "admins read all submissions" on public.simulation_submissions;
create policy "admins read all submissions" on public.simulation_submissions
  for select to authenticated using (public.is_current_user_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('simulation-submissions', 'simulation-submissions', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "participants upload own submission files" on storage.objects;
create policy "participants upload own submission files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'simulation-submissions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "owners and admins read submission files" on storage.objects;
create policy "owners and admins read submission files" on storage.objects
  for select to authenticated using (
    bucket_id = 'simulation-submissions'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_current_user_admin()
    )
  );

create or replace function public.admin_list_submission_reviews()
returns table (
  submission_id uuid,
  attempt_id uuid,
  task_id text,
  simulation_id text,
  simulation_title text,
  task_title text,
  user_id uuid,
  user_email text,
  submitted_at timestamptz,
  review_status text,
  manual_score integer,
  manual_feedback text,
  reviewed_at timestamptz,
  answers jsonb,
  rubric jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return query
    select ss.id, ss.attempt_id, ss.task_id, s.id, s.title, t.title,
      a.user_id, u.email::text, ss.submitted_at, ss.review_status,
      ss.manual_score, ss.manual_feedback, ss.reviewed_at, ss.answers,
      coalesce(t.definition->'questions', '[]'::jsonb)
    from public.simulation_submissions ss
    join public.simulation_attempts a on a.id = ss.attempt_id
    join auth.users u on u.id = a.user_id
    join public.simulations s on s.id = a.simulation_id
    join public.simulation_tasks t on t.id = ss.task_id
    where coalesce((t.definition->>'manualReview')::boolean, false)
      or exists (
        select 1 from jsonb_array_elements(coalesce(t.definition->'fields', '[]'::jsonb)) f
        where f->>'type' = 'file'
      )
    order by (ss.review_status = 'pending') desc, ss.submitted_at desc;
end;
$$;
revoke all on function public.admin_list_submission_reviews() from public, anon;
grant execute on function public.admin_list_submission_reviews() to authenticated;

create or replace function public.admin_review_submission(
  p_submission_id uuid,
  p_score integer,
  p_feedback text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception 'Score must be between 0 and 100';
  end if;
  if length(btrim(coalesce(p_feedback, ''))) < 5 then
    raise exception 'Feedback must contain at least 5 characters';
  end if;
  update public.simulation_submissions ss
  set review_status = 'reviewed', manual_score = p_score,
      manual_feedback = btrim(p_feedback), reviewed_by = auth.uid(), reviewed_at = now(),
      score = p_score,
      assessment = jsonb_build_object(
        'score', p_score,
        'breakdown', jsonb_build_array(jsonb_build_object(
          'fieldId', 'manual-review', 'label', 'Penilaian admin',
          'earned', p_score, 'max', 100, 'correct', p_score >= 70,
          'feedback', btrim(p_feedback)
        )),
        'rubricVersion', 'ADMIN-MANUAL-1', 'gradedAt', now()
      )
  where ss.id = p_submission_id and ss.review_status in ('pending', 'reviewed');
  if not found then raise exception 'Submission not found or not awaiting manual review'; end if;
end;
$$;
revoke all on function public.admin_review_submission(uuid, integer, text) from public, anon;
grant execute on function public.admin_review_submission(uuid, integer, text) to authenticated;
