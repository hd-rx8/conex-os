import { useState } from 'react';
import { CalendarDays, MoreHorizontal, CheckCircle2, Circle, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { WorkTaskItem } from '@/types/hierarchy';

interface TaskBoardViewProps {
  tasks: readonly WorkTaskItem[];
  onTaskClick?: (task: WorkTaskItem) => void;
  onStatusChange?: (task: WorkTaskItem, status: string) => void;
  onTaskDelete?: (task: WorkTaskItem) => void;
  onTaskArchive?: (task: WorkTaskItem) => void;
  onCreateTask?: (title: string, status: string) => void;
}

const STATUSES = [
  { value: 'Pendente', label: 'Pendente', accent: 'bg-amber-500' },
  { value: 'Em Progresso', label: 'Em progresso', accent: 'bg-blue-500' },
  { value: 'Concluída', label: 'Concluída', accent: 'bg-emerald-500' },
] as const;

export function TaskBoardView({
  tasks,
  onTaskClick,
  onStatusChange,
  onTaskDelete,
  onTaskArchive,
  onCreateTask,
}: TaskBoardViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDraggingTaskId(null);
    
    if (id && onStatusChange) {
      const task = tasks.find(t => t.id === id);
      if (task && task.status !== newStatus) {
        onStatusChange(task, newStatus);
      }
    }
  };

  return (
    <div
      className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3 lg:grid-flow-row lg:grid-cols-3"
      data-testid="work-board-view"
    >
      {STATUSES.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status.value);
        return (
          <section
            key={status.value}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.value)}
            className={cn(
              "min-w-[280px] rounded-xl border bg-muted/25 p-3 shadow-sm",
              draggingTaskId && "border-dashed border-primary"
            )}
            aria-labelledby={`work-column-${status.value}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id={`work-column-${status.value}`}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span className={cn('h-2 w-2 rounded-full', status.accent)} />
                {status.label}
              </h2>
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={cn(
                    "group bg-background shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing",
                    draggingTaskId === task.id && "opacity-50"
                  )}
                >
                  <CardContent className="space-y-3 p-3">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onTaskClick?.(task)}
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {task.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {task.context.space_name ?? 'Sem projeto'} / {task.context.list_name}
                        </p>
                      </button>
                      <div className="flex flex-col items-center gap-1">
                        {onStatusChange && (
                          <button
                            type="button"
                            className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(task, task.status === 'Concluída' ? 'Pendente' : 'Concluída');
                            }}
                            title={task.status === 'Concluída' ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                          >
                            {task.status === 'Concluída' ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Ações da tarefa ${task.title}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onTaskClick?.(task)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onTaskArchive?.(task)}
                            >
                              Arquivar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
                                  onTaskDelete?.(task);
                                }
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{task.priority}</Badge>
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {statusTasks.length === 0 && !onCreateTask && (
                <div className="rounded-lg border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa
                </div>
              )}
              {onCreateTask && (
                <div className="mt-2 flex items-center px-3 py-1 group focus-within:bg-accent/50 transition-colors rounded-md border border-transparent focus-within:border-border">
                  <Plus className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary shrink-0" />
                  <Input 
                    placeholder="Nova Tarefa..." 
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 px-0 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        onCreateTask(e.currentTarget.value.trim(), status.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
