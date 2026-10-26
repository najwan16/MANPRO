-- Admin membership is assigned by a trusted project owner, never by signup metadata.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists "admins read own admin membership" on public.admin_users;
create policy "admins read own admin membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.admin_users to authenticated;

drop policy if exists "admins read all companies" on public.simulation_companies;
create policy "admins read all companies" on public.simulation_companies
  for select to authenticated using (public.is_current_user_admin());
drop policy if exists "admins insert companies" on public.simulation_companies;
create policy "admins insert companies" on public.simulation_companies
  for insert to authenticated with check (public.is_current_user_admin());
drop policy if exists "admins update companies" on public.simulation_companies;
create policy "admins update companies" on public.simulation_companies
  for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
grant insert, update on public.simulation_companies to authenticated;

drop policy if exists "admins read all simulations" on public.simulations;
create policy "admins read all simulations" on public.simulations
  for select to authenticated using (public.is_current_user_admin());
drop policy if exists "admins insert simulations" on public.simulations;
create policy "admins insert simulations" on public.simulations
  for insert to authenticated with check (public.is_current_user_admin());
drop policy if exists "admins update simulations" on public.simulations;
create policy "admins update simulations" on public.simulations
  for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
grant insert, update on public.simulations to authenticated;

drop policy if exists "admins read all tasks" on public.simulation_tasks;
create policy "admins read all tasks" on public.simulation_tasks
  for select to authenticated using (public.is_current_user_admin());
drop policy if exists "admins insert tasks" on public.simulation_tasks;
create policy "admins insert tasks" on public.simulation_tasks
  for insert to authenticated with check (public.is_current_user_admin());
drop policy if exists "admins update tasks" on public.simulation_tasks;
create policy "admins update tasks" on public.simulation_tasks
  for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
drop policy if exists "admins delete tasks" on public.simulation_tasks;
create policy "admins delete tasks" on public.simulation_tasks
  for delete to authenticated using (public.is_current_user_admin());
grant insert, update, delete on public.simulation_tasks to authenticated;

create or replace function public.admin_save_simulation(p_simulation jsonb, p_tasks jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id text := p_simulation->>'id';
  v_company_id text := p_simulation->>'company_id';
  v_status text := p_simulation->>'status';
  v_task jsonb;
  v_expected_count integer;
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if v_id is null or v_id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid simulation id';
  end if;
  if v_company_id is null or not exists (select 1 from public.simulation_companies c where c.id = v_company_id) then
    raise exception 'Company does not exist';
  end if;
  if coalesce(p_simulation->>'role_name', '') = '' or coalesce(p_simulation->>'title', '') = '' then
    raise exception 'Simulation role and title are required';
  end if;
  if v_status not in ('draft', 'ready', 'soon', 'archived') then
    raise exception 'Invalid simulation status';
  end if;
  if jsonb_typeof(p_simulation->'definition') <> 'object' or jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) = 0 then
    raise exception 'Simulation definition and a non-empty task array are required';
  end if;
  if (p_simulation->>'price_idr')::integer < 0 then
    raise exception 'Price must be zero or greater';
  end if;

  insert into public.simulations (id, company_id, role_name, title, price_idr, status, definition, updated_at)
  values (v_id, v_company_id, p_simulation->>'role_name', p_simulation->>'title',
    (p_simulation->>'price_idr')::integer, v_status, p_simulation->'definition', now())
  on conflict (id) do update set company_id = excluded.company_id, role_name = excluded.role_name,
    title = excluded.title, price_idr = excluded.price_idr, status = excluded.status,
    definition = excluded.definition, updated_at = now();

  -- Free the unique sequence slots first so admins can reorder existing tasks.
  update public.simulation_tasks set sequence = sequence + 1000000, updated_at = now()
    where simulation_id = v_id;

  v_expected_count := jsonb_array_length(p_tasks);
  for v_task in select value from jsonb_array_elements(p_tasks)
  loop
    if coalesce(v_task->>'id', '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or coalesce(v_task->>'title', '') = ''
      or jsonb_typeof(v_task->'definition') <> 'object'
      or (v_task->>'sequence')::integer < 1 then
      raise exception 'Invalid task in simulation';
    end if;
    insert into public.simulation_tasks (id, simulation_id, sequence, title, definition, updated_at)
    values (v_task->>'id', v_id, (v_task->>'sequence')::integer, v_task->>'title', v_task->'definition', now())
    on conflict (id) do update set sequence = excluded.sequence, title = excluded.title,
      definition = excluded.definition, updated_at = now()
      where public.simulation_tasks.simulation_id = excluded.simulation_id;
  end loop;

  if (select count(distinct t.id) from public.simulation_tasks t
      join jsonb_array_elements(p_tasks) as requested(value) on requested.value->>'id' = t.id
      where t.simulation_id = v_id) <> v_expected_count then
    raise exception 'A task id belongs to another simulation';
  end if;
  delete from public.simulation_tasks t where t.simulation_id = v_id
    and not exists (select 1 from jsonb_array_elements(p_tasks) task where task->>'id' = t.id);
end;
$$;

revoke all on function public.admin_save_simulation(jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_simulation(jsonb, jsonb) to authenticated;
