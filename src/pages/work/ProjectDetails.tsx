import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDot, ListChecks, Rows3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

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
import { WorkTaskFilters } from '@/features/work/components/WorkTaskFilters';
import { WorkViewSwitcher } from '@/features/work/components/WorkViewSwitcher';
import { useWorkContext } from '@/features/work/context/WorkContext';
import {
  useUpdateTaskMutation,
  useWorkspaceTasksQuery,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import { useWorkViewMode } from '@/features/work/hooks/useWorkViewMode';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import type { TaskFilters, WorkTaskItem } from '@/types/hierarchy';

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(selectedWorkspaceId);
  const updateTask = useUpdateTaskMutation();
  const { view, setView } = useWorkViewMode('project', projectId ?? 'none');
  const project = treeQuery.data?.spaces.find((space) => space.id === projectId);
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

  if (!selectedWorkspaceId) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkEmptyState
          title="Selecione um workspace"
          description="Escolha o workspace que contém este projeto."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkLoadingState label="Carregando projeto…" />
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

  if (!project) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
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
    <MainLayout module="work" showGlobalFab={false}>
      <div className="space-y-6 pb-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/work')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Visão geral
        </Button>

        <WorkPageHeader
          eyebrow={`${treeQuery.data?.name ?? 'Workspace'} · Projeto ${project.status.toLocaleLowerCase('pt-BR')}`}
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
            <h2 className="text-sm font-semibold">Listas do projeto</h2>
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

        {projectTasks.length === 0 ? (
          <WorkEmptyState
            title="Projeto sem tarefas"
            description="As tarefas das listas deste projeto aparecerão aqui."
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
