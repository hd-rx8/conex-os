import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import PageHeader from '@/components/PageHeader';
import { ClipboardList, Plus, Calendar, Clock, Search, Loader2, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSpaces } from '@/hooks/useSpaces';
import useTasks, { Task } from '@/hooks/useTasks';
import { useSession } from '@/hooks/useSession';
import CreateTaskFromProjectModal from '@/components/projects/CreateTaskFromProjectModal';
import FloatingActionButton from '@/components/FloatingActionButton';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

const MyTasks: React.FC = () => {
  const { user } = useSession();
  const { spaces } = useSpaces();
  // Chamando com userId para buscar apenas as tarefas do usuário logado
  const { tasks, loading, error: tasksError, createTask, updateTaskStatus, deleteTask, refetch } = useTasks(undefined, undefined, user?.id);

  // Debug logs
  React.useEffect(() => {
    console.log('[MyTasks] Component state:', {
      userId: user?.id,
      loading,
      tasksError,
      tasksCount: tasks?.length || 0,
      tasks
    });
  }, [user?.id, loading, tasksError, tasks]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpace, setFilterSpace] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'created_at' | 'title'>('due_date');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleCreateTask = async (taskData: any) => {
    try {
      const { error } = await createTask(taskData);
      if (error) throw error;
      // Forçar refetch para atualizar a lista
      await refetch();
      toast.success('Tarefa criada com sucesso!');
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
      await refetch();
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
      await refetch();
      toast.success('Tarefa excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa.');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  // Filtrar e ordenar tarefas
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks.filter(task => {
      // Filtro por termo de busca
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por espaço/projeto
      if (filterSpace !== 'all' && task.lists?.space_id !== filterSpace) {
        return false;
      }

      // Filtro por status
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchTerm, filterSpace, filterStatus, sortBy]);

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getTaskCounts = () => {
    const pending = getTasksByStatus('Pendente').length;
    const inProgress = getTasksByStatus('Em Progresso').length;
    const completed = getTasksByStatus('Concluída').length;
    const overdue = filteredTasks.filter(task => 
      task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Concluída'
    ).length;

    return { pending, inProgress, completed, overdue, total: filteredTasks.length };
  };

  const counts = getTaskCounts();

  // Calcular quantidade de projetos únicos
  const uniqueProjects = useMemo(() => {
    if (!tasks) return 0;
    const projectIds = new Set(tasks.map(task => task.lists?.space_id).filter(Boolean));
    return projectIds.size;
  }, [tasks]);

  // Criar subtítulo dinâmico baseado nos projetos
  const subtitle = useMemo(() => {
    if (uniqueProjects === 0) return "Nenhum projeto com tarefas";
    if (uniqueProjects === 1) return "1 projeto ativo";
    return `${uniqueProjects} projetos ativos`;
  }, [uniqueProjects]);

  if (!user) {
    return (
      <MainLayout module="work">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Você precisa estar logado para ver suas tarefas.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="relative pb-20">
        {/* Page Header */}
        <PageHeader
          title="Minhas Tarefas"
          subtitle={subtitle}
          icon={ClipboardList}
        />

        {/* Floating Action Button */}
        <CreateTaskFromProjectModal
          onCreateTask={handleCreateTask}
        >
          <FloatingActionButton
            onClick={() => {}}
            tooltip="Criar Nova Tarefa"
            icon={Plus}
          />
        </CreateTaskFromProjectModal>

        {/* Estatísticas rápidas */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{counts.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em Progresso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-300">{counts.overdue}</p>
                  <p className="text-xs text-muted-foreground">Atrasadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={filterSpace} onValueChange={setFilterSpace}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projetos</SelectItem>
                      {spaces?.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          <div className="flex items-center gap-2">
                            <span>{space.icon || '📁'}</span>
                            <span>{space.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_date">Data de vencimento</SelectItem>
                      <SelectItem value="created_at">Data de criação</SelectItem>
                      <SelectItem value="title">Título</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas ({counts.total})</TabsTrigger>
              <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
              <TabsTrigger value="in-progress">Em Progresso ({counts.inProgress})</TabsTrigger>
              <TabsTrigger value="completed">Concluídas ({counts.completed})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <TasksList
                tasks={filteredTasks}
                loading={loading}
                onStatusChange={handleUpdateTaskStatus}
                onDelete={handleDeleteTask}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="pending">
              <TasksList
                tasks={getTasksByStatus('Pendente')}
                loading={loading}
                onStatusChange={handleUpdateTaskStatus}
                onDelete={handleDeleteTask}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="in-progress">
              <TasksList
                tasks={getTasksByStatus('Em Progresso')}
                loading={loading}
                onStatusChange={handleUpdateTaskStatus}
                onDelete={handleDeleteTask}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="completed">
              <TasksList
                tasks={getTasksByStatus('Concluída')}
                loading={loading}
                onStatusChange={handleUpdateTaskStatus}
                onDelete={handleDeleteTask}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>
          </Tabs>
        </div>

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

interface TasksListProps {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

const TasksList: React.FC<TasksListProps> = ({ tasks, loading, onStatusChange, onDelete, onTaskClick }) => {
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

  const getProjectInfo = (task: Task) => {
    const spaceName = task.lists?.spaces?.name || 'Projeto desconhecido';
    const spaceIcon = task.lists?.spaces?.icon || '📁';
    const listName = task.lists?.name || '';
    return { spaceName, spaceIcon, listName };
  };

  const isOverdue = (task: Task) => {
    return task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Concluída';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue(task) ? 'border-red-200 bg-red-50/30' : ''}`}
          onClick={() => onTaskClick(task)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="inline-flex items-center gap-1">
                        <span>{getProjectInfo(task).spaceIcon}</span>
                        <span>{getProjectInfo(task).spaceName}</span>
                        {getProjectInfo(task).listName && (
                          <span className="text-xs"> › {getProjectInfo(task).listName}</span>
                        )}
                      </span>
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}
                  </div>
                  <Badge className={getStatusBadgeClass(task.status)}>{task.status}</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.due_date && (
                  <div className={`flex items-center ${isOverdue(task) ? 'text-red-600 dark:text-red-300 font-medium' : ''}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {isOverdue(task) && '⚠️ '}
                      Vence em {format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyTasks;