import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import { MetricCard } from '@/components/layout/MetricCard';
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
import { WorkTaskEditModal } from '@/features/work/components/WorkTaskEditModal';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useAssignedTasksQuery,
  useUpdateTaskMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
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
  { key: 'pending', label: 'Pendentes', icon: Clock3, tone: 'warning' },
  {
    key: 'inProgress',
    label: 'Em progresso',
    icon: PlayCircle,
    tone: 'primary',
  },
  {
    key: 'completed',
    label: 'Concluídas',
    icon: CheckCircle2,
    tone: 'success',
  },
  {
    key: 'overdue',
    label: 'Atrasadas',
    icon: AlertTriangle,
    tone: 'danger',
  },
] as const;

const EMPTY_TASKS: readonly WorkTaskItem[] = [];

export default function WorkTasks() {
  const { user } = useSession();
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [editingTask, setEditingTask] = useState<WorkTaskItem | null>(null);
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useAssignedTasksQuery(selectedWorkspaceId, user?.id);
  const createTask = useCreateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const { view, setView } = useWorkViewMode(
    'assigned',
    user?.id ?? 'anonymous',
  );
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

  const handleCreateTask = async (title: string, spaceId: string, listId: string, status: string) => {
    try {
      await createTask.mutateAsync({
        title,
        list_id: listId,
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

  if (!user || !selectedWorkspaceId) {
    return (
      <MainLayout module="work" >
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha um workspace na barra lateral para visualizar suas tarefas."
        />
      </MainLayout>
    );
  }

  if (tasksQuery.isLoading) {
    return (
      <MainLayout module="work" >
        <WorkLoadingState label="Carregando suas tarefas…" />
      </MainLayout>
    );
  }

  if (tasksQuery.error) {
    return (
      <MainLayout module="work" >
        <WorkErrorState onRetry={() => void tasksQuery.refetch()} />
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work" >
      <div className="app-page">
        <WorkPageHeader
          eyebrow={treeQuery.data?.name ?? 'Work Management'}
          title="Minhas tarefas"
          description="Priorize o trabalho atribuído a você sem perder o contexto de projeto e lista."
          actions={<WorkViewSwitcher value={view} onChange={setView} />}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_CARDS.map((metric) => {
            const Icon = metric.icon;
            return (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metrics[metric.key]}
                icon={Icon}
                tone={metric.tone}
              />
            );
          })}
        </section>

        <WorkTaskFilters
          value={filters}
          onChange={setFilters}
          projects={projects}
          lists={lists}
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
          <TaskTableView
            tasks={filteredTasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            onCreateTask={(title, spaceId, listId, status) => 
              void handleCreateTask(title, spaceId, listId, status)
            }
          />
        ) : view === 'board' ? (
          <TaskBoardView
            tasks={filteredTasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            onCreateTask={(title, status) => {
              const firstProject = projects[0];
              const listId = lists.find(l => l.space_id === firstProject?.id)?.id;
              if (listId && firstProject) {
                void handleCreateTask(title, firstProject.id, listId, status);
              } else {
                toast.error("É necessário ter pelo menos um projeto e lista para criar tarefas.");
              }
            }}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            onCreateTask={(title) => {
              const firstProject = projects[0];
              const listId = lists.find(l => l.space_id === firstProject?.id)?.id;
              if (listId && firstProject) {
                void handleCreateTask(title, firstProject.id, listId, 'Pendente');
              } else {
                toast.error("É necessário ter pelo menos um projeto e lista para criar tarefas.");
              }
            }}
          />
        )}
      </div>

      <WorkTaskEditModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
    </MainLayout>
  );
}
