import type { TaskFilters } from '@/types/hierarchy';

export const workQueryKeys = {
  all: ['work'] as const,
  workspaces: ['work', 'workspaces'] as const,
  tree: (workspaceId: string) => ['work', 'tree', workspaceId] as const,
  tasks: (listId: string, filters?: TaskFilters) =>
    ['work', 'tasks', listId, filters ?? {}] as const,
  workspaceTasks: (workspaceId: string, filters?: TaskFilters) =>
    ['work', 'tasks', 'workspace', workspaceId, filters ?? {}] as const,
  assignedTasks: (
    workspaceId: string,
    assigneeId: string,
    filters?: TaskFilters,
  ) =>
    [
      'work',
      'tasks',
      'assigned',
      workspaceId,
      assigneeId,
      filters ?? {},
    ] as const,
};
