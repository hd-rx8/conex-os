import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Clipboard, Plus, Loader2, Calendar, Clock, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useProjects, { Project } from '@/hooks/useProjects';
import useTasks, { Task, CreateTaskData } from '@/hooks/useTasks';
import { useSession } from '@/hooks/useSession';
import CreateTaskModal from '@/components/projects/CreateTaskModal';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { getProjectById, updateProject, deleteProject } = useProjects();
  const { tasks, loading: tasksLoading, createTask, updateTaskStatus, deleteTask, refetch: refetchTasks } = useTasks(projectId);
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
      <Layout module="projects">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout module="projects">
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
      </Layout>
    );
  }

  return (
    <Layout module="projects">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/projects')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <PageHeader
          title={project.title}
          subtitle={project.description || 'Sem descrição'}
          icon={Clipboard}
          className="flex-1"
        >
          <div className="flex gap-2 mt-4 md:mt-0">
            <Badge 
              className={
                project.status === 'Ativo' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                project.status === 'Concluído' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }
            >
              {project.status}
            </Badge>
            
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
            ) : project.status === 'Arquivado' ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateProjectStatus('Ativo')}
              >
                Desarquivar
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
        </PageHeader>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tarefas</CardTitle>
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
                <TabsTrigger value="pendentes">Pendentes ({getTasksByStatus('Pendente').length})</TabsTrigger>
                <TabsTrigger value="em-progresso">Em Progresso ({getTasksByStatus('Em Progresso').length})</TabsTrigger>
                <TabsTrigger value="concluidas">Concluídas ({getTasksByStatus('Concluída').length})</TabsTrigger>
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
      </div>
    </Layout>
  );
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete }) => {
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
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
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
            onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
          >
            {task.status === 'Concluída' ? 'Reabrir' : task.status === 'Pendente' ? 'Iniciar' : 'Concluir'}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;