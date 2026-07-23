import { useLocation } from 'react-router-dom';
import { useAppModule } from '@/context/AppModuleContext';

export interface FABContext {
  module: 'crm' | 'work' | 'global';
  route: string;
  projectId?: string;
  listId?: string;
  isProjectDetail: boolean;
  isListDetail: boolean;
  isTasksBoard: boolean;
}

/**
 * Hook para detectar o contexto atual da aplicação
 * Retorna informações sobre módulo ativo, rota, e contexto específico (ex: dentro de um projeto)
 */
export const useFABContext = (): FABContext => {
  const location = useLocation();
  const { activeModule } = useAppModule();

  // Detectar se está em detalhes de um projeto
  const projectDetailMatch = location.pathname.match(/^\/work\/project\/([^/]+)$/);
  const isProjectDetail = !!projectDetailMatch;
  const projectId = projectDetailMatch?.[1];

  const listDetailMatch = location.pathname.match(/^\/work\/list\/([^/]+)$/);
  const isListDetail = Boolean(listDetailMatch);
  const listId = listDetailMatch?.[1];
  const isTasksBoard = isListDetail;

  // Determinar o módulo baseado na rota
  let module: 'crm' | 'work' | 'global' = 'global';

  if (location.pathname.startsWith('/work')) {
    module = 'work';
  } else if (
    location.pathname.startsWith('/proposals') ||
    location.pathname.startsWith('/clients') ||
    location.pathname.startsWith('/pipeline') ||
    location.pathname.startsWith('/generator')
  ) {
    module = 'crm';
  } else {
    // Dashboard ou outras rotas gerais
    module = activeModule;
  }

  return {
    module,
    route: location.pathname,
    projectId,
    listId,
    isProjectDetail,
    isListDetail,
    isTasksBoard
  };
};
