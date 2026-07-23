create table if not exists public.workspace_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_folders_id_workspace_key unique (id, workspace_id)
);

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

create index if not exists work_workspace_folders_workspace_position_idx
  on public.workspace_folders(workspace_id, position);

alter table public.spaces
  add column if not exists workspace_folder_id uuid;

alter table public.spaces
  drop constraint if exists spaces_workspace_folder_id_fkey;

alter table public.spaces
  drop constraint if exists spaces_workspace_folder_workspace_fkey;

update public.spaces as s
set workspace_folder_id = null
where s.workspace_folder_id is not null
  and not exists (
    select 1
    from public.workspace_folders as wf
    where wf.id = s.workspace_folder_id
      and wf.workspace_id = s.workspace_id
  );

alter table public.spaces
  add constraint spaces_workspace_folder_workspace_fkey
  foreign key (workspace_folder_id, workspace_id)
  references public.workspace_folders(id, workspace_id)
  on delete set null (workspace_folder_id)
  not valid;

alter table public.spaces
  validate constraint spaces_workspace_folder_workspace_fkey;

drop index if exists public.work_spaces_workspace_folder_idx;
create index if not exists work_spaces_workspace_folder_idx
  on public.spaces(workspace_folder_id, workspace_id)
  where workspace_folder_id is not null;

drop trigger if exists workspace_folders_set_updated_at
  on public.workspace_folders;
create trigger workspace_folders_set_updated_at
before update on public.workspace_folders
for each row execute function private.set_updated_at();

alter table public.workspace_folders enable row level security;
revoke all on public.workspace_folders from anon;
grant select, insert, update, delete on public.workspace_folders to authenticated;

drop policy if exists workspace_folders_select on public.workspace_folders;
create policy workspace_folders_select on public.workspace_folders
for select to authenticated using (private.is_workspace_member(workspace_id));

drop policy if exists workspace_folders_insert on public.workspace_folders;
create policy workspace_folders_insert on public.workspace_folders
for insert to authenticated with check (private.can_edit_workspace(workspace_id));

drop policy if exists workspace_folders_update on public.workspace_folders;
create policy workspace_folders_update on public.workspace_folders
for update to authenticated using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

drop policy if exists workspace_folders_delete on public.workspace_folders;
create policy workspace_folders_delete on public.workspace_folders
for delete to authenticated using (private.can_edit_workspace(workspace_id));

notify pgrst, 'reload schema';
