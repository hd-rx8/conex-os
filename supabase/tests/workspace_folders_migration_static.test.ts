import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260723141500_create_workspace_folders.sql',
  ),
  'utf8',
);
const generatedTypes = readFileSync(
  resolve(process.cwd(), 'src/integrations/supabase/types.ts'),
  'utf8',
);

const normalizedSql = migrationSql
  .replace(/--.*$/gm, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

describe('workspace folders migration contract', () => {
  it('keeps generated relationship metadata aligned with the composite foreign key', () => {
    expect(generatedTypes).toContain(
      'foreignKeyName: "spaces_workspace_folder_workspace_fkey"',
    );
    expect(generatedTypes).toContain(
      'columns: ["workspace_folder_id", "workspace_id"]',
    );
    expect(generatedTypes).toContain(
      'referencedColumns: ["id", "workspace_id"]',
    );
    expect(generatedTypes).not.toContain(
      'foreignKeyName: "spaces_workspace_folder_id_fkey"',
    );
  });

  it('binds a space folder to the same workspace with a composite foreign key', () => {
    expect(normalizedSql).toContain(
      'constraint workspace_folders_id_workspace_key unique (id, workspace_id)',
    );
    expect(normalizedSql).toContain(
      'alter table public.workspace_folders add constraint workspace_folders_id_workspace_key unique (id, workspace_id)',
    );
    expect(normalizedSql).toContain(
      'constraint spaces_workspace_folder_workspace_fkey foreign key (workspace_folder_id, workspace_id) references public.workspace_folders(id, workspace_id)',
    );
    expect(normalizedSql).toContain(
      'on delete set null (workspace_folder_id)',
    );
    expect(normalizedSql).not.toContain(
      'workspace_folder_id uuid references public.workspace_folders(id)',
    );
    expect(normalizedSql).toContain(
      'drop constraint if exists spaces_workspace_folder_id_fkey',
    );
    expect(normalizedSql).toContain(
      'drop constraint if exists spaces_workspace_folder_workspace_fkey',
    );
    expect(normalizedSql).toContain(
      'validate constraint spaces_workspace_folder_workspace_fkey',
    );
  });

  it('keeps valid existing assignments and clears only invalid folder references', () => {
    expect(normalizedSql).toContain(
      'update public.spaces as s set workspace_folder_id = null where s.workspace_folder_id is not null and not exists ( select 1 from public.workspace_folders as wf where wf.id = s.workspace_folder_id and wf.workspace_id = s.workspace_id );',
    );
  });

  it('is safe to rerun without widening the existing RLS rules', () => {
    expect(normalizedSql).toContain(
      'create table if not exists public.workspace_folders',
    );
    expect(normalizedSql).toContain(
      'add column if not exists workspace_folder_id uuid',
    );
    expect(normalizedSql).toContain(
      'create index if not exists work_workspace_folders_workspace_position_idx',
    );
    expect(normalizedSql).toContain(
      'drop index if exists public.work_spaces_workspace_folder_idx',
    );
    expect(normalizedSql).toContain(
      'create index if not exists work_spaces_workspace_folder_idx on public.spaces(workspace_folder_id, workspace_id)',
    );
    expect(normalizedSql).toContain(
      'drop trigger if exists workspace_folders_set_updated_at on public.workspace_folders',
    );
    expect(normalizedSql).toContain(
      'drop policy if exists workspace_folders_select on public.workspace_folders',
    );
    expect(normalizedSql).toContain(
      'for select to authenticated using (private.is_workspace_member(workspace_id))',
    );
    expect(normalizedSql).toContain(
      'for insert to authenticated with check (private.can_edit_workspace(workspace_id))',
    );
    expect(normalizedSql).toContain(
      'for update to authenticated using (private.can_edit_workspace(workspace_id)) with check (private.can_edit_workspace(workspace_id))',
    );
    expect(normalizedSql).toContain(
      'for delete to authenticated using (private.can_edit_workspace(workspace_id))',
    );
  });
});
