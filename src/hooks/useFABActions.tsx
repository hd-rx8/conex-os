import { useMemo, useState } from 'react';
import { CheckSquare, FileText, FolderPlus, UserPlus, Building2, Folder } from 'lucide-react';

import type { FABAction } from '@/components/ContextualFAB';
import {
  useCreateSpaceMutation,
  useCreateTaskMutation,
  useWorkspacesQuery,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import type { CreateSpaceData, CreateTaskData, CreateWorkspaceData, CreateWorkspaceFolderData } from '@/types/hierarchy';
import { useClients, type CreateClientData } from '@/hooks/useClients';
import { useProposals, type CreateProposalData } from '@/hooks/useProposals';
import { useSession } from '@/hooks/useSession';
import { useUsers } from '@/hooks/useUsers';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceFolders } from '@/hooks/useWorkspaceFolders';

import { useFABContext } from './useFABContext';

export const useFABActions = () => {
  const context = useFABContext();
  const { user: currentUser } = useSession();
  const { allUsers } = useUsers();
  const { clients, createClient, fetchClients } = useClients();
  const { createProposal } = useProposals();
  const { createWorkspace } = useWorkspaces();
  const { createWorkspaceFolder } = useWorkspaceFolders(undefined);

  const isWork = context.module === 'work';
  const workspacesQuery = useWorkspacesQuery(isWork);
  const activeWorkspaceId = workspacesQuery.data?.[0]?.id;
  const treeQuery = useWorkspaceTreeQuery(isWork ? activeWorkspaceId : undefined);
  const createSpaceMutation = useCreateSpaceMutation();
  const createTaskMutation = useCreateTaskMutation(context.listId);

  const selectedSpaceId = useMemo(() => {
    if (!context.listId) return context.projectId;

    for (const space of treeQuery.data?.spaces ?? []) {
      if (space.lists.some((list) => list.id === context.listId)) return space.id;
      if (
        space.folders.some((folder) =>
          folder.lists.some((list) => list.id === context.listId),
        )
      ) {
        return space.id;
      }
    }
    return undefined;
  }, [context.listId, context.projectId, treeQuery.data]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isWorkspaceFolderModalOpen, setIsWorkspaceFolderModalOpen] = useState(false);

  const handleCreateClient = async (data: CreateClientData) => {
    const result = await createClient(data);
    if (result.data) {
      setIsClientModalOpen(false);
      await fetchClients();
    }
    return result;
  };

  const handleCreateProposal = async (data: CreateProposalData) => {
    const result = await createProposal(data);
    if (result.data) setIsProposalModalOpen(false);
    return result;
  };

  const handleCreateProject = async (data: CreateSpaceData) => {
    const space = await createSpaceMutation.mutateAsync(data);
    setIsProjectModalOpen(false);
    return { data: space, error: null };
  };

  const handleCreateTask = async (data: CreateTaskData) => {
    const task = await createTaskMutation.mutateAsync(data);
    setIsTaskModalOpen(false);
    return { data: task, error: null };
  };

  const handleCreateWorkspace = async (data: CreateWorkspaceData) => {
    const result = await createWorkspace(data);
    if (!result.error) setIsWorkspaceModalOpen(false);
    return result;
  };

  const handleCreateWorkspaceFolder = async (data: CreateWorkspaceFolderData) => {
    const result = await createWorkspaceFolder(data);
    if (!result.error) setIsWorkspaceFolderModalOpen(false);
    return result;
  };

  const actions = useMemo((): FABAction[] => {
    if (context.module === 'crm') {
      return [
        {
          id: 'new-proposal',
          label: 'Nova proposta',
          icon: FileText,
          onClick: () => setIsProposalModalOpen(true),
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
        {
          id: 'new-client',
          label: 'Novo cliente',
          icon: UserPlus,
          onClick: () => setIsClientModalOpen(true),
          color: 'bg-green-600 hover:bg-green-700 text-white',
        },
      ];
    }

    if (context.module === 'work') {
      return [
        {
          id: 'new-workspace',
          label: 'Novo Workspace',
          icon: Building2,
          onClick: () => setIsWorkspaceModalOpen(true),
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        },

        {
          id: 'new-project',
          label: 'Novo Projeto',
          icon: FolderPlus,
          onClick: () => setIsProjectModalOpen(true),
          disabled: !activeWorkspaceId,
          disabledReason: 'Crie ou carregue um workspace primeiro.',
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
        {
          id: 'new-task',
          label: 'Nova tarefa',
          icon: CheckSquare,
          onClick: () => setIsTaskModalOpen(true),
          disabled: !activeWorkspaceId,
          disabledReason: 'Crie ou carregue um workspace primeiro.',
          color: 'bg-purple-600 hover:bg-purple-700 text-white',
        },
      ];
    }

    return [
      {
        id: 'new-proposal',
        label: 'Nova proposta',
        icon: FileText,
        onClick: () => setIsProposalModalOpen(true),
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
      },
    ];
  }, [activeWorkspaceId, context.listId, context.module, selectedSpaceId]);

  return {
    actions,
    modals: {
      client: {
        isOpen: isClientModalOpen,
        setIsOpen: setIsClientModalOpen,
        onSubmit: handleCreateClient,
      },
      proposal: {
        isOpen: isProposalModalOpen,
        setIsOpen: setIsProposalModalOpen,
        onSubmit: handleCreateProposal,
      },
      project: {
        isOpen: isProjectModalOpen,
        setIsOpen: setIsProjectModalOpen,
        onSubmit: handleCreateProject,
        workspaceId: activeWorkspaceId,
      },
      task: {
        isOpen: isTaskModalOpen,
        setIsOpen: setIsTaskModalOpen,
        onSubmit: handleCreateTask,
        workspaceId: activeWorkspaceId,
        spaceId: selectedSpaceId,
        listId: context.listId,
      },
      workspace: {
        isOpen: isWorkspaceModalOpen,
        setIsOpen: setIsWorkspaceModalOpen,
        onSubmit: handleCreateWorkspace,
      },
      workspaceFolder: {
        isOpen: isWorkspaceFolderModalOpen,
        setIsOpen: setIsWorkspaceFolderModalOpen,
        onSubmit: handleCreateWorkspaceFolder,
        workspaceId: activeWorkspaceId,
      },
    },
    context,
    data: {
      currentUser,
      allUsers,
      clients,
      workspaceFolders: treeQuery.data?.workspace_folders || [],
    },
  };
};
