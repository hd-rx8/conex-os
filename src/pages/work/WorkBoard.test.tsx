import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  tree: {
    data: {
      id: 'workspace-1',
      name: 'Principal',
      spaces: [{ id: 'space-1', name: 'Website', folders: [], lists: [] }],
    },
    isLoading: false,
    error: null,
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
  useUpdateTaskMutation: () => ({ mutateAsync: vi.fn() }),
}));

import WorkBoard from './WorkBoard';

describe('WorkBoard', () => {
  it('renders the workspace board with project filtering', () => {
    render(
      <MemoryRouter>
        <WorkBoard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Quadro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Projeto')).toBeInTheDocument();
    expect(screen.getByTestId('work-board-view')).toBeInTheDocument();
    expect(screen.getByText('Preparar proposta')).toBeInTheDocument();
  });
});
