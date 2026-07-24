import React from 'react';
import { CheckCircle2, Circle, Plus, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkTaskItem } from '@/types/hierarchy';

interface TaskTableViewProps {
  tasks: readonly WorkTaskItem[];
  onTaskClick?: (task: WorkTaskItem) => void;
  onStatusChange?: (task: WorkTaskItem, status: string) => void;
  onCreateTask?: (title: string, spaceId: string, listId: string, status: string) => void;
  onTaskDelete?: (task: WorkTaskItem) => void;
  onTaskArchive?: (task: WorkTaskItem) => void;
  emptyListContext?: {
    listId: string;
    listName: string;
    spaceId: string;
    spaceName: string;
  };
}

export function TaskTableView({ tasks, onTaskClick, onStatusChange, onCreateTask, onTaskDelete, onTaskArchive, emptyListContext }: TaskTableViewProps) {
  
  // Agrupa as tarefas por Lista e depois por Status
  const groupedData = React.useMemo(() => {
    const groups: Record<string, {
      listName: string;
      spaceId: string;
      spaceName: string;
      statuses: Record<string, WorkTaskItem[]>;
    }> = {};

    tasks.forEach(task => {
      const listId = task.context.list_id;
      if (!listId) return;
      
      if (!groups[listId]) {
        groups[listId] = {
          listName: task.context.list_name || 'Geral',
          spaceId: task.context.space_id || '',
          spaceName: task.context.space_name || 'Projeto Desconhecido',
          statuses: {}
        };
      }

      const status = task.status || 'Pendente';
      if (!groups[listId].statuses[status]) {
        groups[listId].statuses[status] = [];
      }
      
      groups[listId].statuses[status].push(task);
    });

    return groups;
  }, [tasks]);

  if (tasks.length === 0) {
    if (!emptyListContext) return null;

    return (
      <div className="app-table-wrap rounded-md border" data-testid="work-table-view">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-64">Tarefa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableCell colSpan={6} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{emptyListContext.listName}</span>
                  <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    em {emptyListContext.spaceName}
                  </span>
                </div>
              </TableCell>
            </TableRow>
            {onCreateTask && (
              <TableRow className="hover:bg-muted/5 border-b-0">
                <TableCell colSpan={6} className="p-0 border-b-0">
                  <div className="flex items-center px-4 py-1 group focus-within:bg-accent/50 transition-colors">
                    <Plus className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />
                    <Input 
                      placeholder="Nova Tarefa (Aperte Enter para salvar)" 
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-9 px-0 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          onCreateTask(e.currentTarget.value.trim(), emptyListContext.spaceId, emptyListContext.listId, 'Pendente');
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div
      className="app-table-wrap rounded-md border"
      data-testid="work-table-view"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-64">Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        
        {Object.entries(groupedData).map(([listId, listData]) => (
          <React.Fragment key={listId}>
            {/* Cabeçalho da Lista */}
            <TableBody>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableCell colSpan={6} className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{listData.listName}</span>
                    <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      em {listData.spaceName}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>

            {/* Agrupamentos de Status dentro da Lista */}
            {Object.entries(listData.statuses).map(([status, statusTasks]) => (
              <TableBody key={`${listId}-${status}`}>
                {/* Cabeçalho do Status */}
                <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0">
                  <TableCell colSpan={6} className="py-2 border-b-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-widest">{status}</Badge>
                      <span className="text-muted-foreground text-xs">{statusTasks.length}</span>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Linhas das Tarefas */}
                {statusTasks.map(task => (
                  <TableRow
                    key={task.id}
                    className="h-12 cursor-pointer hover:bg-muted/30"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {onStatusChange && (
                          <button
                            type="button"
                            className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        <span className="truncate">{task.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{task.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.priority ? (
                        <Badge variant="outline" className="font-normal">{task.priority}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.assignee?.name ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                    </TableCell>
                  </TableRow>
                ))}

                {/* Input Inline de Nova Tarefa */}
                {onCreateTask && (
                  <TableRow className="hover:bg-muted/5 border-b-0">
                    <TableCell colSpan={6} className="p-0 border-b-0">
                      <div className="flex items-center px-4 py-1 group focus-within:bg-accent/50 transition-colors">
                        <Plus className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary" />
                        <Input 
                          placeholder="Nova Tarefa (Aperte Enter para salvar)" 
                          className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-9 px-0 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              onCreateTask(e.currentTarget.value.trim(), listData.spaceId, listId, status);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            ))}
          </React.Fragment>
        ))}
      </Table>
    </div>
  );
}
