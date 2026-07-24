import React from 'react';
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
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import type { WorkTaskItem } from '@/types/hierarchy';

interface TaskListViewProps {
  tasks: readonly WorkTaskItem[];
  onTaskClick?: (task: WorkTaskItem) => void;
  onStatusChange?: (task: WorkTaskItem, status: string) => void;
  onTaskDelete?: (task: WorkTaskItem) => void;
  onTaskArchive?: (task: WorkTaskItem) => void;
  onCreateTask?: (title: string, spaceId: string, listId: string) => void;
}

export function TaskListView({ tasks, onTaskClick, onStatusChange, onTaskDelete, onTaskArchive, onCreateTask }: TaskListViewProps) {
  const TaskCard = ({ task, onTaskClick, onStatusChange, onTaskDelete, onTaskArchive }: any) => (
    <Card
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
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onTaskClick?.(task)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTaskArchive?.(task)}>
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10"
                onSelect={(e) => {
                  e.preventDefault();
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
  );

  const groupedTasks = React.useMemo(() => {
    return tasks.reduce((acc, task) => {
      const listId = task.list_id;
      if (!acc[listId]) {
        acc[listId] = {
          listName: task.context.list_name || 'Sem Lista',
          listColor: task.context.list_color,
          spaceName: task.context.space_name || 'Sem Projeto',
          spaceColor: task.context.space_color,
          workspaceName: task.context.workspace_name,
          workspaceColor: task.context.workspace_color,
          spaceId: task.context.space_id,
          listId: task.list_id,
          tasks: []
        };
      }
      acc[listId].tasks.push(task);
      return acc;
    }, {} as Record<string, { listName: string, listColor: string | null, spaceName: string, spaceColor: string | null, workspaceName: string | null | undefined, workspaceColor: string | null | undefined, spaceId: string | null, listId: string, tasks: WorkTaskItem[] }>);
  }, [tasks]);

  return (
    <div className="space-y-6" data-testid="work-list-view">
      {Object.values(groupedTasks).map((group) => (
        <div key={group.listId} className="space-y-2">
          {/* List Header */}
          <div className="flex items-center gap-2 pb-2 pl-1 border-b mb-3">
            {(group.spaceColor || group.workspaceColor) && (
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: group.spaceColor || group.workspaceColor || '#ccc' }} 
              />
            )}
            <span className="font-semibold text-lg">{group.listName}</span>
            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              em {group.spaceName} {group.workspaceName && `- ${group.workspaceName}`}
            </span>
          </div>

          {/* List Tasks */}
          {group.tasks.filter(t => t.status !== 'Concluída').map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onTaskClick={onTaskClick}
              onStatusChange={onStatusChange}
              onTaskArchive={onTaskArchive}
              onTaskDelete={onTaskDelete}
            />
          ))}

          {group.tasks.some(t => t.status === 'Concluída') && (
            <details className="mt-4 group/details">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 select-none">
                <span className="group-open/details:rotate-90 transition-transform">
                  ▶
                </span>
                Concluídas ({group.tasks.filter(t => t.status === 'Concluída').length})
              </summary>
              <div className="space-y-2 pl-4 border-l-2 ml-2 mt-2">
                {group.tasks.filter(t => t.status === 'Concluída').map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onTaskClick={onTaskClick}
                    onStatusChange={onStatusChange}
                    onTaskArchive={onTaskArchive}
                    onTaskDelete={onTaskDelete}
                  />
                ))}
              </div>
            </details>
          )}
      
      {/* Input Inline de Nova Tarefa para a Lista */}
      {onCreateTask && (
        <Card className="shadow-sm border-dashed bg-transparent hover:border-primary/30 transition-all mt-2">
          <CardContent className="flex h-14 items-center px-4 py-2 group focus-within:bg-accent/50 transition-colors">
            <Plus className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-primary shrink-0" />
            <Input 
              placeholder={`Nova Tarefa em ${group.listName} (Aperte Enter)`} 
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 px-0 text-sm font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  // We need to pass spaceId and listId if onCreateTask supports it, or handle it via WorkTasks
                  // Actually, TaskListViewProps onCreateTask currently only takes (title: string). We should update the prop!
                  onCreateTask(e.currentTarget.value.trim(), group.spaceId, group.listId);
                  e.currentTarget.value = '';
                }
              }}
            />
          </CardContent>
        </Card>
      )}
        </div>
      ))}
    </div>
  );
}
