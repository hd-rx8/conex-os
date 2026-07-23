import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SpaceTree, TaskFilters } from '@/types/hierarchy';

interface WorkTaskFiltersProps {
  value: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  projects?: readonly SpaceTree[];
}

export function WorkTaskFilters({
  value,
  onChange,
  projects = [],
}: WorkTaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Buscar tarefas</span>
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          value={value.search ?? ''}
          placeholder="Buscar tarefas…"
          className="pl-9"
          onChange={(event) =>
            onChange({ ...value, search: event.target.value || undefined })
          }
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Select
          value={value.status ?? 'all'}
          onValueChange={(status) =>
            onChange({ ...value, status: status === 'all' ? undefined : status })
          }
        >
          <SelectTrigger className="w-40" aria-label="Status">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em Progresso">Em progresso</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={value.priority ?? 'all'}
          onValueChange={(priority) =>
            onChange({
              ...value,
              priority:
                priority === 'all'
                  ? undefined
                  : (priority as TaskFilters['priority']),
            })
          }
        >
          <SelectTrigger className="w-36" aria-label="Prioridade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridades</SelectItem>
            <SelectItem value="Urgente">Urgente</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select
            value={value.space_id ?? 'all'}
            onValueChange={(spaceId) =>
              onChange({
                ...value,
                space_id: spaceId === 'all' ? undefined : spaceId,
              })
            }
          >
            <SelectTrigger className="w-44" aria-label="Projeto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
