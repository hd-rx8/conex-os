import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const workHooks = vi.hoisted(() => ({
  useWorkspacesQuery: vi.fn(),
  useWorkspaceTreeQuery: vi.fn(),
  useListTasksQuery: vi.fn(),
  useCreateSpaceMutation: vi.fn(),
}));

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/features/work/hooks/useWorkData', () => workHooks);
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/HierarchyNavigator', () => ({
  default: ({ workspace }: { workspace: { name: string } }) => (
    <div>Árvore: {workspace.name}</div>
  ),
}));
vi.mock('@/components/modals/CreateWorkspaceModal', () => ({
  default: () => null,
}));
vi.mock('@/components/modals/CreateProjectModal', () => ({
  default: () => null,
}));
vi.mock('sonner', () => ({ toast }));

import WorkManagement from './WorkManagement';

const refetch = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <WorkManagement />
    </MemoryRouter>,
  );
}

function setDefaultHooks() {
  workHooks.useWorkspacesQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch,
  });
  workHooks.useWorkspaceTreeQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch,
  });
  workHooks.useListTasksQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  });
  workHooks.useCreateSpaceMutation.mockReturnValue({ mutateAsync: vi.fn() });
}

describe('WorkManagement states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultHooks();
  });

  it('renderiza o carregamento de workspaces', () => {
    workHooks.useWorkspacesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch,
    });

    renderPage();
    expect(screen.getByText('Carregando workspaces…')).toBeInTheDocument();
  });

  it('distingue uma coleção vazia', () => {
    renderPage();
    expect(screen.getByText('Nenhum workspace encontrado')).toBeInTheDocument();
  });

  it('renderiza falha com retry e não duplica o toast no rerender', () => {
    const error = {
      code: 'PGRST200',
      userMessage: 'Não foi possível carregar seus projetos',
    };
    workHooks.useWorkspacesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      refetch,
    });

    const view = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);

    view.rerender(
      <MemoryRouter>
        <WorkManagement />
      </MemoryRouter>,
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('renderiza a árvore do primeiro workspace', () => {
    workHooks.useWorkspacesQuery.mockReturnValue({
      data: [{ id: 'workspace-1', name: 'Workspace principal' }],
      isLoading: false,
      error: null,
      refetch,
    });
    workHooks.useWorkspaceTreeQuery.mockReturnValue({
      data: {
        id: 'workspace-1',
        name: 'Workspace principal',
        spaces: [],
      },
      isLoading: false,
      error: null,
      refetch,
    });

    renderPage();
    expect(screen.getByText('Árvore: Workspace principal')).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
