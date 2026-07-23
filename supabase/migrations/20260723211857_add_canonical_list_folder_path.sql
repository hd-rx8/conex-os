-- This migration is additive. Existing space/folder/list paths remain valid
-- while lists gain the canonical workspace-folder provenance needed for the
-- eventual Workspace -> Folder -> List hierarchy.

alter table public.lists
  add column if not exists workspace_id uuid,
  add column if not exists workspace_folder_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.workspace_folders'::regclass
      and conname = 'workspace_folders_id_workspace_key'
  ) then
    alter table public.workspace_folders
      add constraint workspace_folders_id_workspace_key
      unique (id, workspace_id);
  end if;
end
$$;

update public.lists as l
set
  workspace_id = coalesce(l.workspace_id, s.workspace_id),
  workspace_folder_id = coalesce(l.workspace_folder_id, s.workspace_folder_id)
from public.spaces as s
where l.space_id = s.id
  and (l.workspace_id is null or l.workspace_folder_id is null);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lists'::regclass
      and conname = 'lists_workspace_id_fkey'
  ) then
    alter table public.lists
      add constraint lists_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lists'::regclass
      and conname = 'lists_workspace_folder_workspace_fkey'
  ) then
    alter table public.lists
      add constraint lists_workspace_folder_workspace_fkey
      foreign key (workspace_folder_id, workspace_id)
      references public.workspace_folders(id, workspace_id)
      on delete set null (workspace_folder_id)
      not valid;
  end if;
end
$$;

alter table public.lists
  validate constraint lists_workspace_id_fkey;

alter table public.lists
  validate constraint lists_workspace_folder_workspace_fkey;

create index if not exists work_lists_workspace_folder_position_idx
  on public.lists(workspace_id, workspace_folder_id, position);
