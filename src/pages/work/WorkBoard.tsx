import { useMemo, useState } from 'react';
import { CheckCircle2, CircleDot, Layers3 } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import { MetricCard } from '@/components/layout/MetricCard';
import { TaskBoardView } from '@/features/work/components/TaskBoardView';
import { WorkPageHeader } from '@/features/work/components/WorkPageHeader';
import {
  WorkEmptyState,
  WorkErrorState,
  WorkLoadingState,
} from '@/features/work/components/WorkStates';
import { WorkTaskFilters } from '@/features/work/components/WorkTaskFilters';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useUpdateTaskMutation,
  useWorkspaceTasksQuery,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import type { TaskFilters, WorkTaskItem } from '@/types/hierarchy';

const EMPTY_TASKS: readonly WorkTaskItem[] = [];

export default function WorkBoard() {
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(selectedWorkspaceId);
  const updateTask = useUpdateTaskMutation();
  const tasks = tasksQuery.data ?? EMPTY_TASKS;
  const filteredTasks = useMemo(
    () => filterWorkTasks(tasks, filters),
    [filters, tasks],
  );
  const metrics = deriveWorkTaskMetrics(tasks);

  const handleStatusChange = async (
    task: WorkTaskItem,
    status: string,
  ) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status } });
      toast.success('Tarefa movida');
    } catch {
      toast.error('Não foi possível mover a tarefa.');
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha um workspace na barra lateral para abrir o quadro."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkLoadingState label="Montando o quadro…" />
      </MainLayout>
    );
  }

  if (treeQuery.error || tasksQuery.error) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkErrorState
          onRetry={() => {
            void treeQuery.refetch();
            void tasksQuery.refetch();
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work" showGlobalFab={false}>
      <div className="app-page">
        <WorkPageHeader
          eyebrow={treeQuery.data?.name ?? 'Work Management'}
          title="Quadro"
          description="Acompanhe o fluxo do workspace e mova tarefas entre os status."
        />

        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Tarefas no quadro"
            value={metrics.total}
            icon={Layers3}
            tone="primary"
          />
          <MetricCard
            label="Em progresso"
            value={metrics.inProgress}
            icon={CircleDot}
            tone="primary"
          />
          <MetricCard
            label="Concluídas"
            value={metrics.completed}
            icon={CheckCircle2}
            tone="success"
          />
        </section>

        <WorkTaskFilters
          value={filters}
          onChange={setFilters}
          projects={treeQuery.data?.spaces ?? []}
        />

        {tasks.length === 0 ? (
          <WorkEmptyState
            title="Quadro vazio"
            description="As tarefas do workspace aparecerão aqui organizadas por status."
          />
        ) : filteredTasks.length === 0 ? (
          <WorkEmptyState
            title="Nenhum resultado"
            description="Ajuste ou limpe os filtros para visualizar outras tarefas."
          />
        ) : (
          <TaskBoardView
            tasks={filteredTasks}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
          />
        )}
      </div>
    </MainLayout>
  );
}
