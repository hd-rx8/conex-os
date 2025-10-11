import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { Clipboard, Plus, Loader2, Calendar, Clock, ArrowLeft, Edit, Trash2, User, Building, TrendingUp, BarChart3, ChevronRight, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useProjects, { Project } from '@/hooks/useProjects';
import useTasks, { Task, CreateTaskData } from '@/hooks/useTasks';
import { useSession } from '@/hooks/useSession';
import CreateTaskModal from '@/components/projects/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { getProjectById, updateProject, deleteProject } = useProjects();
  const { tasks, loading: tasksLoading, createTask, updateTaskStatus, deleteTask, refetch: refetchTasks } = useTasks(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await getProjectById(projectId);
      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error('Erro ao carregar projeto:', error);
      toast.error('Erro ao carregar detalhes do projeto.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId, getProjectById, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      const { error } = await createTask(taskData);
      if (error) throw error;
      await refetchTasks();
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(`Erro ao criar tarefa: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await updateTaskStatus(taskId, newStatus);
      if (error) throw error;
      await refetchTasks();
      toast.success('Status da tarefa atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
      const { error } = await deleteTask(taskId);
      if (error) throw error;
      await refetchTasks();
      toast.success('Tarefa excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa.');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if (!confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas associadas serão excluídas.')) return;
    
    try {
      const { error } = await deleteProject(projectId);
      if (error) throw error;
      toast.success('Projeto excluído com sucesso!');
      navigate('/projects');
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir projeto.');
    }
  };

  const handleUpdateProjectStatus = async (newStatus: string) => {
    if (!projectId) return;
    
    try {
      const { error } = await updateProject(projectId, { status: newStatus });
      if (error) throw error;
      setProject(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success('Status do projeto atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto.');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  if (loading) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout module="work">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
          <p className="text-muted-foreground mt-2">O projeto que você está procurando não existe ou foi removido.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Projetos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getProjectProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'Concluída').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getProjectStats = () => {
    if (!tasks) return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.status === 'Concluída').length,
      inProgress: tasks.filter(task => task.status === 'Em Progresso').length,
      pending: tasks.filter(task => task.status === 'Pendente').length
    };
  };

  const stats = getProjectStats();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <MainLayout module="work">
      <div className="space-y-6">
        {/* Header com navegação e breadcrumb */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Projetos
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span className="font-medium">Projetos</span>
            <ChevronRight className="h-4 w-4" />
            <span className="flex items-center gap-2">
              {project.icon && <span className="text-base">{project.icon}</span>}
              <span className="font-medium text-foreground">{project.title}</span>
            </span>
            <Badge
              className={
                project.status === 'Ativo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                project.status === 'Concluído' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }
            >
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Cabeçalho do Projeto */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{project.title}</h1>
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                {project.status === 'Ativo' ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateProjectStatus('Concluído')}
                  >
                    Marcar como Concluído
                  </Button>
                ) : project.status === 'Concluído' ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateProjectStatus('Ativo')}
                  >
                    Reativar Projeto
                  </Button>
                ) : null}
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteProject}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{project.app_users?.name || 'Não definido'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{format(parseISO(project.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Atualizado em</p>
                  <p className="font-medium">{format(parseISO(project.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="font-medium">{getProjectProgress()}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abas principais */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas ({stats.total})</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
          
          {/* Aba Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Estatísticas do Projeto */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Barra de Progresso */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Geral</span>
                    <span>{getProjectProgress()}%</span>
                  </div>
                  <Progress value={getProjectProgress()} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba Tarefas */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tarefas do Projeto</CardTitle>
                <CreateTaskModal 
                  projectId={projectId || ''}
                  onCreateTask={handleCreateTask}
                >
                  <Button className="gradient-button-bg text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </CreateTaskModal>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pendentes">
                  <TabsList className="mb-4">
                    <TabsTrigger value="pendentes">Pendentes ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="em-progresso">Em Progresso ({stats.inProgress})</TabsTrigger>
                    <TabsTrigger value="concluidas">Concluídas ({stats.completed})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pendentes">
                    {tasksLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : getTasksByStatus('Pendente').length > 0 ? (
                      <div className="space-y-3">
                        {getTasksByStatus('Pendente').map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={handleUpdateTaskStatus}
                            onDelete={handleDeleteTask}
                            onClick={handleTaskClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Não há tarefas pendentes.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="em-progresso">
                    {tasksLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : getTasksByStatus('Em Progresso').length > 0 ? (
                      <div className="space-y-3">
                        {getTasksByStatus('Em Progresso').map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={handleUpdateTaskStatus}
                            onDelete={handleDeleteTask}
                            onClick={handleTaskClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Não há tarefas em progresso.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="concluidas">
                    {tasksLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : getTasksByStatus('Concluída').length > 0 ? (
                      <div className="space-y-3">
                        {getTasksByStatus('Concluída').map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={handleUpdateTaskStatus}
                            onDelete={handleDeleteTask}
                            onClick={handleTaskClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Não há tarefas concluídas.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba Kanban */}
          <TabsContent value="kanban">
            <Card>
              <CardHeader>
                <CardTitle>Quadro Kanban</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Coluna Pendente */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <h3 className="font-medium">Pendente ({stats.pending})</h3>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {getTasksByStatus('Pendente').map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                          onClick={handleTaskClick}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Coluna Em Progresso */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-medium">Em Progresso ({stats.inProgress})</h3>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {getTasksByStatus('Em Progresso').map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                          onClick={handleTaskClick}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Coluna Concluída */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="font-medium">Concluída ({stats.completed})</h3>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {getTasksByStatus('Concluída').map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleUpdateTaskStatus}
                          onDelete={handleDeleteTask}
                          onClick={handleTaskClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          open={isTaskModalOpen}
          onClose={handleCloseTaskModal}
        />
      </div>
    </MainLayout>
  );
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onClick?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete, onClick }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Em Progresso': return 'bg-blue-100 text-blue-800';
      case 'Concluída': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Pendente': return 'Em Progresso';
      case 'Em Progresso': return 'Concluída';
      case 'Concluída': return 'Pendente';
      default: return 'Pendente';
    }
  };

  return (
    <div
      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onClick?.(task)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{task.title}</h3>
        <div className="flex gap-2">
          <Badge className={getStatusBadgeClass(task.status)}>{task.status}</Badge>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {task.due_date && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Criada em {format(parseISO(task.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, getNextStatus(task.status));
            }}
          >
            {task.status === 'Concluída' ? 'Reabrir' : task.status === 'Pendente' ? 'Iniciar' : 'Concluir'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;