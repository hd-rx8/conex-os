import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Calendar,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import useSubtasks, { Subtask } from '@/hooks/useSubtasks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SubtaskListProps {
  taskId: string;
  userId?: string;
}

interface SortableSubtaskItemProps {
  subtask: Subtask;
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  isSubmitting: boolean;
  onStartEdit: (subtask: Subtask) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onToggleComplete: (subtask: Subtask) => void;
  onDelete: (id: string) => void;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;
}

const SortableSubtaskItem: React.FC<SortableSubtaskItemProps> = ({
  subtask,
  isEditing,
  editTitle,
  editDescription,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleComplete,
  onDelete,
  setEditTitle,
  setEditDescription,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${
        subtask.status === 'Concluída'
          ? 'opacity-60 bg-muted/30'
          : 'hover:shadow-md'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="Título *"
              autoFocus
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Descrição"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => onSaveEdit(subtask.id)}
                disabled={isSubmitting}
                size="sm"
                className="gradient-button-bg text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={onCancelEdit}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Checkbox */}
            <Checkbox
              checked={subtask.status === 'Concluída'}
              onCheckedChange={() => onToggleComplete(subtask)}
              className="mt-1"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium break-words ${
                  subtask.status === 'Concluída'
                    ? 'line-through text-muted-foreground'
                    : ''
                }`}
              >
                {subtask.title}
              </p>
              {subtask.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {subtask.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                {subtask.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(subtask.due_date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                )}
                {subtask.completed_at && (
                  <span>
                    Concluída em{' '}
                    {format(parseISO(subtask.completed_at), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <Button
                onClick={() => onStartEdit(subtask)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onDelete(subtask.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SubtaskList: React.FC<SubtaskListProps> = ({ taskId, userId }) => {
  const { subtasks, loading, createSubtask, updateSubtask, deleteSubtask, toggleSubtaskComplete, reorderSubtasks, refetch } = useSubtasks(taskId);

  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync local state with fetched subtasks
  React.useEffect(() => {
    if (subtasks) {
      setLocalSubtasks(subtasks);
    }
  }, [subtasks]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !localSubtasks) {
      return;
    }

    const oldIndex = localSubtasks.findIndex((s) => s.id === active.id);
    const newIndex = localSubtasks.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(localSubtasks, oldIndex, newIndex);

    // Optimistic update
    setLocalSubtasks(reordered);

    // Save to backend
    try {
      const { error } = await reorderSubtasks(reordered);
      if (error) throw error;
      toast.success('Subtarefas reordenadas!');
    } catch (error: any) {
      console.error('Error reordering subtasks:', error);
      toast.error('Erro ao reordenar subtarefas');
      // Revert on error
      setLocalSubtasks(subtasks || []);
    }
  };

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      toast.error('O título da subtarefa é obrigatório');
      return;
    }

    if (!userId) {
      toast.error('Você precisa estar logado para criar subtarefas');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createSubtask({
        task_id: taskId,
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription.trim() || null,
        creator_id: userId,
        assignee_id: userId,
        status: 'Pendente',
        position: (subtasks?.length || 0),
      });

      if (error) throw error;

      toast.success('Subtarefa criada com sucesso!');
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setIsCreating(false);
      await refetch();
    } catch (error: any) {
      console.error('Error creating subtask:', error);
      toast.error('Erro ao criar subtarefa: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
    setEditDescription(subtask.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editTitle.trim()) {
      toast.error('O título da subtarefa é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updateSubtask(subtaskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });

      if (error) throw error;

      toast.success('Subtarefa atualizada com sucesso!');
      setEditingId(null);
      setEditTitle('');
      setEditDescription('');
      await refetch();
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      toast.error('Erro ao atualizar subtarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      const { error } = await toggleSubtaskComplete(subtask);
      if (error) throw error;

      const isCompleting = subtask.status !== 'Concluída';
      toast.success(isCompleting ? 'Subtarefa concluída!' : 'Subtarefa reaberta!');
      await refetch();
    } catch (error: any) {
      console.error('Error toggling subtask:', error);
      toast.error('Erro ao atualizar status da subtarefa');
    }
  };

  const handleDeleteSubtask = async () => {
    if (!deletingId) return;

    try {
      const { error } = await deleteSubtask(deletingId);
      if (error) throw error;

      toast.success('Subtarefa excluída com sucesso!');
      setDeletingId(null);
      await refetch();
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      toast.error('Erro ao excluir subtarefa');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Subtarefas ({localSubtasks?.length || 0})
        </h3>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="gradient-button-bg text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Subtarefa
          </Button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Input
                placeholder="Título da subtarefa *"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateSubtask();
                  }
                }}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newSubtaskDescription}
                onChange={(e) => setNewSubtaskDescription(e.target.value)}
                disabled={isSubmitting}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSubtask}
                  disabled={isSubmitting}
                  className="gradient-button-bg text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Criar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewSubtaskTitle('');
                    setNewSubtaskDescription('');
                  }}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtasks List with Drag and Drop */}
      {localSubtasks && localSubtasks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSubtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localSubtasks.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  isEditing={editingId === subtask.id}
                  editTitle={editTitle}
                  editDescription={editDescription}
                  isSubmitting={isSubmitting}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onToggleComplete={handleToggleComplete}
                  onDelete={setDeletingId}
                  setEditTitle={setEditTitle}
                  setEditDescription={setEditDescription}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        !isCreating && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma subtarefa criada ainda.</p>
            <p className="text-sm mt-1">
              Clique em "Nova Subtarefa" para começar.
            </p>
          </div>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Subtarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta subtarefa? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubtask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubtaskList;
