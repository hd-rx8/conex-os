import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  fetchWorkspaces: vi.fn(),
  fetchWorkspaceTree: vi.fn(),
  fetchTasksByList: vi.fn(),
  updateWorkspace: vi.fn(),
}));

vi.mock('../api/workApi', () => api);

import { workQueryKeys } from '../api/workQueryKeys';
import {
  useListTasksQuery,
  useUpdateWorkspaceMutation,
  useWorkspaceTreeQuery,
} from './useWorkData';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

describe('canonical Work queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não consulta tarefas sem uma lista selecionada', () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useListTasksQuery(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.fetchTasksByList).not.toHaveBeenCalled();
  });

  it('compartilha uma única requisição da árvore entre dois consumidores', async () => {
    const queryClient = createQueryClient();
    api.fetchWorkspaceTree.mockResolvedValue({ id: 'workspace-1', spaces: [] });

    const { result } = renderHook(
      () => ({
        first: useWorkspaceTreeQuery('workspace-1'),
        second: useWorkspaceTreeQuery('workspace-1'),
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.first.isSuccess).toBe(true));
    expect(result.current.second.isSuccess).toBe(true);
    expect(api.fetchWorkspaceTree).toHaveBeenCalledTimes(1);
  });

  it('repete uma consulta com falha somente uma vez', async () => {
    const queryClient = createQueryClient();
    api.fetchWorkspaceTree
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({ id: 'workspace-1', spaces: [] });

    const { result } = renderHook(() => useWorkspaceTreeQuery('workspace-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchWorkspaceTree).toHaveBeenCalledTimes(2);
  });

  it('invalida somente a coleção e a árvore do workspace alterado', async () => {
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    api.updateWorkspace.mockResolvedValue({ id: 'workspace-1' });

    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'workspace-1',
        data: { name: 'Novo nome' },
      });
    });

    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenNthCalledWith(1, {
      queryKey: workQueryKeys.workspaces,
      exact: true,
    });
    expect(invalidate).toHaveBeenNthCalledWith(2, {
      queryKey: workQueryKeys.tree('workspace-1'),
      exact: true,
    });
  });
});
