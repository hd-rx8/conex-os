import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { PageToolbar } from '@/components/layout/PageToolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ListTree, SpaceTree, TaskFilters } from '@/types/hierarchy';

interface WorkTaskFiltersProps {
  value: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  projects?: readonly SpaceTree[];
  lists?: readonly ListTree[];
}

export function WorkTaskFilters({
  value,
  onChange,
  projects = [],
  lists = [],
}: WorkTaskFiltersProps) {
  return (
    <PageToolbar>
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
        <Select
          value={value.status ?? 'all'}
          onValueChange={(status) =>
            onChange({ ...value, status: status === 'all' ? undefined : status })
          }
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="Status">
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
          <SelectTrigger className="w-full lg:w-36" aria-label="Prioridade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridades</SelectItem>
            <SelectItem value="Urgente">🔴 Urgente</SelectItem>
            <SelectItem value="Alta">🟠 Alta</SelectItem>
            <SelectItem value="Média">🟡 Média</SelectItem>
            <SelectItem value="Baixa">🟢 Baixa</SelectItem>
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
            <SelectTrigger className="w-full lg:w-44" aria-label="Projeto">
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
        {lists.length > 0 && (
          <Select
            value={value.list_id ?? 'all'}
            onValueChange={(listId) =>
              onChange({
                ...value,
                list_id: listId === 'all' ? undefined : listId,
              })
            }
          >
            <SelectTrigger className="w-full lg:w-44" aria-label="Lista">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as listas</SelectItem>
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </PageToolbar>
  );
}
