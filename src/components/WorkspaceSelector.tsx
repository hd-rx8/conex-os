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
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div
          role="img"
          aria-label={`Workspace atual: ${selectedWorkspace?.name || 'Não selecionado'}`}
          title={selectedWorkspace?.name}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-base"
        >
          {selectedWorkspace?.icon || '🏢'}
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
                  {selectedWorkspace?.icon || '🏢'}
                </span>
                <span className="min-w-0 truncate" title={selectedWorkspace?.name}>
                  {selectedWorkspace?.name || 'Selecione...'}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{workspace.icon || '🏢'}</span>
                  <span>{workspace.name}</span>
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
