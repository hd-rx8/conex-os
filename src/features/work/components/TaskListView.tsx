import { CalendarDays, CircleUserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { WorkTaskItem } from '@/types/hierarchy';

interface TaskListViewProps {
  tasks: readonly WorkTaskItem[];
  onTaskClick?: (task: WorkTaskItem) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  return (
    <div className="space-y-2" data-testid="work-list-view">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="transition-colors hover:border-primary/30 hover:bg-muted/20"
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onTaskClick?.(task)}
            >
              <p className="truncate font-medium">{task.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {task.context.space_name}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
