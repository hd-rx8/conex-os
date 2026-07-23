import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  tree: {
    data: {
      id: 'workspace-1',
      name: 'Principal',
      spaces: [
        {
          id: 'space-1',
          workspace_id: 'workspace-1',
          name: 'Website',
          description: 'Novo site institucional',
          status: 'Ativo',
          icon: null,
          color: null,
          custom_statuses: [],
          position: 0,
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-22T00:00:00Z',
          folders: [],
          lists: [
            {
              id: 'list-1',
              space_id: 'space-1',
              folder_id: null,
              name: 'Comercial',
              description: 'Demandas comerciais',
              icon: null,
              color: null,
              custom_statuses: null,
              position: 0,
              created_at: '2026-07-01T00:00:00Z',
              updated_at: '2026-07-22T00:00:00Z',
            },
          ],
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  },
  tasks: {
    data: [
      {
        id: 'task-1',
        list_id: 'list-1',
        title: 'Preparar proposta',
        description: null,
        status: 'Pendente',
        priority: 'Alta',
        due_date: null,
        assignee_id: null,
        creator_id: 'user-1',
        tags: [],
        estimated_hours: null,
        actual_hours: null,
        position: 0,
        created_at: '2026-07-01T12:00:00Z',
        updated_at: '2026-07-01T12:00:00Z',
        completed_at: null,
        context: {
          workspace_id: 'workspace-1',
          space_id: 'space-1',
          space_name: 'Website',
          list_id: 'list-1',
          list_name: 'Comercial',
        },
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  },
}));

vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/features/work/context/workContextState', () => ({
  useWorkContext: () => ({ selectedWorkspaceId: 'workspace-1' }),
}));
vi.mock('@/features/work/hooks/useWorkData', () => ({
  useWorkspaceTreeQuery: () => queries.tree,
  useWorkspaceTasksQuery: () => queries.tasks,
  useListTasksQuery: () => queries.tasks,
  useUpdateTaskMutation: () => ({ mutateAsync: vi.fn() }),
}));

import ListDetails from './ListDetails';
import ProjectDetails from './ProjectDetails';

describe('contextual work views', () => {
  it('renders a project in the requested Kanban view', () => {
    render(
      <MemoryRouter initialEntries={['/work/project/space-1?view=board']}>
        <Routes>
          <Route path="/work/project/:projectId" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Website' })).toBeInTheDocument();
    expect(screen.getByTestId('work-board-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kanban' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders a list in the requested table view', () => {
    render(
      <MemoryRouter initialEntries={['/work/list/list-1?view=table']}>
        <Routes>
          <Route path="/work/list/:listId" element={<ListDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Comercial' })).toBeInTheDocument();
    expect(screen.getByTestId('work-table-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
