import { useMemo, useState } from 'react';
import { CheckCircle2, CircleDot, Layers3 } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-6 pb-10">
        <WorkPageHeader
          eyebrow={treeQuery.data?.name ?? 'Work Management'}
          title="Quadro"
          description="Acompanhe o fluxo do workspace e mova tarefas entre os status."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-semibold">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Tarefas no quadro</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CircleDot className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-semibold">{metrics.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em progresso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xl font-semibold">{metrics.completed}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
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
