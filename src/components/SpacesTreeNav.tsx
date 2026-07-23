import React, { useState } from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SpaceTree, FolderTree, ListTree, WorkspaceFolderTree } from '@/types/hierarchy';
import { useWorkContext } from '@/features/work/context/workContextState';
import { useWorkspaceFolders } from '@/hooks/useWorkspaceFolders';
import { useSpaces } from '@/hooks/useSpaces';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface SpacesTreeNavProps {
  spaces: SpaceTree[];
  workspaceFolders?: WorkspaceFolderTree[];
  onSelectSpace?: (spaceId: string) => void;
  onSelectList?: (listId: string) => void;
  selectedSpaceId?: string;
  selectedListId?: string;
  isCollapsed?: boolean;
}

const SpacesTreeNav: React.FC<SpacesTreeNavProps> = ({
  spaces,
  workspaceFolders = [],
  onSelectSpace,
  onSelectList,
  selectedSpaceId,
  selectedListId,
  isCollapsed = false,
}) => {
  const [expandedWorkspaceFolders, setExpandedWorkspaceFolders] = useState<Set<string>>(new Set());
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { selectedWorkspaceId } = useWorkContext();
  const { deleteWorkspaceFolder } = useWorkspaceFolders();
  const { deleteSpace } = useSpaces(selectedWorkspaceId || undefined);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleWorkspaceFolder = (folderId: string) => {
    setExpandedWorkspaceFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

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

  const handleDeleteFolder = async (id: string) => {
    const { error } = await deleteWorkspaceFolder(id);
    if (error) {
      toast.error('Erro ao excluir a pasta.');
    } else {
      toast.success('Pasta excluída com sucesso.');
    }
  };

  const handleDeleteSpace = async (id: string) => {
    const { error } = await deleteSpace(id);
    if (error) {
      toast.error('Erro ao excluir o projeto.');
    } else {
      toast.success('Projeto excluído com sucesso.');
      // Se o usuário estiver na página do projeto excluído, redirecionar
      if (location.pathname.includes(`/work/project/${id}`) || location.pathname.includes(`/work/list/`) && selectedSpaceId === id) {
        navigate('/work');
      }
    }
  };

  if (isCollapsed) {
    return null; // Não mostrar em modo colapsado
  }

  return (
    <div className="w-full min-w-0 space-y-1 overflow-hidden">
      {workspaceFolders.map((folder) => (
        <WorkspaceFolderNode
          key={folder.id}
          folder={folder}
          isExpanded={expandedWorkspaceFolders.has(folder.id)}
          onToggle={() => toggleWorkspaceFolder(folder.id)}
          onSelectSpace={onSelectSpace}
          selectedSpaceId={selectedSpaceId}
          expandedSpaces={expandedSpaces}
          onToggleSpace={toggleSpace}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          onSelectList={onSelectList}
          selectedListId={selectedListId}
          onDeleteFolder={() => handleDeleteFolder(folder.id)}
          onDeleteSpace={handleDeleteSpace}
        />
      ))}
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
          onDeleteSpace={() => handleDeleteSpace(space.id)}
        />
      ))}
    </div>
  );
};

interface WorkspaceFolderNodeProps {
  folder: WorkspaceFolderTree;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectSpace?: (spaceId: string) => void;
  selectedSpaceId?: string;
  expandedSpaces: Set<string>;
  onToggleSpace: (spaceId: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectList?: (listId: string) => void;
  selectedListId?: string;
  onDeleteFolder: () => Promise<void>;
  onDeleteSpace: (spaceId: string) => Promise<void>;
}

const WorkspaceFolderNode: React.FC<WorkspaceFolderNodeProps> = ({
  folder,
  isExpanded,
  onToggle,
  onSelectSpace,
  selectedSpaceId,
  expandedSpaces,
  onToggleSpace,
  expandedFolders,
  onToggleFolder,
  onSelectList,
  selectedListId,
  onDeleteFolder,
  onDeleteSpace,
}) => {
  const hasSpaces = folder.spaces.length > 0;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDeleteFolder();
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="w-full min-w-0">
      <div className="group flex w-full min-w-0 items-center pr-1">
        <Button
          variant="ghost"
          onClick={onToggle}
          title={folder.name}
          className={cn(
            'h-8 flex-1 min-w-0 justify-start gap-2 px-3 font-semibold text-foreground/80',
            !hasSpaces && 'cursor-default'
          )}
          disabled={!hasSpaces}
        >
          {hasSpaces ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )
          ) : (
            <div className="w-3" />
          )}
          <span className="shrink-0 text-sm">{folder.icon || '📁'}</span>
          <span className="min-w-0 flex-1 truncate text-left text-sm" style={{ color: folder.color || undefined }}>
            {folder.name}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pasta <strong>{folder.name}</strong>?
              Os projetos contidos nesta pasta serão mantidos e movidos para a raiz do workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Excluindo...' : 'Excluir Pasta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isExpanded && hasSpaces && (
        <div className="ml-2 min-w-0 space-y-1 overflow-hidden mt-1 border-l pl-2 border-border/50">
          {folder.spaces.map((space) => (
            <SpaceNode
              key={space.id}
              space={space}
              isExpanded={expandedSpaces.has(space.id)}
              onToggle={() => onToggleSpace(space.id)}
              onSelect={onSelectSpace}
              isSelected={selectedSpaceId === space.id}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectList={onSelectList}
              selectedListId={selectedListId}
              onDeleteSpace={() => onDeleteSpace(space.id)}
            />
          ))}
        </div>
      )}
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
  onDeleteSpace: () => Promise<void>;
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
  onDeleteSpace,
}) => {
  const hasContent = space.folders.length > 0 || space.lists.length > 0;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDeleteSpace();
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="w-full min-w-0">
      <div className="group flex w-full min-w-0 items-center pr-1">
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
          title={space.name}
          className={cn(
            'h-9 w-0 min-w-0 flex-1 justify-start gap-2 px-1 font-normal',
            isSelected && 'bg-accent font-medium'
          )}
        >
          <span className="shrink-0 text-sm">{space.icon || '📁'}</span>
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            {space.name}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto <strong>{space.name}</strong>?
              Esta ação é permanente e excluirá todas as listas, pastas e tarefas contidas nele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Excluindo...' : 'Excluir Projeto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isExpanded && hasContent && (
        <div className="ml-4 min-w-0 space-y-1 overflow-hidden mt-1">
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
    <div className="w-full min-w-0">
      <Button
        variant="ghost"
        onClick={onToggle}
        title={folder.name}
        className={cn(
          'h-8 w-full min-w-0 justify-start gap-2 px-3 font-normal',
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
        <span className="shrink-0 text-sm">📂</span>
        <span className="min-w-0 flex-1 truncate text-left text-sm">
          {folder.name}
        </span>
      </Button>

      {isExpanded && hasLists && (
        <div className="ml-4 min-w-0 space-y-1 overflow-hidden mt-1">
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
      title={list.name}
      className={cn(
        'h-8 w-full min-w-0 justify-start gap-2 px-3 font-normal',
        isSelected && 'bg-accent font-medium'
      )}
    >
      <div className="w-3 shrink-0" />
      <span className="shrink-0 text-sm">📋</span>
      <span className="min-w-0 flex-1 truncate text-left text-sm">
        {list.name}
      </span>
      {list.taskCount !== undefined && (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {list.taskCount}
        </span>
      )}
    </Button>
  );
};

export default SpacesTreeNav;
