import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const workContext = vi.hoisted(() => ({
  selectedWorkspaceId: 'workspace-1',
  setSelectedWorkspaceId: vi.fn(),
}));

const queries = vi.hoisted(() => ({
  workspaces: {
    data: [{ id: 'workspace-1', name: 'Principal' }],
    isLoading: false,
    error: null,
  },
  tree: {
    data: {
      id: 'workspace-1',
      name: 'Principal',
      spaces: [
        {
          id: 'space-1',
          name: 'Website',
          status: 'Ativo',
          description: null,
          folders: [],
          lists: [],
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-22T00:00:00Z',
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
        title: 'Preparar proposta',
        status: 'Pendente',
        context: { space_id: 'space-1' },
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
  useWorkContext: () => workContext,
}));
vi.mock('@/features/work/hooks/useWorkData', () => ({
  useWorkspacesQuery: () => queries.workspaces,
  useWorkspaceTreeQuery: () => queries.tree,
  useWorkspaceTasksQuery: () => queries.tasks,
}));
vi.mock('@/features/work/components/WorkOverviewCharts', () => ({
  WorkOverviewCharts: () => <div data-testid="overview-charts" />,
}));

import WorkOverview from './WorkOverview';

describe('WorkOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders canonical project and task metrics', () => {
    render(
      <MemoryRouter>
        <WorkOverview />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByText('Total de projetos')).toBeInTheDocument();
    expect(screen.getByText('Tarefas pendentes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByTestId('overview-charts')).toBeInTheDocument();
  });
});
