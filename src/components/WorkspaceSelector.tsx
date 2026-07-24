import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Workspace } from '@/types/hierarchy';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspaceId?: string;
  onSelect: (workspaceId: string) => void;
  onCreateProject?: () => void;
  isCollapsed?: boolean;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  selectedWorkspaceId,
  onSelect,
  onCreateProject,
  isCollapsed = false,
}) => {
  const isAllWorkspaces = selectedWorkspaceId === 'all';
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  const displayWorkspace = isAllWorkspaces
    ? { name: 'Visão Geral', icon: '🌐' }
    : selectedWorkspace;

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div
          role="img"
          aria-label={`Workspace atual: ${displayWorkspace?.name || 'Não selecionado'}`}
          title={displayWorkspace?.name}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-base"
        >
          {displayWorkspace?.icon || '🏢'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div
        data-testid="workspace-selector-row"
        className="flex w-full min-w-0 items-center gap-2"
      >
        <Select value={selectedWorkspaceId} onValueChange={onSelect}>
          <SelectTrigger
            className="w-0 min-w-0 flex-1"
            aria-label="Selecionar workspace"
          >
            <SelectValue>
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-base">
                  {displayWorkspace?.icon || '🏢'}
                </span>
                <span className="min-w-0 truncate" title={displayWorkspace?.name}>
                  {displayWorkspace?.name || 'Selecione...'}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span className="truncate">Visão Geral</span>
              </div>
            </SelectItem>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{ws.icon || '🏢'}</span>
                  <span className="truncate">{ws.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onCreateProject && (
          <Button
            variant="outline"
            size="icon"
            onClick={onCreateProject}
            className="h-10 w-10 shrink-0"
            aria-label="Criar projeto"
            title="Criar projeto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelector;
