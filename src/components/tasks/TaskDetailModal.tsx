import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  CheckSquare,
  Edit,
  Check,
  X,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import SubtaskList from './SubtaskList';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';
import useTasks from '@/hooks/useTasks';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onClose,
}) => {
  const { user } = useSession();
  const { updateTask, refetch } = useTasks();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Em Progresso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Concluída':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Média':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Baixa':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleStartEditTitle = () => {
    setEditTitle(task.title);
    setIsEditingTitle(true);
  };

  const handleStartEditDescription = () => {
    setEditDescription(task.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) {
      toast.error('O título não pode estar vazio');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateTask(task.id, { title: editTitle.trim() });
      if (error) throw error;

      toast.success('Título atualizado com sucesso!');
      setIsEditingTitle(false);
      await refetch();
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast.error('Erro ao atualizar título');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateTask(task.id, {
        description: editDescription.trim() || null,
      });
      if (error) throw error;

      toast.success('Descrição atualizada com sucesso!');
      setIsEditingDescription(false);
      await refetch();
    } catch (error: any) {
      console.error('Error updating description:', error);
      toast.error('Erro ao atualizar descrição');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader className="space-y-3">
          {/* Title Section */}
          <div className="space-y-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isSaving}
                  className="text-2xl font-bold h-auto py-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTitle();
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                />
                <Button
                  onClick={handleSaveTitle}
                  disabled={isSaving}
                  size="sm"
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsEditingTitle(false)}
                  disabled={isSaving}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl font-bold flex-1">
                  {task.title}
                </DialogTitle>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditTitle}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Breadcrumb Location */}
            {task.lists && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                {task.lists.spaces && (
                  <>
                    <Folder className="h-3.5 w-3.5" />
                    <span className="flex items-center gap-1">
                      <span>{task.lists.spaces.icon || '📁'}</span>
                      <span className="font-medium">{task.lists.spaces.name}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
                <span>{task.lists.name}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              {task.priority && (
                <Badge className={getPriorityColor(task.priority)}>
                  <Tag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Subtarefas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Description Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Descrição
                </h3>
                {!isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditDescription}
                    className="h-7 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isSaving}
                    placeholder="Adicione uma descrição para esta tarefa..."
                    rows={5}
                    autoFocus
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveDescription}
                      disabled={isSaving}
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setIsEditingDescription(false)}
                      disabled={isSaving}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-sm ${
                    task.description
                      ? 'text-foreground whitespace-pre-wrap'
                      : 'text-muted-foreground italic'
                  } cursor-pointer hover:bg-muted/50 p-3 rounded-md transition-colors`}
                  onClick={handleStartEditDescription}
                >
                  {task.description || 'Nenhuma descrição. Clique para adicionar...'}
                </div>
              )}
            </div>

            <Separator />

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                    <p className="text-sm font-medium">
                      {format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criada em</p>
                  <p className="text-sm font-medium">
                    {format(parseISO(task.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* Assignee */}
              {task.assignee_id && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="text-sm font-medium">ID: {task.assignee_id.slice(0, 8)}...</p>
                  </div>
                </div>
              )}

              {/* Creator */}
              {task.creator_id && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Criador</p>
                    <p className="text-sm font-medium">ID: {task.creator_id.slice(0, 8)}...</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="mt-4">
            <SubtaskList taskId={task.id} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
