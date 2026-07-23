import { Kanban, List, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkViewMode } from '../view/workViewMode';

interface WorkViewSwitcherProps {
  value: WorkViewMode;
  onChange: (view: WorkViewMode) => void;
}

const VIEW_OPTIONS = [
  { value: 'list', label: 'Lista', icon: List },
  { value: 'table', label: 'Tabela', icon: Table2 },
  { value: 'board', label: 'Kanban', icon: Kanban },
] as const;

export function WorkViewSwitcher({
  value,
  onChange,
}: WorkViewSwitcherProps) {
  return (
    <div
      className="inline-flex items-center rounded-lg border bg-muted/40 p-1"
      aria-label="Visualização das tarefas"
    >
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={selected}
            className={cn(
              'h-8 gap-2 px-3 text-xs',
              selected && 'bg-background text-foreground shadow-sm',
            )}
            onClick={() => onChange(option.value)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
