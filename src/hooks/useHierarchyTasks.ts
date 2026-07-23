import { useQuery, useQueryClient } from '@tanstack/react-query';

import { normalizeWorkError } from '@/features/work/api/workApi';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useListTasksQuery,
  useUpdateTaskMutation,
} from '@/features/work/hooks/useWorkData';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type {
  CreateSubtaskData,
  CreateTaskData,
  Subtask,
  TaskFilters,
  TaskPriority,
  UpdateSubtaskData,
  UpdateTaskData,
} from '@/types/hierarchy';

const TASK_PRIORITIES: readonly TaskPriority[] = [
  'Baixa',
  'Média',
  'Alta',
  'Urgente',
];

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'userMessage' in error) {
    return new Error(String(error.userMessage));
  }
  return new Error('Não foi possível concluir a operação no Work Management.');
}

function mapPriority(value: string): TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : 'Média';
}

function mapSubtask(row: Tables<'subtasks'>): Subtask {
  return {
    ...row,
    priority: mapPriority(row.priority),
  };
}

export const useHierarchyTasks = (listId?: string, filters?: TaskFilters) => {
  const query = useListTasksQuery(listId, filters);
  const createMutation = useCreateTaskMutation(listId, filters);
  const updateMutation = useUpdateTaskMutation(listId, filters);
  const deleteMutation = useDeleteTaskMutation(listId, filters);

  const createTask = async (data: CreateTaskData) => {
    try {
      return { data: await createMutation.mutateAsync(data), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const updateTask = async (id: string, data: UpdateTaskData) => {
    try {
      return {
        data: await updateMutation.mutateAsync({ id, data }),
        error: null,
      };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: toError(error) };
    }
  };

  const reorderTasks = (taskId: string, newPosition: number) =>
    updateTask(taskId, { position: newPosition });

  return {
    tasks: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchTasks: query.refetch,
    refetch: query.refetch,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
};

function buildSubtaskTree(subtasks: Subtask[]): Subtask[] {
  const subtaskMap = new Map<string, Subtask>();
  const roots: Subtask[] = [];

  subtasks.forEach((subtask) => {
    subtaskMap.set(subtask.id, { ...subtask, children: [] });
  });

  subtasks.forEach((subtask) => {
    const node = subtaskMap.get(subtask.id);
    if (!node) return;

    const parent = subtask.parent_subtask_id
      ? subtaskMap.get(subtask.parent_subtask_id)
      : undefined;

    if (parent) {
      parent.children = [...(parent.children ?? []), node];
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export const useSubtasks = (taskId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['work', 'subtasks', taskId ?? 'none'] as const;
  const query = useQuery({
    queryKey,
    enabled: Boolean(taskId),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId as string)
        .order('position');

      if (error) throw normalizeWorkError(error);
      return (data ?? []).map(mapSubtask);
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey, exact: true });

  const createSubtask = async (data: CreateSubtaskData) => {
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert(data)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapSubtask(subtask), error: null };
  };

  const updateSubtask = async (id: string, data: UpdateSubtaskData) => {
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapSubtask(subtask), error: null };
  };

  const deleteSubtask = async (id: string) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', id);
    if (error) return { error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { error: null };
  };

  const subtasks = query.data ?? [];

  return {
    subtasks,
    subtaskTree: buildSubtaskTree(subtasks),
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchSubtasks: query.refetch,
    refetch: query.refetch,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    buildSubtaskTree,
  };
};

export const useInheritedStatuses = (_listId?: string) => ({
  statuses: ['Pendente', 'Em Progresso', 'Concluída'],
  loading: false,
});
