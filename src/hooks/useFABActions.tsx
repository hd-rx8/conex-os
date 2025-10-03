import { useMemo, useState } from 'react';
import { FileText, UserPlus, FolderPlus, CheckSquare } from 'lucide-react';
import { FABAction } from '@/components/ContextualFAB';
import { useFABContext } from './useFABContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClients, CreateClientData } from '@/hooks/useClients';
import { useProposals, CreateProposalData } from '@/hooks/useProposals';
import useProjects, { CreateProjectData } from '@/hooks/useProjects';
import useTasks from '@/hooks/useTasks';
import { useSession } from '@/hooks/useSession';
import { useUsers } from '@/hooks/useUsers';
import { useActiveProject } from '@/context/ActiveProjectContext';

/**
 * Hook para gerenciar ações contextuais do FAB
 * Retorna as ações disponíveis baseado no contexto atual e handlers para modais
 */
export const useFABActions = () => {
  const context = useFABContext();
  const { user: currentUser } = useSession();
  const { allUsers } = useUsers();
  const { clients, createClient, fetchClients } = useClients();
  const { createProposal } = useProposals();
  const { createProject, refetch: refetchProjects } = useProjects();
  const { createTask, refetch: refetchTasks } = useTasks();
  const { activeProjectId } = useActiveProject();

  // Estados para controle de modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Handlers para criação
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
    if (result.data) {
      setIsProposalModalOpen(false);
    }
    return result;
  };

  const handleCreateProject = async (data: CreateProjectData) => {
    const result = await createProject(data);
    if (result.error) {
      throw result.error;
    }
    await refetchProjects();
    setIsProjectModalOpen(false);
    return result;
  };

  const handleCreateTask = async (taskData: any) => {
    const result = await createTask(taskData);
    if (result.error) {
      throw result.error;
    }
    await refetchTasks();
    setIsTaskModalOpen(false);
    return result;
  };

  // Definir ações baseado no contexto
  const actions = useMemo((): FABAction[] => {
    const actionsArray: FABAction[] = [];

    if (context.module === 'crm') {
      // Ações do módulo CRM
      actionsArray.push({
        id: 'new-proposal',
        label: 'Nova Proposta',
        icon: FileText,
        onClick: () => setIsProposalModalOpen(true),
        color: 'bg-blue-600 hover:bg-blue-700 text-white'
      });

      actionsArray.push({
        id: 'new-client',
        label: 'Novo Cliente',
        icon: UserPlus,
        onClick: () => setIsClientModalOpen(true),
        color: 'bg-green-600 hover:bg-green-700 text-white'
      });
    } else if (context.module === 'work') {
      // Ações do módulo Work Management

      // Se está no contexto de um projeto específico, prioriza criar tarefa
      if (context.isProjectDetail && context.projectId) {
        actionsArray.push({
          id: 'new-task',
          label: 'Nova Tarefa',
          icon: CheckSquare,
          onClick: () => setIsTaskModalOpen(true),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        });
      }

      // Sempre permite criar novo projeto
      actionsArray.push({
        id: 'new-project',
        label: 'Novo Projeto',
        icon: FolderPlus,
        onClick: () => setIsProjectModalOpen(true),
        color: 'bg-blue-600 hover:bg-blue-700 text-white'
      });

      // Se não está em projeto específico, permite criar tarefa (selecionando projeto)
      if (!context.isProjectDetail) {
        actionsArray.push({
          id: 'new-task',
          label: 'Nova Tarefa',
          icon: CheckSquare,
          onClick: () => setIsTaskModalOpen(true),
          color: 'bg-purple-600 hover:bg-purple-700 text-white'
        });
      }
    } else {
      // Contexto global - mostra opções mais comuns
      actionsArray.push({
        id: 'new-proposal',
        label: 'Nova Proposta',
        icon: FileText,
        onClick: () => setIsProposalModalOpen(true),
        color: 'bg-blue-600 hover:bg-blue-700 text-white'
      });

      actionsArray.push({
        id: 'new-project',
        label: 'Novo Projeto',
        icon: FolderPlus,
        onClick: () => setIsProjectModalOpen(true),
        color: 'bg-green-600 hover:bg-green-700 text-white'
      });
    }

    return actionsArray;
  }, [context]);

  return {
    actions,
    modals: {
      client: {
        isOpen: isClientModalOpen,
        setIsOpen: setIsClientModalOpen,
        onSubmit: handleCreateClient
      },
      proposal: {
        isOpen: isProposalModalOpen,
        setIsOpen: setIsProposalModalOpen,
        onSubmit: handleCreateProposal
      },
      project: {
        isOpen: isProjectModalOpen,
        setIsOpen: setIsProjectModalOpen,
        onSubmit: handleCreateProject
      },
      task: {
        isOpen: isTaskModalOpen,
        setIsOpen: setIsTaskModalOpen,
        onSubmit: handleCreateTask,
        // Use activeProjectId from context if in detail view, otherwise use dropdown selection
        projectId: context.projectId || activeProjectId || undefined
      }
    },
    context,
    data: {
      currentUser,
      allUsers,
      clients
    }
  };
};
