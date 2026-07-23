-- Canonical work path: Workspace -> Workspace folder -> List -> Task.
-- Existing space links remain nullable compatibility metadata.

alter table public.lists
  alter column workspace_id set not null,
  alter column space_id drop not null;

create or replace function private.can_access_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists l
    join public.workspace_members wm on wm.workspace_id = l.workspace_id
    where l.id = p_list_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

drop policy if exists lists_select on public.lists;
drop policy if exists lists_insert on public.lists;
drop policy if exists lists_update on public.lists;

create policy lists_select on public.lists
for select using (private.can_access_workspace(workspace_id));

create policy lists_insert on public.lists
for insert with check (private.can_edit_workspace(workspace_id));

create policy lists_update on public.lists
for update
using (private.can_edit_list(id))
with check (private.can_edit_workspace(workspace_id));
