import type { TaskFilters } from '@/types/hierarchy';

export const workQueryKeys = {
  all: ['work'] as const,
  workspaces: ['work', 'workspaces'] as const,
  tree: (workspaceId: string) => ['work', 'tree', workspaceId] as const,
  tasks: (listId: string, filters?: TaskFilters) =>
    ['work', 'tasks', listId, filters ?? {}] as const,
};
