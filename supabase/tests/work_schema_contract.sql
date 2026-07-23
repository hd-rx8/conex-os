do $$
declare
  table_name text;
  missing_index text;
begin
  foreach table_name in array array[
    'workspaces',
    'workspace_members',
    'spaces',
    'folders',
    'lists',
    'tasks',
    'subtasks'
  ] loop
    if to_regclass(format('public.%I', table_name)) is null then
      raise exception 'canonical Work table missing: %', table_name;
    end if;
  end loop;

  if to_regclass('public.legacy_projects') is null
     or to_regclass('public.legacy_tasks') is null then
    raise exception 'legacy recovery table missing';
  end if;

  if exists (
    select 1
    from public.legacy_projects lp
    where not exists (select 1 from public.spaces s where s.id = lp.id)
  ) then
    raise exception 'legacy project id not preserved';
  end if;

  if exists (
    select 1
    from public.legacy_tasks lt
    where not exists (select 1 from public.tasks t where t.id = lt.id)
  ) then
    raise exception 'legacy task id not preserved';
  end if;

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
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'workspaces',
        'workspace_members',
        'spaces',
        'folders',
        'lists',
        'tasks',
        'subtasks'
      ])
      and not c.relrowsecurity
  ) then
    raise exception 'RLS is disabled on a canonical Work table';
  end if;

  foreach missing_index in array array[
    'work_workspaces_owner_idx',
    'work_workspace_members_user_workspace_idx',
    'work_spaces_workspace_position_idx',
    'work_folders_space_position_idx',
    'work_lists_space_folder_position_idx',
    'work_lists_folder_space_idx',
    'work_lists_folder_idx',
    'work_tasks_list_position_idx',
    'work_tasks_list_status_idx',
    'work_tasks_assignee_due_date_idx',
    'work_tasks_creator_idx',
    'work_subtasks_task_parent_position_idx',
    'work_subtasks_parent_task_idx',
    'work_subtasks_parent_idx',
    'work_subtasks_assignee_idx',
    'work_subtasks_creator_idx'
  ] loop
    if to_regclass(format('public.%I', missing_index)) is null then
      raise exception 'required Work index missing: %', missing_index;
    end if;
  end loop;

  if has_table_privilege('anon', 'public.workspaces', 'select')
     or has_table_privilege('anon', 'public.tasks', 'select') then
    raise exception 'anon can access canonical Work tables';
  end if;

  if has_function_privilege(
    'anon',
    'private.is_workspace_member(uuid)',
    'execute'
  ) then
    raise exception 'anon can execute private membership helper';
  end if;

  if not has_function_privilege(
    'authenticated',
    'private.is_workspace_member(uuid)',
    'execute'
  ) then
    raise exception 'authenticated cannot execute membership helper';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and confrelid = 'public.lists'::regclass
      and contype = 'f'
  ) then
    raise exception 'tasks -> lists foreign key missing';
  end if;
end
$$;
