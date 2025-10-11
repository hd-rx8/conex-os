import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useLists from '@/hooks/useLists';
import useTasks from '@/hooks/useTasks';
import { useSession } from '@/hooks/useSession';
import EditListModal from '@/components/modals/EditListModal';
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog';
import CreateTaskFromProjectModal from '@/components/projects/CreateTaskFromProjectModal';

const ListDetails: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();

  const { lists, loading: listsLoading, updateList, deleteList, refetch: refetchLists } = useLists();
  const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask: removeTask, refetch: refetchTasks } = useTasks(listId);

  // Debug logs
  React.useEffect(() => {
    console.log('[ListDetails] Component state:', {
      listId,
      tasksLoading,
      tasksError,
      tasksCount: tasks?.length || 0,
      tasks
    });
  }, [listId, tasksLoading, tasksError, tasks]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const list = lists?.find(l => l.id === listId);

  const handleUpdateList = async (data: { name: string; description: string | null }) => {
    if (!listId) return;

    const { error } = await updateList(listId, data);
    if (error) {
      toast.error('Erro ao atualizar lista: ' + error.message);
      return;
    }

    toast.success('Lista atualizada com sucesso!');
    await refetchLists();
    setIsEditModalOpen(false);
  };

  const handleDeleteList = async () => {
    if (!listId) return;

    setIsDeleting(true);
    const { error } = await deleteList(listId);

    if (error) {
      toast.error('Erro ao excluir lista: ' + error.message);
      setIsDeleting(false);
      return;
    }

    toast.success('Lista excluída com sucesso!');
    navigate('/work');
  };

  const handleCreateTask = async (taskData: any) => {
    const { error } = await createTask(taskData);
    if (error) {
      toast.error('Erro ao criar tarefa: ' + error.message);
      throw error;
    }

    toast.success('Tarefa criada com sucesso!');
    await refetchTasks();
    setIsCreateTaskModalOpen(false);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await updateTask(taskId, { status: newStatus });
    if (error) {
      toast.error('Erro ao atualizar status da tarefa');
      return;
    }

    toast.success('Status atualizado com sucesso!');
    await refetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    const { error } = await removeTask(taskId);
    if (error) {
      toast.error('Erro ao excluir tarefa');
      return;
    }

    toast.success('Tarefa excluída com sucesso!');
    await refetchTasks();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Em Progresso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Média': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Baixa': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const isOverdue = (task: any) => {
    return task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Concluída';
  };

  if (listsLoading) {
    return (
      <MainLayout module="work">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!list) {
    return (
      <MainLayout module="work">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Lista não encontrada</p>
          <Button onClick={() => navigate('/work')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/work')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <h1 className="text-3xl font-bold">{list.name}</h1>
              </div>
              {list.description && (
                <p className="text-muted-foreground mt-2">{list.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de Tarefas</p>
              <p className="text-2xl font-bold">{tasks?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tasks?.filter(t => t.status === 'Pendente').length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Em Progresso</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks?.filter(t => t.status === 'Em Progresso').length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks?.filter(t => t.status === 'Concluída').length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tarefas</CardTitle>
            <Button onClick={() => setIsCreateTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </CardHeader>
          <CardContent>
            {tasksError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-2">Erro ao carregar tarefas</p>
                <p className="text-sm text-muted-foreground mb-4">{tasksError.message}</p>
                <Button onClick={() => refetchTasks()} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <Card key={task.id} className={`hover:shadow-md transition-shadow ${isOverdue(task) ? 'border-red-200 bg-red-50/30 dark:bg-red-950/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                          {task.priority && (
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
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
                            onClick={() => {
                              const nextStatus = task.status === 'Pendente' ? 'Em Progresso' : task.status === 'Em Progresso' ? 'Concluída' : 'Pendente';
                              handleUpdateTaskStatus(task.id, nextStatus);
                            }}
                          >
                            {task.status === 'Concluída' ? 'Reabrir' : task.status === 'Pendente' ? 'Iniciar' : 'Concluir'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhuma tarefa nesta lista</p>
                <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {list && (
        <>
          <EditListModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            list={list}
            onUpdate={handleUpdateList}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteList}
            title="Excluir Lista"
            description="Tem certeza que deseja excluir esta lista? Todas as tarefas serão excluídas também."
            itemName={list.name}
            isDeleting={isDeleting}
          />

          <CreateTaskFromProjectModal
            isOpen={isCreateTaskModalOpen}
            onClose={() => setIsCreateTaskModalOpen(false)}
            onCreateTask={handleCreateTask}
            preselectedSpaceId={list.space_id}
            preselectedListId={list.id}
          />
        </>
      )}
    </MainLayout>
  );
};

export default ListDetails;
