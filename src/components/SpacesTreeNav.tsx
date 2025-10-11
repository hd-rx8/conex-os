import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SpaceTree, FolderTree, ListTree } from '@/types/hierarchy';

interface SpacesTreeNavProps {
  spaces: SpaceTree[];
  onSelectSpace?: (spaceId: string) => void;
  onSelectList?: (listId: string) => void;
  selectedSpaceId?: string;
  selectedListId?: string;
  isCollapsed?: boolean;
}

const SpacesTreeNav: React.FC<SpacesTreeNavProps> = ({
  spaces,
  onSelectSpace,
  onSelectList,
  selectedSpaceId,
  selectedListId,
  isCollapsed = false,
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

  if (isCollapsed) {
    return null; // Não mostrar em modo colapsado
  }

  return (
    <div className="space-y-1">
      {spaces.map((space) => (
        <SpaceNode
          key={space.id}
          space={space}
          isExpanded={expandedSpaces.has(space.id)}
          onToggle={() => toggleSpace(space.id)}
          onSelect={onSelectSpace}
          isSelected={selectedSpaceId === space.id}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          onSelectList={onSelectList}
          selectedListId={selectedListId}
        />
      ))}
    </div>
  );
};

interface SpaceNodeProps {
  space: SpaceTree;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: (spaceId: string) => void;
  isSelected?: boolean;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectList?: (listId: string) => void;
  selectedListId?: string;
}

const SpaceNode: React.FC<SpaceNodeProps> = ({
  space,
  isExpanded,
  onToggle,
  onSelect,
  isSelected,
  expandedFolders,
  onToggleFolder,
  onSelectList,
  selectedListId,
}) => {
  const hasContent = space.folders.length > 0 || space.lists.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="h-9 w-7 shrink-0"
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
        <Button
          variant="ghost"
          onClick={() => onSelect?.(space.id)}
          className={cn(
            'flex-1 justify-start gap-2 h-9 px-3 font-normal',
            isSelected && 'bg-accent font-medium'
          )}
        >
          <span className="text-sm">{space.icon || '📁'}</span>
          <span className="truncate text-sm">{space.name}</span>
        </Button>
      </div>

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
  selectedListId?: string;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  isExpanded,
  onToggle,
  onSelectList,
  selectedListId,
}) => {
  const hasLists = folder.lists.length > 0;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onToggle}
        className={cn(
          'w-full justify-start gap-2 h-8 px-3 font-normal',
          !hasLists && 'cursor-default'
        )}
        disabled={!hasLists}
      >
        {hasLists ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )
        ) : (
          <div className="w-3" />
        )}
        <span className="text-sm">📂</span>
        <span className="truncate text-sm">{folder.name}</span>
      </Button>

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
    <Button
      variant="ghost"
      onClick={() => onSelect?.(list.id)}
      className={cn(
        'w-full justify-start gap-2 h-8 px-3 font-normal',
        isSelected && 'bg-accent font-medium'
      )}
    >
      <div className="w-3" />
      <span className="text-sm">📋</span>
      <span className="truncate text-sm">{list.name}</span>
      {list.taskCount !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">{list.taskCount}</span>
      )}
    </Button>
  );
};

export default SpacesTreeNav;
