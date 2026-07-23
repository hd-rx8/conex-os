create table public.workspace_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_workspace_folders_workspace_position_idx
  on public.workspace_folders(workspace_id, position);

alter table public.spaces 
add column workspace_folder_id uuid references public.workspace_folders(id) on delete set null;

create index work_spaces_workspace_folder_idx
  on public.spaces(workspace_folder_id) where workspace_folder_id is not null;

create trigger workspace_folders_set_updated_at
before update on public.workspace_folders
for each row execute function private.set_updated_at();

alter table public.workspace_folders enable row level security;
revoke all on public.workspace_folders from anon;
grant select, insert, update, delete on public.workspace_folders to authenticated;

create policy workspace_folders_select on public.workspace_folders
for select to authenticated using (private.is_workspace_member(workspace_id));

create policy workspace_folders_insert on public.workspace_folders
for insert to authenticated with check (private.can_edit_workspace(workspace_id));

create policy workspace_folders_update on public.workspace_folders
for update to authenticated using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy workspace_folders_delete on public.workspace_folders
for delete to authenticated using (private.can_edit_workspace(workspace_id));

notify pgrst, 'reload schema';
