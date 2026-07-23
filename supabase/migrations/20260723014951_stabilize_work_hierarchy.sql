create schema if not exists private;
revoke all on schema private from public, anon;

alter table public.tasks rename to legacy_tasks;
alter table public.projects rename to legacy_projects;

revoke all on public.legacy_tasks from anon, authenticated;
revoke all on public.legacy_projects from anon, authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  icon text,
  color text,
  owner uuid not null references public.app_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  status text not null default 'Ativo'
    check (status in ('Ativo', 'Concluído', 'Arquivado')),
  icon text,
  color text,
  custom_statuses jsonb not null default '[]'::jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  custom_statuses jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, space_id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  folder_id uuid,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  custom_statuses jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_folder_space_fkey
    foreign key (folder_id, space_id)
    references public.folders(id, space_id)
    on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 240),
  description text,
  status text not null default 'Pendente',
  priority text not null default 'Média'
    check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  due_date date,
  assignee_id uuid references public.app_users(id) on delete set null,
  creator_id uuid not null references public.app_users(id) on delete restrict,
  tags text[],
  estimated_hours numeric(10,2)
    check (estimated_hours is null or estimated_hours >= 0),
  actual_hours numeric(10,2)
    check (actual_hours is null or actual_hours >= 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  parent_subtask_id uuid,
  title text not null check (length(btrim(title)) between 1 and 240),
  description text,
  status text not null default 'Pendente',
  priority text not null default 'Média'
    check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  assignee_id uuid references public.app_users(id) on delete set null,
  creator_id uuid not null references public.app_users(id) on delete restrict,
  due_date date,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, task_id),
  constraint subtasks_parent_task_fkey
    foreign key (parent_subtask_id, task_id)
    references public.subtasks(id, task_id)
    on delete cascade,
  check (parent_subtask_id is null or parent_subtask_id <> id)
);

create index work_workspaces_owner_idx
  on public.workspaces(owner);
create index work_workspace_members_user_workspace_idx
  on public.workspace_members(user_id, workspace_id);
create index work_spaces_workspace_position_idx
  on public.spaces(workspace_id, position);
create index work_folders_space_position_idx
  on public.folders(space_id, position);
create index work_lists_space_folder_position_idx
  on public.lists(space_id, folder_id, position);
create index work_lists_folder_idx
  on public.lists(folder_id) where folder_id is not null;
create index work_tasks_list_position_idx
  on public.tasks(list_id, position);
create index work_tasks_list_status_idx
  on public.tasks(list_id, status);
create index work_tasks_assignee_due_date_idx
  on public.tasks(assignee_id, due_date) where assignee_id is not null;
create index work_tasks_creator_idx
  on public.tasks(creator_id);
create index work_subtasks_task_parent_position_idx
  on public.subtasks(task_id, parent_subtask_id, position);
create index work_subtasks_parent_idx
  on public.subtasks(parent_subtask_id) where parent_subtask_id is not null;
create index work_subtasks_assignee_idx
  on public.subtasks(assignee_id) where assignee_id is not null;
create index work_subtasks_creator_idx
  on public.subtasks(creator_id);

create temporary table legacy_workspace_map (
  owner uuid primary key,
  workspace_id uuid not null unique
) on commit drop;

insert into legacy_workspace_map(owner, workspace_id)
select owner, gen_random_uuid()
from public.legacy_projects
group by owner;

insert into public.workspaces(
  id,
  name,
  description,
  icon,
  color,
  owner,
  created_at,
  updated_at
)
select
  m.workspace_id,
  'Workspace principal',
  'Workspace criado durante a migração segura do módulo Work',
  '🏢',
  '#4F46E5',
  m.owner,
  min(p.created_at),
  max(p.updated_at)
from legacy_workspace_map m
join public.legacy_projects p on p.owner = m.owner
group by m.workspace_id, m.owner;

insert into public.workspace_members(workspace_id, user_id, role, created_at)
select workspace_id, owner, 'owner', now()
from legacy_workspace_map;

insert into public.spaces(
  id,
  workspace_id,
  name,
  description,
  status,
  icon,
  color,
  custom_statuses,
  position,
  created_at,
  updated_at
)
select
  p.id,
  m.workspace_id,
  p.title,
  p.description,
  p.status,
  '📁',
  '#3B82F6',
  '[]'::jsonb,
  row_number() over (
    partition by p.owner order by p.created_at, p.id
  )::integer - 1,
  p.created_at,
  p.updated_at
