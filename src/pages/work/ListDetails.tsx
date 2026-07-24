import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDot, Rows3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
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
import { WorkTaskEditModal } from '@/features/work/components/WorkTaskEditModal';
import { WorkViewSwitcher } from '@/features/work/components/WorkViewSwitcher';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useListTasksQuery,
  useUpdateTaskMutation,
  useWorkspaceTreeQuery,
  useWorkspacesQuery,
} from '@/features/work/hooks/useWorkData';
import { useWorkViewMode } from '@/features/work/hooks/useWorkViewMode';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import { useSession } from '@/hooks/useSession';
import type { ListTree, TaskFilters, WorkTaskItem } from '@/types/hierarchy';

interface ListContext {
  list: ListTree;
  projectId?: string;
  projectName?: string;
  folderName?: string;
  workspaceFolderName?: string;
}

const EMPTY_TASKS: readonly WorkTaskItem[] = [];

export default function ListDetails() {
  const { listId } = useParams<{ listId: string }>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTaskItem | null>(null);
  const navigate = useNavigate();
  const { user } = useSession();
  const { selectedWorkspaceId } = useWorkContext();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useListTasksQuery(listId);
  const createTask = useCreateTaskMutation(listId);
  const updateTask = useUpdateTaskMutation(listId);
  const deleteTask = useDeleteTaskMutation(listId);
  const { view, setView } = useWorkViewMode('list', listId ?? 'none');
  const listContext = useMemo<ListContext | undefined>(() => {
    if (!treeQuery.data) return undefined;

    // A hierarquia atual é limpa: Workspace > Projects (Spaces) > Folders > Lists
    for (const project of treeQuery.data.spaces) {
      const directList = project.lists.find((list) => list.id === listId);
      if (directList) {
        return {
          list: directList,
          projectId: project.id,
          projectName: project.name,
        };
      }

      for (const folder of project.folders) {
        const nestedList = folder.lists.find((list) => list.id === listId);
        if (nestedList) {
          return {
            list: nestedList,
            projectId: project.id,
            projectName: project.name,
            folderName: folder.name,
          };
        }
      }
    }
    return undefined;
  }, [listId, treeQuery.data]);
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
      toast.success('Status atualizado');
    } catch {
      toast.error('Não foi possível atualizar o status.');
    }
  };

  const handleCreateTask = async (title: string, spaceId: string, _listId: string, status: string) => {
    try {
      await createTask.mutateAsync({
        title,
        list_id: listId!,
        status,
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

  if (!selectedWorkspaceId) {
    return (
      <MainLayout module="work" >
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha o workspace que contém esta lista."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <MainLayout module="work" >
        <WorkLoadingState label="Carregando lista…" />
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

  if (!listContext) {
    return (
      <MainLayout module="work" >
        <WorkEmptyState
          title="Lista não encontrada"
          description="A lista pode ter sido movida ou não pertencer ao workspace selecionado."
          action={
            <Button variant="outline" onClick={() => navigate('/work')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à visão geral
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const { list, projectId, projectName, folderName } = listContext;
  const path = [treeQuery.data?.name ?? 'Workspace', projectName, folderName].filter(Boolean).join(' / ');

  return (
    <MainLayout module="work" >
      <div className="space-y-6 pb-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(projectId ? `/work/project/${projectId}` : '/work')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {projectName ?? 'Visão geral'}
        </Button>

        <WorkPageHeader
          eyebrow={path}
          title={list.name}
          description={
            list.description ??
            'Acompanhe e organize as tarefas desta lista na visualização que preferir.'
          }
          actions={<WorkViewSwitcher value={view} onChange={setView} />}
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total de tarefas', value: metrics.total, icon: Rows3, color: 'text-primary' },
            { label: 'Pendentes', value: metrics.pending, icon: CircleDot, color: 'text-amber-600' },
            { label: 'Em progresso', value: metrics.inProgress, icon: CircleDot, color: 'text-blue-600' },
            { label: 'Concluídas', value: metrics.completed, icon: CheckCircle2, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <WorkTaskFilters value={filters} onChange={setFilters} />

        {filteredTasks.length === 0 && tasks.length > 0 ? (
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
            onCreateTask={(title, spaceId, _listId, status) => 
              void handleCreateTask(title, spaceId, _listId, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            emptyListContext={
              tasks.length === 0 ? {
                listId: list.id,
                listName: list.name,
                spaceId: list.space_id,
                spaceName: projectName ?? 'Projeto',
              } : undefined
            }
          />
        ) : view === 'board' ? (
          <TaskBoardView
            tasks={filteredTasks}
            onStatusChange={(task, status) =>
              void handleStatusChange(task, status)
            }
            onTaskClick={(task) => setEditingTask(task)}
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            onCreateTask={(title, status) => {
              void handleCreateTask(title, list.space_id, list.id, status);
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
              void handleCreateTask(title, list.space_id, list.id, 'Pendente');
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
