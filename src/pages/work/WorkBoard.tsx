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
import { WorkTaskEditModal } from '@/features/work/components/WorkTaskEditModal';
import { WorkTaskFilters } from '@/features/work/components/WorkTaskFilters';
import { useSession } from '@/hooks/useSession';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useUpdateTaskMutation,
  useWorkspaceTasksQuery,
  useWorkspaceTreeQuery,
  useDeleteTaskMutation,
  useCreateTaskMutation,
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
  const { session } = useSession();
  const user = session?.user;
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(selectedWorkspaceId);
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const createTask = useCreateTaskMutation();
  const [editingTask, setEditingTask] = useState<WorkTaskItem | null>(null);
  const tasks = tasksQuery.data ?? EMPTY_TASKS;
  const projects = useMemo(
    () => [
      ...(treeQuery.data?.spaces ?? []),
      ...(treeQuery.data?.workspace_folders?.flatMap((folder) => folder.spaces) ?? []),
    ],
    [treeQuery.data?.spaces, treeQuery.data?.workspace_folders],
  );
  const lists = useMemo(
    () => [
      ...(treeQuery.data?.workspace_folders?.flatMap((folder) => folder.lists) ?? []),
      ...(treeQuery.data?.spaces?.flatMap((space) => [
        ...space.lists,
        ...space.folders.flatMap((folder) => folder.lists),
      ]) ?? []),
      ...(treeQuery.data?.workspace_folders?.flatMap((folder) =>
        folder.spaces.flatMap((space) => [
          ...space.lists,
          ...space.folders.flatMap((nestedFolder) => nestedFolder.lists),
        ]),
      ) ?? []),
    ],
    [treeQuery.data?.spaces, treeQuery.data?.workspace_folders],
  );
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

  const handleDeleteTask = async (task: WorkTaskItem) => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Tarefa excluída');
    } catch (error) {
      toast.error('Erro ao excluir a tarefa');
      console.error(error);
    }
  };

  const handleArchiveTask = async (task: WorkTaskItem) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'Arquivado' } });
      toast.success('Tarefa arquivada');
    } catch {
      toast.error('Não foi possível arquivar a tarefa.');
    }
  };

  const handleCreateTask = async (title: string, status: string) => {
    const defaultList = lists[0];
    if (!defaultList) {
      toast.error('Crie uma lista primeiro para poder adicionar tarefas.');
      return;
    }
    try {
      await createTask.mutateAsync({
        title,
        list_id: defaultList.id,
        status,
        assignee_id: user?.id,
        creator_id: user?.id || '',
      });
      toast.success('Tarefa criada');
    } catch (error) {
      toast.error('Erro ao criar tarefa');
      console.error(error);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <MainLayout module="work" >
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha um workspace na barra lateral para abrir o quadro."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <MainLayout module="work" >
        <WorkLoadingState label="Montando o quadro…" />
      </MainLayout>
    );
  }

  if (treeQuery.error || tasksQuery.error) {
    return (
      <MainLayout module="work" >
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
    <MainLayout module="work" >
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
          projects={projects}
          lists={lists}
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
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            onCreateTask={(title, status) => void handleCreateTask(title, status)}
          />
        )}
      </div>

      <WorkTaskEditModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />
    </MainLayout>
  );
}
