import React from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ViewType = 'kanban' | 'list' | 'table';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

const views = [
  {
    id: 'kanban' as ViewType,
    label: 'Kanban',
    icon: LayoutGrid,
    description: 'Visualização em quadro'
  },
  {
    id: 'list' as ViewType,
    label: 'Lista',
    icon: List,
    description: 'Visualização em cards'
  },
  {
    id: 'table' as ViewType,
    label: 'Tabela',
    icon: Table2,
    description: 'Visualização compacta'
  }
];

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className
}) => {
  const currentViewData = views.find(v => v.id === currentView);
  const CurrentIcon = currentViewData?.icon || LayoutGrid;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop: Icon buttons */}
      <div className="hidden sm:flex items-center gap-1 border rounded-md p-1">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <Button
              key={view.id}
              variant={currentView === view.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(view.id)}
              className={cn(
                "h-8 w-8 p-0",
                currentView === view.id && "shadow-sm"
              )}
              title={view.description}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      {/* Mobile: Dropdown */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CurrentIcon className="h-4 w-4" />
              <span className="text-sm">{currentViewData?.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{view.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {view.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ViewSwitcher;
