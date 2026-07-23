import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => ({
  data: [
    {
      id: 'task-1',
      list_id: 'list-1',
      title: 'Preparar proposta',
      description: null,
      status: 'Pendente',
      priority: 'Alta',
      due_date: '2026-07-20T12:00:00Z',
      assignee_id: 'user-1',
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
}));

vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/features/work/context/workContextState', () => ({
  useWorkContext: () => ({ selectedWorkspaceId: 'workspace-1' }),
}));
vi.mock('@/features/work/hooks/useWorkData', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/work/hooks/useWorkData')
  >('@/features/work/hooks/useWorkData');
  return {
    ...actual,
    useAssignedTasksQuery: () => query,
    useWorkspaceTreeQuery: () => ({
      data: {
        name: 'Principal',
        spaces: [],
        workspace_folders: [
          {
            id: 'workspace-folder-1',
            name: 'Clientes ativos',
            lists: [],
            spaces: [{ id: 'space-1', name: 'Website', folders: [], lists: [] }],
          },
        ],
      },
    }),
    useUpdateTaskMutation: () => ({ mutateAsync: vi.fn() }),
  };
});

import WorkTasks from './WorkTasks';

describe('WorkTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders assigned metrics and the persisted view controls', () => {
    render(
      <MemoryRouter initialEntries={['/work/tasks']}>
        <WorkTasks />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Atrasadas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument();
    expect(screen.getByLabelText('Projeto')).toBeInTheDocument();
    expect(screen.getByText('Preparar proposta')).toBeInTheDocument();
  });
});