from public.legacy_projects p
join legacy_workspace_map m on m.owner = p.owner;

create temporary table legacy_list_map (
  project_id uuid primary key,
  list_id uuid not null unique
) on commit drop;

insert into legacy_list_map(project_id, list_id)
select id, gen_random_uuid()
from public.legacy_projects;

insert into public.lists(
  id,
  space_id,
  folder_id,
  name,
  description,
  icon,
  color,
  custom_statuses,
  position,
  created_at,
  updated_at
)
select
  m.list_id,
  p.id,
  null,
  'Tarefas',
  'Lista padrão criada durante a migração',
  '📋',
  '#3B82F6',
  null,
  0,
  p.created_at,
  p.updated_at
from public.legacy_projects p
join legacy_list_map m on m.project_id = p.id;

insert into public.tasks(
  id,
  list_id,
  title,
  description,
  status,
  priority,
  due_date,
  assignee_id,
  creator_id,
  tags,
  estimated_hours,
  actual_hours,
  position,
  created_at,
  updated_at,
  completed_at
)
select
  t.id,
  m.list_id,
  t.title,
  t.description,
  t.status,
  case t.priority when 'Media' then 'Média' else t.priority end,
  t.due_date,
  t.owner,
  t.owner,
  null,
  null,
  null,
  row_number() over (
    partition by t.project_id order by t.created_at, t.id
  )::integer - 1,
  t.created_at,
  t.updated_at,
  case when t.status = 'Concluída' then t.updated_at else null end
from public.legacy_tasks t
join legacy_list_map m on m.project_id = t.project_id;

do $$
begin
  if (select count(*) from public.legacy_projects)
     <> (select count(*) from public.spaces) then
    raise exception 'project migration count mismatch';
  end if;

  if (select count(*) from public.legacy_tasks)
     <> (select count(*) from public.tasks) then
    raise exception 'task migration count mismatch';
  end if;

  if exists (
    select 1
    from public.legacy_projects p
    where not exists (select 1 from public.spaces s where s.id = p.id)
  ) then
    raise exception 'project UUID preservation failed';
  end if;

  if exists (
    select 1
    from public.legacy_tasks lt
    where not exists (select 1 from public.tasks t where t.id = lt.id)
  ) then
    raise exception 'task UUID preservation failed';
  end if;
end
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create function private.set_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'Concluída' and old.status is distinct from new.status then
    new.completed_at := now();
  elsif new.status <> 'Concluída' then
    new.completed_at := null;
  end if;
  return new;
end
$$;

create function private.prevent_workspace_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner is distinct from old.owner then
    raise exception 'workspace owner cannot be reassigned';
  end if;
  return new;
end
$$;

create function private.protect_owner_membership()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.role = 'owner' and (
    new.role is distinct from old.role
    or new.user_id is distinct from old.user_id
    or new.workspace_id is distinct from old.workspace_id
  ) then
    raise exception 'workspace owner membership cannot be reassigned or demoted';
  end if;
  return new;
end
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();
create trigger workspaces_prevent_owner_change
before update on public.workspaces
for each row execute function private.prevent_workspace_owner_change();
create trigger workspace_members_protect_owner
before update on public.workspace_members
for each row execute function private.protect_owner_membership();
create trigger spaces_set_updated_at
before update on public.spaces
for each row execute function private.set_updated_at();
create trigger folders_set_updated_at
before update on public.folders
for each row execute function private.set_updated_at();
create trigger lists_set_updated_at
before update on public.lists
for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();
create trigger tasks_set_completed_at
before update on public.tasks
for each row execute function private.set_completed_at();
create trigger subtasks_set_updated_at
before update on public.subtasks
for each row execute function private.set_updated_at();
create trigger subtasks_set_completed_at
before update on public.subtasks
for each row execute function private.set_completed_at();

create function private.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create function private.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and w.owner = (select auth.uid())
  );
$$;

create function private.can_edit_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  );
$$;

