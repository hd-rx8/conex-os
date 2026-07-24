import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDot, ListChecks, Rows3, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import CreateListModal from '@/components/modals/CreateListModal';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TaskBoardView } from '@/features/work/components/TaskBoardView';
import { TaskListView } from '@/features/work/components/TaskListView';
import { TaskTableView } from '@/features/work/components/TaskTableView';
import { WorkPageHeader } from '@/features/work/components/WorkPageHeader';
import {
  WorkEmptyState,
  WorkErrorState,
  WorkLoadingState,
} from '@/features/work/components/WorkStates';
import { WorkTaskEditModal } from '@/features/work/components/WorkTaskEditModal';
import { WorkTaskFilters } from '@/features/work/components/WorkTaskFilters';
import { WorkViewSwitcher } from '@/features/work/components/WorkViewSwitcher';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
  useWorkspaceTasksQuery,
  useWorkspaceTreeQuery,
  useWorkspacesQuery,
} from '@/features/work/hooks/useWorkData';
import { useWorkViewMode } from '@/features/work/hooks/useWorkViewMode';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import { useLists } from '@/hooks/useLists';
import { useSession } from '@/hooks/useSession';
import type { TaskFilters, WorkTaskItem } from '@/types/hierarchy';

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(selectedWorkspaceId);
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const { view, setView } = useWorkViewMode('project', projectId ?? 'none');
  const { createList } = useLists(projectId);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTaskItem | null>(null);
  
  const { project, folderName } = useMemo(() => {
    if (!treeQuery.data) return { project: undefined, folderName: undefined };
    const rootSpace = treeQuery.data.spaces.find((space) => space.id === projectId);
    if (rootSpace) return { project: rootSpace, folderName: undefined };
    for (const folder of treeQuery.data.workspace_folders || []) {
      const folderSpace = folder.spaces.find((space) => space.id === projectId);
      if (folderSpace) return { project: folderSpace, folderName: folder.name };
    }
    return { project: undefined, folderName: undefined };
  }, [treeQuery.data, projectId]);
  const projectTasks = useMemo(
    () =>
      (tasksQuery.data ?? []).filter(
        (task) => task.context.space_id === projectId,
      ),
    [projectId, tasksQuery.data],
  );
  const filteredTasks = useMemo(
    () => filterWorkTasks(projectTasks, filters),
    [filters, projectTasks],
  );
  const metrics = deriveWorkTaskMetrics(projectTasks);
  const progress =
    metrics.total === 0 ? 0 : Math.round((metrics.completed / metrics.total) * 100);
  const projectLists = useMemo(
    () =>
      project
        ? [
            ...project.lists,
            ...project.folders.flatMap((folder) => folder.lists),
          ]
        : [],
    [project],
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
          description="Escolha o workspace que contém este projeto."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <MainLayout module="work" >
        <WorkLoadingState label="Carregando projeto…" />
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

  if (!project) {
    return (
      <MainLayout module="work" >
        <WorkEmptyState
          title="Projeto não encontrado"
          description="O projeto pode ter sido movido, arquivado ou não pertencer ao workspace selecionado."
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

  return (
    <MainLayout module="work" >
      <div className="space-y-6 pb-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/work')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Visão geral
        </Button>

        <WorkPageHeader
          eyebrow={
            [
              treeQuery.data?.name ?? 'Workspace',
              folderName,
              `Projeto ${project.status.toLocaleLowerCase('pt-BR')}`
            ].filter(Boolean).join(' / ')
          }
          title={project.name}
          description={
            project.description ??
            'Organize as listas e acompanhe o andamento das tarefas deste projeto.'
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

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso do projeto</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>

        {projectLists.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Listas do projeto</h2>
              <Button variant="outline" size="sm" onClick={() => setIsCreateListModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Lista
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {projectLists.map((list) => {
                const count = projectTasks.filter(
                  (task) => task.context.list_id === list.id,
                ).length;
                return (
                  <button
                    key={list.id}
                    type="button"
                    className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
                    onClick={() => navigate(`/work/list/${list.id}`)}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <ListChecks className="h-4 w-4 text-primary" />
                      {list.name}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {count} {count === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <WorkTaskFilters value={filters} onChange={setFilters} />

        {projectLists.length === 0 ? (
          <WorkEmptyState
            title="Projeto sem listas"
            description="Crie uma lista para começar a adicionar tarefas a este projeto."
            action={
              <Button onClick={() => setIsCreateListModalOpen(true)}>
                Criar lista
              </Button>
            }
          />
        ) : filteredTasks.length === 0 && projectTasks.length > 0 ? (
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
            onCreateTask={(title, spaceId, listId, status) => 
              void handleCreateTask(title, spaceId, listId, status)
            }
            onTaskDelete={(task) => void handleDeleteTask(task)}
            onTaskArchive={(task) => void handleArchiveTask(task)}
            emptyListContext={
              projectTasks.length === 0 && projectLists.length > 0 ? {
                listId: projectLists[0].id,
                listName: projectLists[0].name,
                spaceId: project.id,
                spaceName: project.name,
              } : undefined
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
              const listId = projectLists[0]?.id;
              if (listId && selectedWorkspaceId) {
                void handleCreateTask(title, selectedWorkspaceId, listId, status);
              } else {
                toast.error("É necessário ter pelo menos uma lista para criar tarefas.");
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
            onCreateTask={(title, status) => {
              const listId = projectLists[0]?.id;
              if (listId && selectedWorkspaceId) {
                void handleCreateTask(title, selectedWorkspaceId, listId, status);
              } else {
                toast.error("É necessário ter pelo menos uma lista para criar tarefas.");
              }
            }}
          />
        )}
      </div>

      {projectId && (
        <CreateListModal
          isOpen={isCreateListModalOpen}
          onClose={() => setIsCreateListModalOpen(false)}
          spaceId={projectId}
          onCreateList={async (data) => {
            await createList(data);
          }}
        />
      )}
    </MainLayout>
  );
}
