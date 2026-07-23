import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { TaskBoardView } from '@/features/work/components/TaskBoardView';
import { TaskListView } from '@/features/work/components/TaskListView';
import { TaskTableView } from '@/features/work/components/TaskTableView';
import { WorkPageHeader } from '@/features/work/components/WorkPageHeader';
import {
  WorkEmptyState,
  WorkErrorState,
  WorkLoadingState,
} from '@/features/work/components/WorkStates';
import { WorkTaskFilters } from '@/features/work/components/WorkTaskFilters';
import { WorkViewSwitcher } from '@/features/work/components/WorkViewSwitcher';
import { useWorkContext } from '@/features/work/context/WorkContext';
import {
  useAssignedTasksQuery,
  useUpdateTaskMutation,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import { useWorkViewMode } from '@/features/work/hooks/useWorkViewMode';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import { useSession } from '@/hooks/useSession';
import type {
  TaskFilters,
  WorkTaskItem,
} from '@/types/hierarchy';

const METRIC_CARDS = [
  { key: 'pending', label: 'Pendentes', icon: Clock3, color: 'text-amber-600' },
  {
    key: 'inProgress',
    label: 'Em progresso',
    icon: PlayCircle,
    color: 'text-blue-600',
  },
  {
    key: 'completed',
    label: 'Concluídas',
    icon: CheckCircle2,
    color: 'text-emerald-600',
  },
  {
    key: 'overdue',
    label: 'Atrasadas',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
] as const;

const EMPTY_TASKS: readonly WorkTaskItem[] = [];

export default function WorkTasks() {
  const { user } = useSession();
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useAssignedTasksQuery(selectedWorkspaceId, user?.id);
  const updateTask = useUpdateTaskMutation();
  const { view, setView } = useWorkViewMode(
    'assigned',
    user?.id ?? 'anonymous',
  );
  const tasks = tasksQuery.data ?? EMPTY_TASKS;
  const metrics = deriveWorkTaskMetrics(tasks);
  const filteredTasks = useMemo(
    () => filterWorkTasks(tasks, filters),
    [filters, tasks],
  );

  const handleStatusChange = async (
    task: WorkTaskItem,
    status: string,
  ) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status } });
      toast.success('Status atualizado');
    } catch {
      toast.error('Não foi possível atualizar o status.');
    }
  };

  if (!user || !selectedWorkspaceId) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha um workspace na barra lateral para visualizar suas tarefas."
        />
      </MainLayout>
    );
  }

  if (tasksQuery.isLoading) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkLoadingState label="Carregando suas tarefas…" />
      </MainLayout>
    );
  }

  if (tasksQuery.error) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkErrorState onRetry={() => void tasksQuery.refetch()} />
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work" showGlobalFab={false}>
      <div className="space-y-6 pb-10">
        <WorkPageHeader
          eyebrow={treeQuery.data?.name ?? 'Work Management'}
          title="Minhas tarefas"
          description="Priorize o trabalho atribuído a você sem perder o contexto de projeto e lista."
          actions={<WorkViewSwitcher value={view} onChange={setView} />}
        />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {METRIC_CARDS.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.key}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <div>
                    <p className="text-xl font-semibold">{metrics[metric.key]}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <WorkTaskFilters
          value={filters}
          onChange={setFilters}
          projects={treeQuery.data?.spaces ?? []}
        />

        {tasks.length === 0 ? (
          <WorkEmptyState
            title="Nenhuma tarefa atribuída"
            description="As tarefas aparecerão aqui quando forem atribuídas a você."
          />
        ) : filteredTasks.length === 0 ? (
          <WorkEmptyState
            title="Nenhum resultado"
            description="Ajuste ou limpe os filtros para encontrar outras tarefas."
          />
        ) : view === 'table' ? (
          <TaskTableView tasks={filteredTasks} />
        ) : view === 'board' ? (
          <TaskBoardView
            tasks={filteredTasks}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
          />
        ) : (
          <TaskListView tasks={filteredTasks} />
        )}
      </div>
    </MainLayout>
  );
}
