-- The current attempt schema does not store a content-version snapshot.
-- Until versioned attempts are introduced, freeze simulation/task content once
-- an attempt exists so historical and in-progress work cannot silently change.
create or replace function public.prevent_used_simulation_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_simulation_id text;
begin
  if tg_table_name = 'simulations' then
    if tg_op = 'DELETE' then
      if exists (select 1 from public.simulation_attempts a where a.simulation_id = old.id) then
        raise exception 'This simulation has participant attempts and cannot be deleted.' using errcode = '23514';
      end if;
      return old;
    elsif (new.company_id, new.role_name, new.title, new.definition)
      is distinct from (old.company_id, old.role_name, old.title, old.definition)
      and exists (select 1 from public.simulation_attempts a where a.simulation_id = old.id) then
      raise exception 'This simulation has participant attempts. Duplicate it as a new draft to change its content.'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then v_simulation_id := old.simulation_id;
  else v_simulation_id := new.simulation_id;
  end if;
  if exists (select 1 from public.simulation_attempts a where a.simulation_id = v_simulation_id) then
    raise exception 'This simulation has participant attempts. Its tasks are frozen to preserve existing work.'
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.prevent_used_simulation_content_change() from public, anon, authenticated;

drop trigger if exists freeze_used_simulation_content on public.simulations;
create trigger freeze_used_simulation_content
before update or delete on public.simulations
for each row execute function public.prevent_used_simulation_content_change();

drop trigger if exists freeze_used_simulation_tasks on public.simulation_tasks;
create trigger freeze_used_simulation_tasks
before insert or update or delete on public.simulation_tasks
for each row execute function public.prevent_used_simulation_content_change();