create function private.can_access_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.spaces s
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where s.id = p_space_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.spaces s
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where s.id = p_space_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.can_access_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where l.id = p_list_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where l.id = p_list_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    join public.lists l on l.id = t.list_id
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where t.id = p_task_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    join public.lists l on l.id = t.list_id
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where t.id = p_task_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.can_edit_workspace(uuid) to authenticated;
grant execute on function private.is_workspace_admin(uuid) to authenticated;
grant execute on function private.can_access_space(uuid) to authenticated;
grant execute on function private.can_edit_space(uuid) to authenticated;
grant execute on function private.can_access_list(uuid) to authenticated;
grant execute on function private.can_edit_list(uuid) to authenticated;
grant execute on function private.can_access_task(uuid) to authenticated;
grant execute on function private.can_edit_task(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.spaces enable row level security;
alter table public.folders enable row level security;
alter table public.lists enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;

revoke all on public.workspaces, public.workspace_members, public.spaces,
  public.folders, public.lists, public.tasks, public.subtasks from anon;
grant select, insert, update, delete on public.workspaces, public.workspace_members,
  public.spaces, public.folders, public.lists, public.tasks, public.subtasks
  to authenticated;

create policy workspaces_select on public.workspaces
for select to authenticated
using (owner = (select auth.uid()) or private.is_workspace_member(id));
create policy workspaces_insert on public.workspaces
for insert to authenticated
with check (owner = (select auth.uid()));
create policy workspaces_update on public.workspaces
for update to authenticated
using (private.is_workspace_admin(id))
with check (private.is_workspace_admin(id));
create policy workspaces_delete on public.workspaces
for delete to authenticated
using (owner = (select auth.uid()));

create policy workspace_members_select on public.workspace_members
for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy workspace_members_insert on public.workspace_members
for insert to authenticated
with check (
  (role = 'owner' and user_id = (select auth.uid())
    and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.is_workspace_admin(workspace_id))
);
create policy workspace_members_update on public.workspace_members
for update to authenticated
using (
  private.is_workspace_admin(workspace_id)
  and (role <> 'owner' or private.is_workspace_owner(workspace_id))
)
with check (
  private.is_workspace_admin(workspace_id)
  and (role <> 'owner' or (user_id = (select auth.uid())
    and private.is_workspace_owner(workspace_id)))
);
create policy workspace_members_delete on public.workspace_members
for delete to authenticated
using (
  role <> 'owner' and private.is_workspace_admin(workspace_id)
);

create policy spaces_select on public.spaces
for select to authenticated using (private.is_workspace_member(workspace_id));
create policy spaces_insert on public.spaces
for insert to authenticated with check (private.can_edit_workspace(workspace_id));
create policy spaces_update on public.spaces
for update to authenticated using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));
create policy spaces_delete on public.spaces
for delete to authenticated using (private.can_edit_workspace(workspace_id));

create policy folders_select on public.folders
for select to authenticated using (private.can_access_space(space_id));
create policy folders_insert on public.folders
for insert to authenticated with check (private.can_edit_space(space_id));
create policy folders_update on public.folders
for update to authenticated using (private.can_edit_space(space_id))
with check (private.can_edit_space(space_id));
create policy folders_delete on public.folders
for delete to authenticated using (private.can_edit_space(space_id));

create policy lists_select on public.lists
for select to authenticated using (private.can_access_space(space_id));
create policy lists_insert on public.lists
for insert to authenticated with check (private.can_edit_space(space_id));
create policy lists_update on public.lists
for update to authenticated using (private.can_edit_list(id))
with check (private.can_edit_space(space_id));
create policy lists_delete on public.lists
for delete to authenticated using (private.can_edit_list(id));

create policy tasks_select on public.tasks
for select to authenticated using (private.can_access_list(list_id));
create policy tasks_insert on public.tasks
for insert to authenticated with check (
  private.can_edit_list(list_id) and creator_id = (select auth.uid())
);
create policy tasks_update on public.tasks
for update to authenticated using (private.can_edit_task(id))
with check (private.can_edit_list(list_id));
create policy tasks_delete on public.tasks
for delete to authenticated using (private.can_edit_task(id));

create policy subtasks_select on public.subtasks
for select to authenticated using (private.can_access_task(task_id));
create policy subtasks_insert on public.subtasks
for insert to authenticated with check (
  private.can_edit_task(task_id) and creator_id = (select auth.uid())
);
create policy subtasks_update on public.subtasks
for update to authenticated using (private.can_edit_task(task_id))
with check (private.can_edit_task(task_id));
create policy subtasks_delete on public.subtasks
for delete to authenticated using (private.can_edit_task(task_id));

notify pgrst, 'reload schema';
