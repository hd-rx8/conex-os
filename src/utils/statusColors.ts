import type { ProposalStatus as LegacyProposalStatus } from '@/features/crm/proposals/proposalStatus';

/**
 * Utilitário para padronizar as cores de status em todo o sistema
 * 
 * Este arquivo centraliza as definições de cores para os diferentes status de propostas,
 * garantindo consistência visual em todo o aplicativo, tanto no modo claro quanto no escuro.
 */

export type PipelineProposalStatus =
  | 'QUALIFICACAO'
  | 'EM_ELABORACAO'
  | 'ENVIADA'
  | 'EM_NEGOCIACAO'
  | 'FECHADO_GANHO'
  | 'FECHADO_PERDIDO';

export type ProposalStatus = LegacyProposalStatus | PipelineProposalStatus;

/**
 * Função de retrocompatibilidade para mapear os status antigos para os novos.
 */
export const normalizeStatus = (status: string): string => {
  const upperStatus = status?.toUpperCase();
  switch (upperStatus) {
    case 'RASCUNHO':
    case 'CRIADA':
      return 'EM_ELABORACAO';
    case 'ENVIADA':
      return 'ENVIADA';
    case 'NEGOCIANDO':
      return 'EM_NEGOCIACAO';
    case 'APROVADA':
      return 'FECHADO_GANHO';
    case 'REJEITADA':
      return 'FECHADO_PERDIDO';
    default:
      return status;
  }
};

/**
 * Retorna um label legível para o status
 */
export const getStatusLabel = (status: string) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'QUALIFICACAO': return 'Qualificação';
    case 'EM_ELABORACAO': return 'Em Elaboração';
    case 'ENVIADA': return 'Enviada';
    case 'EM_NEGOCIACAO': return 'Em Negociação';
    case 'FECHADO_GANHO': return 'Fechado Ganho';
    case 'FECHADO_PERDIDO': return 'Fechado Perdido';
    default: return status;
  }
};

/**
 * Retorna as classes Tailwind para o estilo do badge de status
 */
export const getStatusClasses = (status: ProposalStatus | string) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'QUALIFICACAO':
      return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
    case 'EM_ELABORACAO':
      return 'bg-purple-200/50 text-purple-700 hover:bg-purple-200/80 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800/70';
    case 'ENVIADA':
      return 'bg-blue-200/50 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/70';
    case 'EM_NEGOCIACAO':
      return 'bg-yellow-200/50 text-yellow-700 hover:bg-yellow-200/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-800/70';
    case 'FECHADO_GANHO':
      return 'bg-green-200/50 text-green-700 hover:bg-green-200/80 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/70';
    case 'FECHADO_PERDIDO':
      return 'bg-red-200/50 text-red-700 hover:bg-red-200/80 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/70';
    default: 
      return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
  }
};

/**
 * Retorna as classes Tailwind para o estilo do badge de status com bordas
 */
export const getStatusBadgeClasses = (status: ProposalStatus | string) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'QUALIFICACAO':
      return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
    case 'EM_ELABORACAO':
      return 'bg-purple-200/50 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800';
    case 'ENVIADA':
      return 'bg-blue-200/50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800';
    case 'EM_NEGOCIACAO':
      return 'bg-yellow-200/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
    case 'FECHADO_GANHO':
      return 'bg-green-200/50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
    case 'FECHADO_PERDIDO':
      return 'bg-red-200/50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
    default: 
      return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
  }
};

/**
 * Retorna as classes Tailwind para o estilo do badge de status sem hover
 */
export const getStatusSimpleClasses = (status: ProposalStatus | string) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'QUALIFICACAO':
      return 'bg-gray-200/50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
    case 'EM_ELABORACAO':
      return 'bg-purple-200/50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    case 'ENVIADA':
      return 'bg-blue-200/50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    case 'EM_NEGOCIACAO':
      return 'bg-yellow-200/50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'FECHADO_GANHO':
      return 'bg-green-200/50 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    case 'FECHADO_PERDIDO':
      return 'bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    default: 
      return 'bg-gray-200/50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
  }
};
