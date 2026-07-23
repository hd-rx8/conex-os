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
import { WorkViewSwitcher } from '@/features/work/components/WorkViewSwitcher';
import { useWorkContext } from '@/features/work/context/workContextState';
import {
  useListTasksQuery,
  useUpdateTaskMutation,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import { useWorkViewMode } from '@/features/work/hooks/useWorkViewMode';
import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from '@/features/work/view/workTaskSelectors';
import type { ListTree, TaskFilters, WorkTaskItem } from '@/types/hierarchy';

interface ListContext {
  list: ListTree;
  projectId: string;
  projectName: string;
  folderName?: string;
  workspaceFolderName?: string;
}

const EMPTY_TASKS: readonly WorkTaskItem[] = [];

export default function ListDetails() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useWorkContext();
  const [filters, setFilters] = useState<TaskFilters>({});
  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useListTasksQuery(listId);
  const updateTask = useUpdateTaskMutation(listId);
  const { view, setView } = useWorkViewMode('list', listId ?? 'none');
  const listContext = useMemo<ListContext | undefined>(() => {
    if (!treeQuery.data) return undefined;
    
    // Anexa a informação de "workspaceFolderName" em todos os spaces
    const allSpaces = [
      ...treeQuery.data.spaces.map(s => ({ ...s, workspaceFolderName: undefined })),
      ...(treeQuery.data.workspace_folders?.flatMap(f => f.spaces.map(s => ({ ...s, workspaceFolderName: f.name }))) || [])
    ];
    
    for (const project of allSpaces) {
      const directList = project.lists.find((list) => list.id === listId);
      if (directList) {
        return {
          list: directList,
          projectId: project.id,
          projectName: project.name,
          workspaceFolderName: project.workspaceFolderName,
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
            workspaceFolderName: project.workspaceFolderName,
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

  const { list, projectId, projectName, folderName, workspaceFolderName } = listContext;
  const path = [treeQuery.data?.name ?? 'Workspace', workspaceFolderName, projectName, folderName].filter(Boolean).join(' / ');

  return (
    <MainLayout module="work" >
      <div className="space-y-6 pb-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/work/project/${projectId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {projectName}
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

        {tasks.length === 0 ? (
          <WorkEmptyState
            title="Lista sem tarefas"
            description="As tarefas criadas nesta lista aparecerão aqui."
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
