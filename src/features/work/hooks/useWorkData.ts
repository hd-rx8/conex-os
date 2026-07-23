import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CreateSpaceData,
  CreateTaskData,
  CreateWorkspaceData,
  TaskFilters,
  UpdateSpaceData,
  UpdateTaskData,
  UpdateWorkspaceData,
} from '@/types/hierarchy';

import {
  createSpace,
  createTask,
  createWorkspace,
  deleteSpace,
  deleteTask,
  deleteWorkspace,
  fetchTasksByList,
  fetchWorkspaces,
  fetchWorkspaceTree,
  updateSpace,
  updateTask,
  updateWorkspace,
} from '../api/workApi';
import { workQueryKeys } from '../api/workQueryKeys';

const WORK_STALE_TIME = 30_000;

export function useWorkspacesQuery(enabled = true) {
  return useQuery({
    queryKey: workQueryKeys.workspaces,
    queryFn: fetchWorkspaces,
    enabled,
    staleTime: WORK_STALE_TIME,
    retry: 1,
    retryDelay: 0,
  });
}

export function useWorkspaceTreeQuery(workspaceId?: string) {
  return useQuery({
    queryKey: workQueryKeys.tree(workspaceId ?? 'none'),
    queryFn: () => fetchWorkspaceTree(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: WORK_STALE_TIME,
    retry: 1,
    retryDelay: 0,
  });
}

export function useListTasksQuery(listId?: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: workQueryKeys.tasks(listId ?? 'none', filters),
    queryFn: () => fetchTasksByList(listId as string, filters),
    enabled: Boolean(listId),
    staleTime: WORK_STALE_TIME,
    retry: 1,
    retryDelay: 0,
  });
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceData }) =>
      updateWorkspace(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: workQueryKeys.workspaces,
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: workQueryKeys.tree(id),
        exact: true,
      });
    },
  });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => createWorkspace(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workQueryKeys.workspaces,
        exact: true,
      });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: workQueryKeys.tree(id), exact: true });
      void queryClient.invalidateQueries({
        queryKey: workQueryKeys.workspaces,
        exact: true,
      });
    },
  });
}

function useInvalidateWorkspaceTree() {
  const queryClient = useQueryClient();
  return (workspaceId: string) =>
    queryClient.invalidateQueries({
      queryKey: workQueryKeys.tree(workspaceId),
      exact: true,
    });
}

export function useCreateSpaceMutation() {
  const invalidateTree = useInvalidateWorkspaceTree();
  return useMutation({
    mutationFn: (data: CreateSpaceData) => createSpace(data),
    onSuccess: (_, data) => void invalidateTree(data.workspace_id),
  });
}

export function useUpdateSpaceMutation(workspaceId?: string) {
  const invalidateTree = useInvalidateWorkspaceTree();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceData }) =>
      updateSpace(id, data),
    onSuccess: () => {
      if (workspaceId) void invalidateTree(workspaceId);
    },
  });
}

export function useDeleteSpaceMutation(workspaceId?: string) {
  const invalidateTree = useInvalidateWorkspaceTree();
  return useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: () => {
      if (workspaceId) void invalidateTree(workspaceId);
    },
  });
}

export function useCreateTaskMutation(listId?: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskData) => createTask(data),
    onSuccess: (_, data) => {
      void queryClient.invalidateQueries({
        queryKey: workQueryKeys.tasks(listId ?? data.list_id, filters),
        exact: true,
      });
    },
  });
}

export function useUpdateTaskMutation(listId?: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      updateTask(id, data),
    onSuccess: () => {
      if (listId) {
        void queryClient.invalidateQueries({
          queryKey: workQueryKeys.tasks(listId, filters),
          exact: true,
        });
      }
    },
  });
}

export function useDeleteTaskMutation(listId?: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      if (listId) {
        void queryClient.invalidateQueries({
          queryKey: workQueryKeys.tasks(listId, filters),
          exact: true,
        });
      }
    },
  });
}
