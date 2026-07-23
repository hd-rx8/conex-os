import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderPlus, ListPlus, Plus, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';

import HierarchyNavigator from '@/components/HierarchyNavigator';
import MainLayout from '@/components/MainLayout';
import { ContentCard } from '@/components/layout/ContentCard';
import { PageToolbar } from '@/components/layout/PageToolbar';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import CreateWorkspaceModal from '@/components/modals/CreateWorkspaceModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkPageHeader } from '@/features/work/components/WorkPageHeader';
import {
  useCreateSpaceMutation,
  useListTasksQuery,
  useWorkspacesQuery,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import type { WorkDataError } from '@/features/work/api/workApi';
import type { HierarchyTask } from '@/types/hierarchy';

function asWorkError(error: unknown): WorkDataError | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error
  ) {
    return error as WorkDataError;
  }
  return error
    ? {
        code: 'WORK_UNKNOWN',
        message: 'Unknown Work data error',
        details: null,
        hint: null,
        userMessage: 'Não foi possível carregar seus projetos',
      }
    : null;
}

const WorkManagement = () => {
  const navigate = useNavigate();
  const workspacesQuery = useWorkspacesQuery();
  const workspaces = useMemo(
    () => workspacesQuery.data ?? [],
    [workspacesQuery.data],
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>();
  const [selectedListId, setSelectedListId] = useState<string>();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (!selectedWorkspaceId && workspaces[0]?.id) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, workspaces]);

  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useListTasksQuery(selectedListId);
  const createSpaceMutation = useCreateSpaceMutation();
  const selectedWorkspace = treeQuery.data;
  const tasks = tasksQuery.data ?? [];
  const loadError = asWorkError(workspacesQuery.error ?? treeQuery.error);

  useEffect(() => {
    if (loadError?.code) {
      toast.error('Não foi possível carregar seus projetos');
    }
  }, [loadError?.code]);

  const selectedListName = useMemo(() => {
    if (!selectedListId || !selectedWorkspace) return null;

    for (const space of selectedWorkspace.spaces) {
      const directList = space.lists.find((list) => list.id === selectedListId);
      if (directList) return directList.name;

      for (const folder of space.folders) {
        const folderList = folder.lists.find((list) => list.id === selectedListId);
        if (folderList) return folderList.name;
      }
    }
    return null;
  }, [selectedListId, selectedWorkspace]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedListId(undefined);
  };

  const handleCreateProject = async (data: {
    workspace_id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => {
    try {
      await createSpaceMutation.mutateAsync(data);
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível criar o projeto.';
      toast.error(message);
      throw error;
    }
  };

  if (workspacesQuery.isLoading) {
    return (
      <MainLayout module="work" >
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <p className="text-muted-foreground">Carregando workspaces…</p>
        </div>
      </MainLayout>
    );
  }

  if (loadError) {
    const retry = workspacesQuery.error
      ? workspacesQuery.refetch
      : treeQuery.refetch;

    return (
      <MainLayout module="work" >
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Não foi possível carregar seus projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void retry()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (workspaces.length === 0) {
    return (
      <MainLayout module="work" >
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">
                Nenhum workspace encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Crie um workspace para organizar seus projetos, listas e tarefas.
              </p>
              <Button
                className="w-full"
                onClick={() => setIsCreateWorkspaceOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar workspace
              </Button>
              <CreateWorkspaceModal
                isOpen={isCreateWorkspaceOpen}
                onClose={() => setIsCreateWorkspaceOpen(false)}
                onSuccess={setSelectedWorkspaceId}
              />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || !selectedWorkspace) {
    return (
      <MainLayout module="work" >
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <p className="text-muted-foreground">Carregando projetos…</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work" >
      <div className="app-page">
        <WorkPageHeader
          eyebrow={selectedWorkspace.name}
          title="Workspaces e projetos"
          description="Organize a estrutura do workspace e acesse as tarefas de cada lista."
          actions={(
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/work/workspaces')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Gerenciar
              </Button>
              <Button
                onClick={() => setIsCreateWorkspaceOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo workspace
              </Button>
            </>
          )}
        />

        <PageToolbar>
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium">
            Workspace atual
            <select
              className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
              value={selectedWorkspaceId}
              onChange={(event) => handleWorkspaceChange(event.target.value)}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.icon} {workspace.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            onClick={() => setIsCreateProjectOpen(true)}
            className="gap-2 lg:self-end"
          >
            <Plus className="h-4 w-4" />
            Criar projeto
          </Button>
        </PageToolbar>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,2fr)]">
          <ContentCard
            title="Estrutura"
            description="Projetos, pastas e listas do workspace selecionado."
          >
            <ScrollArea className="h-[520px] pr-3">
              <HierarchyNavigator
                workspace={selectedWorkspace}
                selectedListId={selectedListId}
                onSelectList={setSelectedListId}
                onCreateSpace={() => setIsCreateProjectOpen(true)}
                onCreateFolder={() =>
                  toast.info('Criação de pasta em desenvolvimento')
                }
                onCreateList={() =>
                  toast.info('Criação de lista em desenvolvimento')
                }
              />
            </ScrollArea>
          </ContentCard>

          <ContentCard
            title={selectedListName || 'Tarefas da lista'}
            description={
              selectedListId
                ? `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`
                : 'Selecione uma lista na estrutura para visualizar suas tarefas.'
            }
            action={
              selectedListId ? (
                <Button
                  onClick={() => toast.info('Criação de tarefa em desenvolvimento')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova tarefa
                </Button>
              ) : undefined
            }
          >
            {selectedListId ? (
              <div className="space-y-3">
                {tasksQuery.isLoading ? (
                  <p className="py-12 text-center text-muted-foreground">
                    Carregando tarefas…
                  </p>
                ) : tasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </div>
                ) : (
                  tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                Selecione uma lista para visualizar as tarefas
              </div>
            )}
          </ContentCard>
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onSuccess={setSelectedWorkspaceId}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        workspaceId={selectedWorkspace.id}
        onCreateProject={handleCreateProject}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="gradient-button-bg fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full p-0 text-white shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="mb-2 w-56">
          <DropdownMenuItem onClick={() => setIsCreateProjectOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Criar projeto
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast.info('Criação de pasta em desenvolvimento')}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Criar pasta
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast.info('Criação de lista em desenvolvimento')}
          >
            <ListPlus className="mr-2 h-4 w-4" />
            Criar lista
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!selectedListId}>
            <FileText className="mr-2 h-4 w-4" />
            Criar tarefa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MainLayout>
  );
};

const TaskCard = ({ task }: { task: HierarchyTask }) => (
  <Card className="transition-shadow hover:shadow-md">
    <CardContent className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{task.title}</h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{task.priority}</Badge>
          <Badge variant="outline">{task.status}</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          {task.assignee && (
            <span className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              {task.assignee.name}
            </span>
          )}
          {task.due_date && (
            <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
          )}
        </div>
        <div className="flex gap-1">
          {task.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default WorkManagement;
