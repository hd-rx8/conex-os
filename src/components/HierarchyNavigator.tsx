import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, List, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkspaceTree, SpaceTree, FolderTree, ListTree } from '@/types/hierarchy';

interface HierarchyNavigatorProps {
  workspace: WorkspaceTree;
  onSelectList?: (listId: string) => void;
  onCreateSpace?: (workspaceId: string) => void;
  onCreateFolder?: (spaceId: string) => void;
  onCreateList?: (spaceId: string, folderId?: string) => void;
  selectedListId?: string;
}

export const HierarchyNavigator: React.FC<HierarchyNavigatorProps> = ({
  workspace,
  onSelectList,
  onCreateSpace,
  onCreateFolder,
  onCreateList,
  selectedListId,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1 p-2">
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{workspace.icon || '🏢'}</span>
          <span className="font-semibold text-sm">{workspace.name}</span>
        </div>
        {onCreateSpace && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onCreateSpace(workspace.id)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Spaces */}
      <div className="ml-2 space-y-1">
        {workspace.spaces.map((space) => (
          <SpaceNode
            key={space.id}
            space={space}
            isExpanded={expandedSpaces.has(space.id)}
            onToggle={() => toggleSpace(space.id)}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onSelectList={onSelectList}
            onCreateFolder={onCreateFolder}
            onCreateList={onCreateList}
            selectedListId={selectedListId}
          />
        ))}
      </div>
    </div>
  );
};

interface SpaceNodeProps {
  space: SpaceTree;
  isExpanded: boolean;
  onToggle: () => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectList?: (listId: string) => void;
  onCreateFolder?: (spaceId: string) => void;
  onCreateList?: (spaceId: string, folderId?: string) => void;
  selectedListId?: string;
}

const SpaceNode: React.FC<SpaceNodeProps> = ({
  space,
  isExpanded,
  onToggle,
  expandedFolders,
  onToggleFolder,
  onSelectList,
  onCreateFolder,
  onCreateList,
  selectedListId,
}) => {
  const hasContent = space.folders.length > 0 || space.lists.length > 0;

  return (
    <div>
      {/* Space Header */}
      <div className="flex items-center gap-1 group hover:bg-accent/50 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggle}
          disabled={!hasContent}
        >
          {hasContent ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="w-3" />
          )}
        </Button>
        <div className="flex items-center gap-2 flex-1 py-1">
          <span className="text-sm">{space.icon || '📁'}</span>
          <span className="text-sm font-medium">{space.name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onCreateFolder && (
              <DropdownMenuItem onClick={() => onCreateFolder(space.id)}>
                <Folder className="h-4 w-4 mr-2" />
                Nova Pasta
              </DropdownMenuItem>
            )}
            {onCreateList && (
              <DropdownMenuItem onClick={() => onCreateList(space.id)}>
                <List className="h-4 w-4 mr-2" />
                Nova Lista
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Space Content */}
      {isExpanded && hasContent && (
        <div className="ml-4 space-y-1 mt-1">
          {/* Folders */}
          {space.folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={() => onToggleFolder(folder.id)}
              onSelectList={onSelectList}
              onCreateList={onCreateList}
              selectedListId={selectedListId}
            />
          ))}

          {/* Lists diretas (sem folder) */}
          {space.lists.map((list) => (
            <ListNode
              key={list.id}
              list={list}
              onSelect={onSelectList}
              isSelected={selectedListId === list.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FolderNodeProps {
  folder: FolderTree;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectList?: (listId: string) => void;
  onCreateList?: (spaceId: string, folderId?: string) => void;
  selectedListId?: string;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  isExpanded,
  onToggle,
  onSelectList,
  onCreateList,
  selectedListId,
}) => {
  const hasLists = folder.lists.length > 0;

  return (
    <div>
      {/* Folder Header */}
      <div className="flex items-center gap-1 group hover:bg-accent/50 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggle}
          disabled={!hasLists}
        >
          {hasLists ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="w-3" />
          )}
        </Button>
        <div className="flex items-center gap-2 flex-1 py-1">
          <Folder className="h-3 w-3" style={{ color: folder.color || undefined }} />
          <span className="text-sm">{folder.name}</span>
        </div>
        {onCreateList && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => onCreateList(folder.space_id, folder.id)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Folder Content */}
      {isExpanded && hasLists && (
        <div className="ml-4 space-y-1 mt-1">
          {folder.lists.map((list) => (
            <ListNode
              key={list.id}
              list={list}
              onSelect={onSelectList}
              isSelected={selectedListId === list.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ListNodeProps {
  list: ListTree;
  onSelect?: (listId: string) => void;
  isSelected?: boolean;
}

const ListNode: React.FC<ListNodeProps> = ({ list, onSelect, isSelected }) => {
  return (
    <button
      onClick={() => onSelect?.(list.id)}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent/70 transition-colors',
        isSelected && 'bg-accent font-medium'
      )}
    >
      <List className="h-3 w-3" style={{ color: list.color || undefined }} />
      <span className="truncate">{list.name}</span>
      {list.taskCount !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">{list.taskCount}</span>
      )}
    </button>
  );
};

export default HierarchyNavigator;
