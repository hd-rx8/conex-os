export const PROPOSAL_STATUSES = [
  'Rascunho',
  'Criada',
  'Enviada',
  'Negociando',
  'Aprovada',
  'Rejeitada',
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const EDITABLE_PROPOSAL_STATUSES = [
  'Rascunho',
  'Criada',
  'Enviada',
  'Negociando',
] as const satisfies readonly ProposalStatus[];

export type EditableProposalStatus =
  (typeof EDITABLE_PROPOSAL_STATUSES)[number];

export const LOCKED_PROPOSAL_STATUSES = [
  'Aprovada',
  'Rejeitada',
] as const satisfies readonly ProposalStatus[];

const editable = new Set<string>(EDITABLE_PROPOSAL_STATUSES);
const locked = new Set<string>(LOCKED_PROPOSAL_STATUSES);

export const canEditProposal = (
  status: string,
): status is EditableProposalStatus => editable.has(status);

export const isLockedProposal = (status: string): boolean =>
  locked.has(status);
