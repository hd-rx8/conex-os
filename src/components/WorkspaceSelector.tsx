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
    // Versão colapsada - apenas ícone
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-lg">
          {selectedWorkspace?.icon || '🏢'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={selectedWorkspaceId} onValueChange={onSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedWorkspace?.icon || '🏢'}</span>
                <span className="truncate">{selectedWorkspace?.name || 'Selecione...'}</span>
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
            className="shrink-0"
            title="Criar Projeto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelector;
