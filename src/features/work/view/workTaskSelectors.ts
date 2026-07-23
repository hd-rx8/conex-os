import type {
  TaskFilters,
  WorkTaskItem,
} from '@/types/hierarchy';

export interface WorkTaskMetrics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

function includesSearch(task: WorkTaskItem, search: string): boolean {
  const normalized = search.trim().toLocaleLowerCase('pt-BR');
  if (!normalized) return true;

  return [
    task.title,
    task.description,
    task.context.space_name,
    task.context.list_name,
  ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalized));
}

export function filterWorkTasks(
  tasks: readonly WorkTaskItem[],
  filters: TaskFilters = {},
): WorkTaskItem[] {
  return tasks.filter((task) => {
    if (filters.search && !includesSearch(task, filters.search)) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee_id && task.assignee_id !== filters.assignee_id) {
      return false;
    }
    if (filters.workspace_id && task.context.workspace_id !== filters.workspace_id) {
      return false;
    }
    if (filters.space_id && task.context.space_id !== filters.space_id) {
      return false;
    }
    if (filters.list_id && task.context.list_id !== filters.list_id) {
      return false;
    }
    if (
      filters.due_date_from &&
      (!task.due_date || task.due_date < filters.due_date_from)
    ) {
      return false;
    }
    if (
      filters.due_date_to &&
      (!task.due_date || task.due_date > filters.due_date_to)
    ) {
      return false;
    }
    if (
      filters.tags?.length &&
      !filters.tags.every((tag) => task.tags?.includes(tag))
    ) {
      return false;
    }
    return true;
  });
}

export function deriveWorkTaskMetrics(
  tasks: readonly WorkTaskItem[],
  now = new Date(),
): WorkTaskMetrics {
  const nowValue = now.getTime();

  return tasks.reduce<WorkTaskMetrics>(
    (metrics, task) => {
      metrics.total += 1;
      if (task.status === 'Pendente') metrics.pending += 1;
      if (task.status === 'Em Progresso') metrics.inProgress += 1;
      if (task.status === 'Concluída') metrics.completed += 1;
      if (
        task.status !== 'Concluída' &&
        task.due_date &&
        new Date(task.due_date).getTime() < nowValue
      ) {
        metrics.overdue += 1;
      }
      return metrics;
    },
    {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    },
  );
}
