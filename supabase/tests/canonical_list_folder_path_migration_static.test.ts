import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260723211857_add_canonical_list_folder_path.sql',
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

describe('canonical list folder path migration contract', () => {
  it('adds canonical workspace and folder references to lists without removing legacy paths', () => {
    expect(normalizedSql).toContain(
      'add column if not exists workspace_id uuid',
    );
    expect(normalizedSql).toContain(
      'add column if not exists workspace_folder_id uuid',
    );
    expect(normalizedSql).toContain('foreign key (workspace_id) references public.workspaces(id)');
    expect(normalizedSql).toContain(
      'foreign key (workspace_folder_id, workspace_id) references public.workspace_folders(id, workspace_id)',
    );
    expect(normalizedSql).not.toMatch(/drop\s+table|truncate\s+table|delete\s+from/);
  });

  it('backfills the new path from existing spaces before validating constraints', () => {
    expect(normalizedSql).toContain('update public.lists as l');
    expect(normalizedSql).toContain('from public.spaces as s');
    expect(normalizedSql).toContain('l.space_id = s.id');
    expect(normalizedSql).toContain('validate constraint lists_workspace_id_fkey');
    expect(normalizedSql).toContain(
      'validate constraint lists_workspace_folder_workspace_fkey',
    );
  });

  it('indexes the canonical hierarchy and leaves RLS policies untouched', () => {
    expect(normalizedSql).toContain(
      'create index if not exists work_lists_workspace_folder_position_idx',
    );
    expect(normalizedSql).not.toMatch(/create\s+policy|drop\s+policy|disable\s+row\s+level\s+security/);
  });

  it('keeps the generated list types aligned with the canonical path', () => {
    expect(generatedTypes).toContain('workspace_folder_id: string | null');
    expect(generatedTypes).toContain('workspace_id: string | null');
    expect(generatedTypes).toContain(
      'foreignKeyName: "lists_workspace_folder_workspace_fkey"',
    );
    expect(generatedTypes).toContain('foreignKeyName: "lists_workspace_id_fkey"');
  });
});
