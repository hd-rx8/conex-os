begin;

insert into public.app_users(id, name, email)
values
  ('00000000-0000-0000-0000-00000000a001', 'RLS User A', 'rls-a@invalid.example'),
  ('00000000-0000-0000-0000-00000000b001', 'RLS User B', 'rls-b@invalid.example');

insert into public.workspaces(id, name, owner)
values
  ('00000000-0000-0000-0000-00000000a010', 'Workspace A', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-00000000b010', 'Workspace B', '00000000-0000-0000-0000-00000000b001');

insert into public.workspace_members(workspace_id, user_id, role)
values
  ('00000000-0000-0000-0000-00000000a010', '00000000-0000-0000-0000-00000000a001', 'owner'),
  ('00000000-0000-0000-0000-00000000b010', '00000000-0000-0000-0000-00000000b001', 'viewer');

insert into public.spaces(id, workspace_id, name)
values
  ('00000000-0000-0000-0000-00000000a020', '00000000-0000-0000-0000-00000000a010', 'Space A'),
  ('00000000-0000-0000-0000-00000000b020', '00000000-0000-0000-0000-00000000b010', 'Space B');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}',
  true
);

do $$
declare
  affected integer;
begin
  if (select count(*) from public.workspaces) <> 1 then
    raise exception 'user A workspace isolation failed';
  end if;

  if exists (
    select 1 from public.spaces
    where id = '00000000-0000-0000-0000-00000000b020'
  ) then
    raise exception 'user A can read user B space';
  end if;

  update public.spaces
  set name = 'Cross-tenant write'
  where id = '00000000-0000-0000-0000-00000000b020';
  get diagnostics affected = row_count;

  if affected <> 0 then
    raise exception 'user A can update user B space';
  end if;
end
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000b001","role":"authenticated"}',
  true
);

do $$
declare
  affected integer;
begin
  if not exists (
    select 1 from public.spaces
    where id = '00000000-0000-0000-0000-00000000b020'
  ) then
    raise exception 'viewer cannot read their workspace';
  end if;

  update public.spaces
  set name = 'Viewer write'
  where id = '00000000-0000-0000-0000-00000000b020';
  get diagnostics affected = row_count;

  if affected <> 0 then
    raise exception 'viewer can update their workspace';
  end if;
end
$$;

reset role;
rollback;
