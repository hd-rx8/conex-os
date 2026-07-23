import { CalendarDays, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
}: TaskBoardViewProps) {
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
            className="min-w-[280px] rounded-xl border bg-muted/25 p-3 shadow-sm"
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
                  className="group bg-background shadow-sm transition-shadow hover:shadow-md"
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
                          {task.context.space_name} / {task.context.list_name}
                        </p>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Alterar status de ${task.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {STATUSES.map((nextStatus) => (
                            <DropdownMenuItem
                              key={nextStatus.value}
                              disabled={nextStatus.value === task.status}
                              onClick={() =>
                                onStatusChange?.(task, nextStatus.value)
                              }
                            >
                              Mover para {nextStatus.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              {statusTasks.length === 0 && (
                <div className="rounded-lg border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
