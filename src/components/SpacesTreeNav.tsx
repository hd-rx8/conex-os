import React, { useState } from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal, Trash2, Pencil, Plus } from 'lucide-react';
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
import { useSpaces, useFolders, useLists } from '@/hooks/useSpaces';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import CreateListModal from '@/components/modals/CreateListModal';
import RenameModal from '@/components/modals/RenameModal';

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

  const { selectedWorkspaceId } = useWorkContext();
  const { deleteWorkspaceFolder } = useWorkspaceFolders();
  const { deleteSpace, updateSpace } = useSpaces(selectedWorkspaceId || undefined);
  const { deleteFolder, updateFolder } = useFolders(); // Pode ser chamado sem spaceId para usar as mutações
  const { deleteList, updateList, createList } = useLists();
  const navigate = useNavigate();
  const location = useLocation();

  const [renameData, setRenameData] = useState<{ isOpen: boolean; id: string; oldName: string; type: 'space' | 'folder' | 'list' }>({ isOpen: false, id: '', oldName: '', type: 'space' });
  const [createListData, setCreateListData] = useState<{ isOpen: boolean; spaceId: string; folderId?: string | null }>({ isOpen: false, spaceId: '' });


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



  const handleDeleteSpace = async (id: string) => {
    const { error } = await deleteSpace(id);
    if (error) {
      toast.error('Erro ao excluir o projeto.');
    } else {
      toast.success('Projeto excluído com sucesso.');
      if (location.pathname.includes(`/work/project/${id}`) || location.pathname.includes(`/work/list/`) && selectedSpaceId === id) {
        navigate('/work');
      }
    }
  };

  const handleRename = async (newName: string) => {
    const { id, type } = renameData;
    let error;
    if (type === 'space') {
      const res = await updateSpace(id, { name: newName });
      error = res.error;
    } else if (type === 'folder') {
      const res = await updateFolder(id, { name: newName });
      error = res.error;
    } else {
      const res = await updateList(id, { name: newName });
      error = res.error;
    }

    if (error) {
      toast.error(`Erro ao renomear ${type === 'space' ? 'o projeto' : type === 'folder' ? 'a pasta' : 'a lista'}.`);
    } else {
      toast.success(`${type === 'space' ? 'Projeto' : type === 'folder' ? 'Pasta' : 'Lista'} renomead${type === 'space' ? 'o' : 'a'}.`);
    }
  };

  const handleCreateList = async (data: { space_id: string; folder_id: string | null; name: string; description: string | null }) => {
    const { error } = await createList(data);
    if (error) {
      console.error(error);
      toast.error(`Erro ao criar a lista: ${error.message || error}`);
    }
    else {
      toast.success('Lista criada.');
      setCreateListData({ ...createListData, isOpen: false });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const { error } = await deleteFolder(id);
    if (error) {
      toast.error('Erro ao excluir a pasta.');
    } else {
      toast.success('Pasta excluída com sucesso.');
    }
  };



  const handleDeleteList = async (id: string) => {
    const { error } = await deleteList(id);
    if (error) {
      toast.error('Erro ao excluir a lista.');
    } else {
      toast.success('Lista excluída com sucesso.');
      if (location.pathname.includes(`/work/list/${id}`)) {
        navigate('/work');
      }
    }
  };



  if (isCollapsed) {
    return null; // Não mostrar em modo colapsado
  }

  return (
    <div className={cn('flex flex-col gap-1', isCollapsed && 'items-center')}>
      {/* Root Spaces */}
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
          onRenameSpace={() => setRenameData({ isOpen: true, id: space.id, oldName: space.name, type: 'space' })}
          onCreateList={() => setCreateListData({ isOpen: true, spaceId: space.id, folderId: null })}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={(id, oldName) => setRenameData({ isOpen: true, id, oldName, type: 'folder' })}
          onCreateListFolder={(folderId) => setCreateListData({ isOpen: true, spaceId: space.id, folderId })}
          onDeleteList={handleDeleteList}
          onRenameList={(id, oldName) => setRenameData({ isOpen: true, id, oldName, type: 'list' })}
        />
      ))}

      {renameData.isOpen && (
        <RenameModal
          isOpen={renameData.isOpen}
          onClose={() => setRenameData({ ...renameData, isOpen: false })}
          title={`Renomear ${renameData.type === 'space' ? 'Projeto' : renameData.type === 'folder' ? 'Pasta' : 'Lista'}`}
          label="Novo Nome"
          initialName={renameData.oldName}
          onRename={handleRename}
        />
      )}

      {createListData.isOpen && (
        <CreateListModal
          isOpen={createListData.isOpen}
          onClose={() => setCreateListData({ ...createListData, isOpen: false })}
          spaceId={createListData.spaceId}
          folderId={createListData.folderId}
          onCreateList={handleCreateList}
        />
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
  onRenameSpace: () => Promise<void>;
  onCreateList: () => void;
  onDeleteFolder: (id: string) => Promise<void>;
  onRenameFolder: (id: string, oldName: string) => void;
  onCreateListFolder: (folderId: string) => void;
  onDeleteList: (id: string) => Promise<void>;
  onRenameList: (id: string, oldName: string) => void;
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
  onRenameSpace,
  onCreateList,
  onDeleteFolder,
  onRenameFolder,
  onCreateListFolder,
  onDeleteList,
  onRenameList,
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
            <DropdownMenuItem onClick={onCreateList}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRenameSpace}>
              <Pencil className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
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
              onDelete={() => onDeleteFolder(folder.id)}
              onRename={() => onRenameFolder(folder.id, folder.name)}
              onCreateList={() => onCreateListFolder(folder.id)}
              onDeleteList={onDeleteList}
              onRenameList={onRenameList}
            />
          ))}

          {/* Lists diretas (sem folder) */}
          {space.lists.map((list) => (
            <ListNode
              key={list.id}
              list={list}
              onSelect={onSelectList}
              isSelected={selectedListId === list.id}
              onDelete={() => onDeleteList(list.id)}
              onRename={() => onRenameList(list.id, list.name)}
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
  onDelete: () => Promise<void>;
  onRename: () => void;
  onCreateList: () => void;
  onDeleteList: (id: string) => Promise<void>;
  onRenameList: (id: string, oldName: string) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  isExpanded,
  onToggle,
  onSelectList,
  selectedListId,
  onDelete,
  onRename,
  onCreateList,
  onDeleteList,
  onRenameList,
}) => {
  const hasLists = folder.lists.length > 0;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete();
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateList}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
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
              Esta ação excluirá permanentemente a pasta e todas as suas listas.
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

      {isExpanded && hasLists && (
        <div className="ml-4 min-w-0 space-y-1 overflow-hidden mt-1">
          {folder.lists.map((list) => (
            <ListNode
              key={list.id}
              list={list}
              onSelect={onSelectList}
              isSelected={selectedListId === list.id}
              onDelete={() => onDeleteList(list.id)}
              onRename={() => onRenameList(list.id, list.name)}
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
  onDelete: () => Promise<void>;
  onRename: () => Promise<void>;
}

const ListNode: React.FC<ListNodeProps> = ({ list, onSelect, isSelected, onDelete, onRename }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="group flex w-full min-w-0 items-center pr-1">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lista</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a lista <strong>{list.name}</strong>?
              Esta ação excluirá permanentemente a lista e todas as tarefas que nela estão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Excluindo...' : 'Excluir Lista'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SpacesTreeNav;
