export const CANONICAL_PROPOSAL_STATUSES = [
  'QUALIFICACAO',
  'EM_ELABORACAO',
  'EM_REVISAO',
  'ENVIADA',
  'NEGOCIACAO',
  'FECHADO_GANHO',
  'FECHADO_PERDIDO',
] as const;

export type CanonicalProposalStatus =
  (typeof CANONICAL_PROPOSAL_STATUSES)[number];

export const LEGACY_PROPOSAL_STATUSES = [
  'Rascunho',
  'Criada',
  'Enviada',
  'Negociando',
  'EM_NEGOCIACAO',
  'Aprovada',
  'Rejeitada',
] as const;

export type LegacyProposalStatus =
  (typeof LEGACY_PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUSES = [
  ...CANONICAL_PROPOSAL_STATUSES,
  ...LEGACY_PROPOSAL_STATUSES,
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const EDITABLE_PROPOSAL_STATUSES = [
  'QUALIFICACAO',
  'EM_ELABORACAO',
  'EM_REVISAO',
  'ENVIADA',
  'NEGOCIACAO',
] as const satisfies readonly CanonicalProposalStatus[];

export type EditableProposalStatus =
  (typeof EDITABLE_PROPOSAL_STATUSES)[number];

export const LOCKED_PROPOSAL_STATUSES = [
  'FECHADO_GANHO',
  'FECHADO_PERDIDO',
] as const satisfies readonly CanonicalProposalStatus[];

const aliasesByCanonical = {
  QUALIFICACAO: [],
  EM_ELABORACAO: ['Rascunho'],
  EM_REVISAO: ['Criada'],
  ENVIADA: ['Enviada'],
  NEGOCIACAO: ['Negociando', 'EM_NEGOCIACAO'],
  FECHADO_GANHO: ['Aprovada'],
  FECHADO_PERDIDO: ['Rejeitada'],
} as const satisfies Record<
  CanonicalProposalStatus,
  readonly LegacyProposalStatus[]
>;

const canonicalStatusSet = new Set<string>(CANONICAL_PROPOSAL_STATUSES);
const editableStatusSet = new Set<string>(EDITABLE_PROPOSAL_STATUSES);
const lockedStatusSet = new Set<string>(LOCKED_PROPOSAL_STATUSES);

const canonicalByAlias = new Map<string, CanonicalProposalStatus>(
  Object.entries(aliasesByCanonical).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [alias, canonical as CanonicalProposalStatus]),
  ),
);

export const normalizeProposalStatus = (
  status: string,
): CanonicalProposalStatus | null => {
  if (canonicalStatusSet.has(status)) {
    return status as CanonicalProposalStatus;
  }

  return canonicalByAlias.get(status) ?? null;
};

export const getProposalStatusFilterValues = (
  status: string,
): string[] => {
  const canonical = normalizeProposalStatus(status);
  if (!canonical) return [status];

  return [canonical, ...aliasesByCanonical[canonical]];
};

const labels: Record<CanonicalProposalStatus, string> = {
  QUALIFICACAO: 'Qualificação',
  EM_ELABORACAO: 'Em elaboração',
  EM_REVISAO: 'Em revisão',
  ENVIADA: 'Enviada',
  NEGOCIACAO: 'Negociação',
  FECHADO_GANHO: 'Fechado ganho',
  FECHADO_PERDIDO: 'Fechado perdido',
};

export const getProposalStatusLabel = (status: string): string => {
  const canonical = normalizeProposalStatus(status);
  return canonical ? labels[canonical] : status;
};

export const canEditProposal = (
  status: string,
): status is EditableProposalStatus | LegacyProposalStatus => {
  const canonical = normalizeProposalStatus(status);
  return canonical !== null && editableStatusSet.has(canonical);
};

export const isLockedProposal = (status: string): boolean => {
  const canonical = normalizeProposalStatus(status);
  return canonical !== null && lockedStatusSet.has(canonical);
};
