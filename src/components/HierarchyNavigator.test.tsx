import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HierarchyNavigator from './HierarchyNavigator';

describe('HierarchyNavigator', () => {
  it('exibe listas canônicas dentro de uma pasta do workspace', () => {
    render(
      <HierarchyNavigator
        workspace={{
          id: 'workspace-1',
          name: 'Workspace principal',
          description: null,
          icon: null,
          color: null,
          owner: 'user-1',
          created_at: '2026-07-23T00:00:00.000Z',
          updated_at: '2026-07-23T00:00:00.000Z',
          spaces: [],
          workspace_folders: [
            {
              id: 'workspace-folder-1',
              workspace_id: 'workspace-1',
              name: 'Clientes ativos',
              description: null,
              icon: null,
              color: null,
              position: 0,
              created_at: '2026-07-23T00:00:00.000Z',
              updated_at: '2026-07-23T00:00:00.000Z',
              spaces: [],
              lists: [
                {
                  id: 'list-1',
                  workspace_id: 'workspace-1',
                  workspace_folder_id: 'workspace-folder-1',
                  space_id: null,
                  folder_id: null,
                  name: 'Entrega',
                  description: null,
                  icon: null,
                  color: null,
                  custom_statuses: null,
                  position: 0,
                  created_at: '2026-07-23T00:00:00.000Z',
                  updated_at: '2026-07-23T00:00:00.000Z',
                },
              ],
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /clientes ativos/i }));

    expect(screen.getByText('Entrega')).toBeInTheDocument();
  });
});
