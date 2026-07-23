import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260723223000_make_lists_workspace_canonical.sql',
  ),
  'utf8',
);

describe('lists workspace canonical migration', () => {
  it('preserva o vínculo legado opcional e torna workspace obrigatório', () => {
    expect(migration).toContain('alter column workspace_id set not null');
    expect(migration).toContain('alter column space_id drop not null');
  });

  it('substitui o acesso às listas por políticas baseadas no workspace', () => {
    expect(migration).toContain('private.can_access_workspace(workspace_id)');
    expect(migration).toContain('private.can_edit_workspace(workspace_id)');
    expect(migration).toContain('join public.workspace_members wm on wm.workspace_id = l.workspace_id');
  });
});
