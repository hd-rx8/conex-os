import { Badge } from '@/components/ui/badge';
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
}

export function TaskTableView({ tasks, onTaskClick }: TaskTableViewProps) {
  return (
    <div
      className="overflow-x-auto rounded-xl border bg-card"
      data-testid="work-table-view"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-64">Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Lista</TableHead>
            <TableHead>Prazo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => onTaskClick?.(task)}
            >
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{task.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.priority}</Badge>
              </TableCell>
              <TableCell>{task.assignee?.name ?? 'Sem responsável'}</TableCell>
              <TableCell>{task.context.space_name}</TableCell>
              <TableCell>{task.context.list_name}</TableCell>
              <TableCell>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString('pt-BR')
                  : 'Sem prazo'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
