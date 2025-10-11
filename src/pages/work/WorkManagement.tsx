import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useHierarchyTasks } from '@/hooks/useHierarchyTasks';
import { useSpaces } from '@/hooks/useSpaces';
import { useSession } from '@/hooks/useSession';
import MainLayout from '@/components/MainLayout';
import HierarchyNavigator from '@/components/HierarchyNavigator';
import CreateWorkspaceModal from '@/components/modals/CreateWorkspaceModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Users, FolderPlus, ListPlus, FileText, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { WorkspaceTree, HierarchyTask } from '@/types/hierarchy';
import { toast } from 'sonner';

const WorkManagement: React.FC = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const { workspaces, loading: workspacesLoading, getWorkspaceTree } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceTree | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { tasks, loading: tasksLoading } = useHierarchyTasks(selectedListId || undefined);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const { createSpace } = useSpaces(selectedWorkspace?.id);

  // Carregar primeiro workspace por padrão
  useEffect(() => {
    const loadDefaultWorkspace = async () => {
      if (workspaces.length > 0 && !selectedWorkspace) {
        const tree = await getWorkspaceTree(workspaces[0].id);
        setSelectedWorkspace(tree);
      }
    };

    loadDefaultWorkspace();
  }, [workspaces, selectedWorkspace, getWorkspaceTree]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    const tree = await getWorkspaceTree(workspaceId);
    setSelectedWorkspace(tree);
    setSelectedListId(null);
  };

  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
  };

  const handleCreateProject = async (data: {
    workspace_id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => {
    const { error } = await createSpace(data);

    if (error) {
      toast.error('Erro ao criar projeto: ' + error.message);
      throw error;
    }

    toast.success('Projeto criado com sucesso!');

    // Recarregar workspace tree
    if (selectedWorkspace) {
      const tree = await getWorkspaceTree(selectedWorkspace.id);
      setSelectedWorkspace(tree);
    }
  };


  const getSelectedListName = () => {
    if (!selectedListId || !selectedWorkspace) return null;

    for (const space of selectedWorkspace.spaces) {
      // Buscar em lists diretas
      const directList = space.lists.find((l) => l.id === selectedListId);
      if (directList) return directList.name;

      // Buscar em folders
      for (const folder of space.folders) {
        const folderList = folder.lists.find((l) => l.id === selectedListId);
        if (folderList) return folderList.name;
      }
    }
    return null;
  };

  if (workspacesLoading) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Carregando workspaces...</p>
        </div>
      </MainLayout>
    );
  }

  if (workspaces.length === 0) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Nenhum Workspace Encontrado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Você ainda não tem acesso a nenhum workspace. Crie um novo workspace para começar.
              </p>
              <Button className="w-full" onClick={() => setIsCreateWorkspaceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Workspace
              </Button>
              <CreateWorkspaceModal
                isOpen={isCreateWorkspaceOpen}
                onClose={() => setIsCreateWorkspaceOpen(false)}
                onSuccess={async (workspaceId) => {
                  const tree = await getWorkspaceTree(workspaceId);
                  setSelectedWorkspace(tree);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="flex h-[calc(100vh-80px)] gap-4">
        {/* Sidebar - Navegação Hierárquica */}
        <div className="w-80 border-r bg-card">
          <div className="p-4 space-y-4">
            {/* Workspace Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">WORKSPACE</h3>
                <div className="flex gap-1">
                  {selectedWorkspace && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => navigate('/work/workspaces')}
                        title="Gerenciar Workspaces"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsCreateWorkspaceOpen(true)}
                    title="Criar Workspace"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={selectedWorkspace?.id || ''}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.icon} {ws.name}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Botão Criar Projeto */}
            {selectedWorkspace && (
              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Projeto
              </Button>
            )}

            {/* Navegação em Árvore */}
            {selectedWorkspace && (
              <ScrollArea className="h-[calc(100vh-320px)]">
                <HierarchyNavigator
                  workspace={selectedWorkspace}
                  selectedListId={selectedListId || undefined}
                  onSelectList={handleSelectList}
                  onCreateSpace={() => setIsCreateProjectOpen(true)}
                  onCreateFolder={(sId) => toast.info('Criar Folder - Em desenvolvimento')}
                  onCreateList={(sId, fId) => toast.info('Criar List - Em desenvolvimento')}
                />
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Main Content - Tasks */}
        <div className="flex-1 p-4">
          {selectedListId ? (
            <div className="space-y-4">
              {/* Header da List */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{getSelectedListName()}</h1>
                  <p className="text-sm text-muted-foreground">
                    {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </p>
                </div>
                <Button onClick={() => toast.info('Criar Task - Em desenvolvimento')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Task
                </Button>
              </div>

              <Separator />

              {/* Tasks List */}
              <div className="space-y-3">
                {tasksLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium">Nenhuma task encontrada</p>
                        <p className="text-sm text-muted-foreground">
                          Crie sua primeira task para começar
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="w-full max-w-md">
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Selecione uma lista</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha uma lista na barra lateral para visualizar as tasks
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onSuccess={async (workspaceId) => {
          const tree = await getWorkspaceTree(workspaceId);
          setSelectedWorkspace(tree);
        }}
      />

      {selectedWorkspace && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          workspaceId={selectedWorkspace.id}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* FAB Context-Aware */}
      {selectedWorkspace && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-button-bg hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 p-0 sm:bottom-8 sm:right-8"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuItem onClick={() => setIsCreateProjectOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Criar Projeto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Criar Folder - Em desenvolvimento')}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Criar Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Criar List - Em desenvolvimento')}>
              <ListPlus className="mr-2 h-4 w-4" />
              Criar Lista
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast.info('Criar Task - Em desenvolvimento')}
              disabled={!selectedListId}
            >
              <FileText className="mr-2 h-4 w-4" />
              Criar Tarefa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </MainLayout>
  );
};

// Componente para exibir uma Task
const TaskCard: React.FC<{ task: HierarchyTask }> = ({ task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Média':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Em Progresso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pendente':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {task.assignee && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>{task.assignee.name}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkManagement;
