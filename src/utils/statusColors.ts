/**
 * Utilitário para padronizar as cores de status em todo o sistema
 * 
 * Este arquivo centraliza as definições de cores para os diferentes status de propostas,
 * garantindo consistência visual em todo o aplicativo, tanto no modo claro quanto no escuro.
 */

export type ProposalStatus = 'Criada' | 'Enviada' | 'Negociando' | 'Aprovada' | 'Rejeitada' | 'Rascunho';

/**
 * Retorna as classes Tailwind para o estilo do badge de status
 */
export const getStatusClasses = (status: ProposalStatus | string) => {
  switch (status) {
    case 'Rascunho': 
      return 'bg-purple-200/50 text-purple-700 hover:bg-purple-200/80 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800/70';
    case 'Criada': 
      return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
    case 'Enviada': 
      return 'bg-yellow-200/50 text-yellow-700 hover:bg-yellow-200/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-800/70';
    case 'Negociando': 
      return 'bg-orange-200/50 text-orange-700 hover:bg-orange-200/80 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-800/70';
    case 'Aprovada': 
      return 'bg-green-200/50 text-green-700 hover:bg-green-200/80 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/70';
    case 'Rejeitada': 
      return 'bg-red-200/50 text-red-700 hover:bg-red-200/80 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/70';
    default: 
      return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
  }
};

/**
 * Retorna as classes Tailwind para o estilo do badge de status com bordas
 */
export const getStatusBadgeClasses = (status: ProposalStatus | string) => {
  switch (status) {
    case 'Rascunho': 
      return 'bg-purple-200/50 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800';
    case 'Criada': 
      return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
    case 'Enviada': 
      return 'bg-yellow-200/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
    case 'Negociando': 
      return 'bg-orange-200/50 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800';
    case 'Aprovada': 
      return 'bg-green-200/50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
    case 'Rejeitada': 
      return 'bg-red-200/50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
    default: 
      return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
  }
};

/**
 * Retorna as classes Tailwind para o estilo do badge de status sem hover
 */
export const getStatusSimpleClasses = (status: ProposalStatus | string) => {
  switch (status) {
    case 'Rascunho': 
      return 'bg-purple-200/50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    case 'Criada': 
      return 'bg-gray-200/50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
    case 'Enviada': 
      return 'bg-yellow-200/50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Negociando': 
      return 'bg-orange-200/50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
    case 'Aprovada': 
      return 'bg-green-200/50 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    case 'Rejeitada': 
      return 'bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    default: 
      return 'bg-gray-200/50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
  }
};
