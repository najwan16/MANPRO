-- Keep one active attempt per learner and simulation. Older unfinished attempts
-- remain available as history but no longer count as current progress.
with ranked as (
  select id,
         row_number() over (partition by user_id, simulation_id order by started_at desc, id desc) as position
  from public.simulation_attempts
  where status = 'in_progress'
)
update public.simulation_attempts a
set status = 'abandoned', completed_at = null
from ranked r
where a.id = r.id and r.position > 1;

create unique index if not exists simulation_attempts_one_active_idx
  on public.simulation_attempts(user_id, simulation_id)
  where status = 'in_progress';

create or replace function public.sync_my_simulation_state(p_state jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_entitlement jsonb;
  v_attempt jsonb;
  v_final jsonb;
  v_task record;
  v_attempt_id uuid;
  v_simulation_id text;
  v_submitted_count integer;
  v_task_count integer;
  v_requested_status text;
begin
  if v_user_id is null or v_email = '' then
    raise exception 'Authentication required';
  end if;
  if lower(coalesce(p_state #>> '{user,email}', '')) <> v_email then
    raise exception 'State owner does not match the authenticated user';
  end if;

  insert into public.user_app_state(user_id, state, updated_at)
  values (v_user_id, p_state, now())
  on conflict (user_id) do update set state = excluded.state, updated_at = excluded.updated_at;

  -- This remains demo checkout logic; production entitlements should come from a verified payment webhook.
  for v_entitlement in
    select value from jsonb_array_elements(coalesce(p_state -> 'entitlements', '[]'::jsonb)) as items(value)
  loop
    if lower(coalesce(v_entitlement ->> 'userEmail', '')) = v_email
       and exists (select 1 from public.simulations s where s.id = v_entitlement ->> 'simulationId' and s.status = 'ready') then
      insert into public.simulation_entitlements(user_id, simulation_id, status)
      values (v_user_id, v_entitlement ->> 'simulationId', 'active')
      on conflict (user_id, simulation_id) do update set status = 'active';
    end if;
  end loop;

  for v_attempt in
    select value from jsonb_array_elements(coalesce(p_state -> 'attempts', '[]'::jsonb)) as items(value)
  loop
    if lower(coalesce(v_attempt ->> 'owner', '')) <> v_email
       or coalesce(v_attempt ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      continue;
    end if;
    v_attempt_id := (v_attempt ->> 'id')::uuid;
    v_simulation_id := v_attempt ->> 'simulationId';
    v_requested_status := coalesce(v_attempt ->> 'status', 'in_progress');
    if not exists (
      select 1 from public.simulation_entitlements e
      where e.user_id = v_user_id and e.simulation_id = v_simulation_id and e.status = 'active'
    ) then
      continue;
    end if;
    if exists (select 1 from public.simulation_attempts a where a.id = v_attempt_id and a.user_id <> v_user_id) then
      raise exception 'Attempt ID belongs to another user';
    end if;

    insert into public.simulation_attempts(id, user_id, simulation_id, status, started_at)
    values (
      v_attempt_id, v_user_id, v_simulation_id,
      case when v_requested_status = 'abandoned' then 'abandoned' else 'in_progress' end,
      coalesce((v_attempt ->> 'createdAt')::timestamptz, now())
    )
    on conflict (id) do update set
      simulation_id = excluded.simulation_id,
      status = excluded.status;

    v_submitted_count := 0;
    for v_task in
      select t.id, t.sequence from public.simulation_tasks t
      where t.simulation_id = v_simulation_id order by t.sequence
    loop
      v_final := v_attempt #> array['tasks', v_task.id, 'final'];
      if v_final is null or v_final = 'null'::jsonb then
        continue;
      end if;
      if v_task.sequence <> v_submitted_count + 1 then
        raise exception 'Tasks must be submitted in sequence';
      end if;
      insert into public.simulation_submissions(attempt_id, task_id, answers, score, assessment, submitted_at)
      values (
        v_attempt_id,
        v_task.id,
        coalesce(v_final -> 'answers', '{}'::jsonb),
        nullif(v_final #>> '{assessment,score}', '')::integer,
        v_final -> 'assessment',
        coalesce((v_final ->> 'submittedAt')::timestamptz, now())
      )
      on conflict (attempt_id, task_id) do update set
        answers = excluded.answers,
        score = excluded.score,
        assessment = excluded.assessment,
        submitted_at = excluded.submitted_at;
      v_submitted_count := v_submitted_count + 1;
    end loop;

    select count(*) into v_task_count from public.simulation_tasks where simulation_id = v_simulation_id;
    update public.simulation_attempts
    set status = case
          when v_requested_status = 'abandoned' then 'abandoned'
          when v_task_count > 0 and v_submitted_count = v_task_count then 'completed'
          else 'in_progress'
        end,
        completed_at = case
          when v_requested_status <> 'abandoned' and v_task_count > 0 and v_submitted_count = v_task_count then now()
          else null
        end
    where id = v_attempt_id and user_id = v_user_id;
  end loop;
end;
$$;

revoke all on function public.sync_my_simulation_state(jsonb) from public, anon;
grant execute on function public.sync_my_simulation_state(jsonb) to authenticated;
