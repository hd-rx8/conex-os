import { CalendarDays, CircleUserRound, CheckCircle2, Circle, MoreHorizontal, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkTaskItem } from '@/types/hierarchy';

interface TaskListViewProps {
  tasks: readonly WorkTaskItem[];
  onTaskClick?: (task: WorkTaskItem) => void;
  onStatusChange?: (task: WorkTaskItem, status: string) => void;
  onTaskDelete?: (task: WorkTaskItem) => void;
  onTaskArchive?: (task: WorkTaskItem) => void;
  onCreateTask?: (title: string) => void;
}

export function TaskListView({ tasks, onTaskClick, onStatusChange, onTaskDelete, onTaskArchive, onCreateTask }: TaskListViewProps) {
  return (
    <div className="space-y-2" data-testid="work-list-view">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="shadow-sm transition-all hover:border-primary/30 hover:bg-muted/20 hover:shadow-md"
        >
          <CardContent className="flex min-h-20 flex-col gap-3 p-4 sm:flex-row sm:items-center">
            {onStatusChange && (
              <button
                type="button"
                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task, task.status === 'Concluída' ? 'Pendente' : 'Concluída');
                }}
              >
                {task.status === 'Concluída' ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onTaskClick?.(task)}
            >
              <p className="truncate font-medium">{task.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {task.context.space_name ?? 'Sem projeto'}
                <span aria-hidden="true"> / </span>
                {task.context.list_name}
              </p>
            </button>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{task.priority}</Badge>
              <Badge variant="secondary">{task.status}</Badge>
              {task.assignee && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <CircleUserRound className="h-3.5 w-3.5" />
                  {task.assignee.name}
                </span>
              )}
              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                </span>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-2"
                    aria-label={`Ações da tarefa ${task.title}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onTaskClick?.(task)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTaskArchive?.(task)}>
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
          </CardContent>
        </Card>
      ))}
      
      {/* Input Inline de Nova Tarefa */}
      {onCreateTask && (
        <Card className="shadow-sm border-dashed bg-transparent hover:border-primary/30 transition-all">
          <CardContent className="flex h-16 items-center px-4 py-2 group focus-within:bg-accent/50 transition-colors">
            <Plus className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-primary shrink-0" />
            <Input 
              placeholder="Nova Tarefa (Aperte Enter para salvar)" 
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 px-0 text-sm font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  onCreateTask(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
