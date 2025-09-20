import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { Kanban, Plus, Calendar, Clock, Loader2, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useProjects from '@/hooks/useProjects';
import useTasks, { Task } from '@/hooks/useTasks';
import CreateTaskFromProjectModal from '@/components/projects/CreateTaskFromProjectModal';
import FloatingActionButton from '@/components/FloatingActionButton';

const TasksBoard: React.FC = () => {
  const { projects } = useProjects();
  const { tasks, loading, createTask, updateTaskStatus, deleteTask, refetch } = useTasks();
  
  const [filterProject, setFilterProject] = useState<string>('all');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Status das tarefas mapeados corretamente
  const statuses = [
    { key: 'Pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'Em Progresso', label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
    { key: 'Concluída', label: 'Concluída', color: 'bg-green-100 text-green-800' }
  ];

  const handleCreateTask = async (taskData: any) => {
    try {
      const { error } = await createTask(taskData);
      if (error) throw error;
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

  // Filtrar tarefas
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      if (filterProject !== 'all' && task.project_id !== filterProject) {
        return false;
      }
      return true;
    });
  }, [tasks, filterProject]);

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.title || 'Projeto não encontrado';
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggingTaskId(taskId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    if (!draggingTaskId) return;

    const taskId = e.dataTransfer.getData('text/plain');
    const taskToMove = filteredTasks.find(t => t.id === taskId);

    if (taskToMove && taskToMove.status !== newStatus) {
      await handleUpdateTaskStatus(taskId, newStatus);
    }
    
    setDraggingTaskId(null);
    setIsDragging(false);
  };

  return (
    <MainLayout module="work">
      <div className="relative pb-20">
        {/* Floating Action Button */}
        <CreateTaskFromProjectModal 
          projects={projects || []}
          onCreateTask={handleCreateTask}
        >
          <FloatingActionButton
            onClick={() => {}}
            tooltip="Criar Nova Tarefa"
            icon={Plus}
          />
        </CreateTaskFromProjectModal>

        {/* Filtros */}
        <div className="mt-6 flex gap-4">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Filtrar por projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex space-x-4 p-4 min-h-[600px] items-start">
              {statuses.map((status) => {
              const statusTasks = getTasksByStatus(status.key);
              
              return (
                <div
                  key={status.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.key)}
                  className={cn(
                    "flex-shrink-0 w-72 sm:w-80 bg-muted/40 rounded-lg p-4 shadow-sm border",
                    draggingTaskId && "border-dashed border-primary"
                  )}
                >
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center justify-between">
                    <span className="truncate">{status.label}</span>
                    <Badge variant="secondary" className={cn("text-xs", status.color)}>
                      {statusTasks.length}
                    </Badge>
                  </h3>
                  
                  <div className="space-y-3 min-h-[100px]">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : statusTasks.length > 0 ? (
                      statusTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          projectName={getProjectName(task.project_id)}
                          onDragStart={handleDragStart}
                          onDelete={handleDeleteTask}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          {status.key === 'Pendente' 
                            ? 'Nenhuma tarefa pendente' 
                            : `Nenhuma tarefa ${status.label.toLowerCase()}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </MainLayout>
  );
};

interface TaskCardProps {
  task: Task;
  projectName: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, projectName, onDragStart, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Em Progresso': return 'bg-blue-100 text-blue-800';
      case 'Concluída': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {projectName}
        </p>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
            {task.status}
          </Badge>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.due_date && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{format(parseISO(task.due_date), 'dd/MM', { locale: ptBR })}</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{format(parseISO(task.created_at), 'dd/MM', { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksBoard;