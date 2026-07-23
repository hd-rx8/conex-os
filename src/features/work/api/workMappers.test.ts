import { describe, expect, it } from 'vitest';

import { normalizeWorkError } from './workApi';
import { mapWorkspaceTreeRow, type WorkspaceTreeRow } from './workMappers';

const workspaceRow: WorkspaceTreeRow = {
  id: 'workspace-1',
  name: 'Workspace principal',
  description: null,
  icon: null,
  color: null,
  owner: 'user-1',
  created_at: '2026-07-22T12:00:00Z',
  updated_at: '2026-07-22T12:00:00Z',
  spaces: [
    {
      id: 'space-1',
      workspace_id: 'workspace-1',
      name: 'Projeto migrado',
      description: null,
      status: 'Ativo',
      icon: null,
      color: null,
      custom_statuses: [],
      position: 0,
      created_at: '2026-07-22T12:00:00Z',
      updated_at: '2026-07-22T12:00:00Z',
      folders: [
        {
          id: 'folder-1',
          space_id: 'space-1',
          name: 'Entrega',
          description: null,
          icon: null,
          color: null,
          custom_statuses: null,
          position: 0,
          created_at: '2026-07-22T12:00:00Z',
          updated_at: '2026-07-22T12:00:00Z',
        },
      ],
      lists: [
        {
          id: 'list-folder',
          space_id: 'space-1',
          folder_id: 'folder-1',
          name: 'Com pasta',
          description: null,
          icon: null,
          color: null,
          custom_statuses: null,
          position: 0,
          created_at: '2026-07-22T12:00:00Z',
          updated_at: '2026-07-22T12:00:00Z',
        },
        {
          id: 'list-direct',
          space_id: 'space-1',
          folder_id: null,
          name: 'Direta',
          description: null,
          icon: null,
          color: null,
          custom_statuses: null,
          position: 1,
          created_at: '2026-07-22T12:00:00Z',
          updated_at: '2026-07-22T12:00:00Z',
        },
      ],
    },
  ],
};

describe('mapWorkspaceTreeRow', () => {
  it('separa listas diretas das listas pertencentes a pastas', () => {
    const tree = mapWorkspaceTreeRow(workspaceRow);

    expect(tree.spaces[0].lists.map((list) => list.id)).toEqual(['list-direct']);
    expect(tree.spaces[0].folders[0].lists.map((list) => list.id)).toEqual([
      'list-folder',
    ]);
  });
});

describe('normalizeWorkError', () => {
  it('preserva os metadados técnicos e fornece uma mensagem segura', () => {
    const error = normalizeWorkError({
      code: 'PGRST200',
      message: 'relationship not found',
      details: 'lists -> spaces',
      hint: 'reload schema',
    });

    expect(error).toEqual({
      code: 'PGRST200',
      message: 'relationship not found',
      details: 'lists -> spaces',
      hint: 'reload schema',
      userMessage: 'Não foi possível carregar os dados do Work Management.',
    });
  });

  it('normaliza valores desconhecidos sem vazar detalhes para a interface', () => {
    expect(normalizeWorkError('falha')).toEqual({
      code: 'WORK_UNKNOWN',
      message: 'Unknown Work data error',
      details: null,
      hint: null,
      userMessage: 'Não foi possível carregar os dados do Work Management.',
    });
  });
});
