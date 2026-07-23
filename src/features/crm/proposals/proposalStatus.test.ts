import { describe, expect, it } from 'vitest';
import {
  CANONICAL_PROPOSAL_STATUSES,
  EDITABLE_PROPOSAL_STATUSES,
  LEGACY_PROPOSAL_STATUSES,
  LOCKED_PROPOSAL_STATUSES,
  PROPOSAL_STATUSES,
  canEditProposal,
  getProposalStatusFilterValues,
  getProposalStatusLabel,
  isLockedProposal,
  normalizeProposalStatus,
} from './proposalStatus';

describe('proposal status editing policy', () => {
  it.each([
    'QUALIFICACAO',
    'EM_ELABORACAO',
    'EM_REVISAO',
    'ENVIADA',
    'NEGOCIACAO',
  ] as const)(
    'allows %s',
    (status) => {
      expect(canEditProposal(status)).toBe(true);
      expect(isLockedProposal(status)).toBe(false);
    },
  );

  it.each(['FECHADO_GANHO', 'FECHADO_PERDIDO'] as const)(
    'locks %s',
    (status) => {
      expect(canEditProposal(status)).toBe(false);
      expect(isLockedProposal(status)).toBe(true);
    },
  );

  it('classifies every canonical status exactly once', () => {
    expect([...EDITABLE_PROPOSAL_STATUSES, ...LOCKED_PROPOSAL_STATUSES].sort())
      .toEqual([...CANONICAL_PROPOSAL_STATUSES].sort());
  });

  it.each([
    ['Rascunho', 'EM_ELABORACAO'],
    ['Criada', 'EM_REVISAO'],
    ['Enviada', 'ENVIADA'],
    ['Negociando', 'NEGOCIACAO'],
    ['EM_NEGOCIACAO', 'NEGOCIACAO'],
    ['Aprovada', 'FECHADO_GANHO'],
    ['Rejeitada', 'FECHADO_PERDIDO'],
  ] as const)('normalizes legacy %s to %s', (legacy, canonical) => {
    expect(normalizeProposalStatus(legacy)).toBe(canonical);
  });

  it('keeps legacy editing and locking behavior during the transition', () => {
    expect(LEGACY_PROPOSAL_STATUSES.every((status) =>
      PROPOSAL_STATUSES.includes(status))).toBe(true);
    expect(canEditProposal('Rascunho')).toBe(true);
    expect(canEditProposal('Criada')).toBe(true);
    expect(canEditProposal('Enviada')).toBe(true);
    expect(canEditProposal('Negociando')).toBe(true);
    expect(canEditProposal('EM_NEGOCIACAO')).toBe(true);
    expect(isLockedProposal('Aprovada')).toBe(true);
    expect(isLockedProposal('Rejeitada')).toBe(true);
  });

  it('expands canonical filters with their legacy aliases', () => {
    expect(getProposalStatusFilterValues('EM_ELABORACAO')).toEqual([
      'EM_ELABORACAO',
      'Rascunho',
    ]);
    expect(getProposalStatusFilterValues('EM_REVISAO')).toEqual([
      'EM_REVISAO',
      'Criada',
    ]);
    expect(getProposalStatusFilterValues('NEGOCIACAO')).toEqual([
      'NEGOCIACAO',
      'Negociando',
      'EM_NEGOCIACAO',
    ]);
    expect(getProposalStatusFilterValues('FECHADO_GANHO')).toEqual([
      'FECHADO_GANHO',
      'Aprovada',
    ]);
  });

  it('uses aligned labels for canonical and legacy values', () => {
    expect(getProposalStatusLabel('EM_REVISAO')).toBe('Em revisão');
    expect(getProposalStatusLabel('Criada')).toBe('Em revisão');
    expect(getProposalStatusLabel('NEGOCIACAO')).toBe('Negociação');
    expect(getProposalStatusLabel('Negociando')).toBe('Negociação');
  });

  it('rejects unknown values', () => {
    expect(canEditProposal('Cancelada')).toBe(false);
    expect(isLockedProposal('Cancelada')).toBe(false);
    expect(normalizeProposalStatus('Cancelada')).toBeNull();
    expect(getProposalStatusFilterValues('Cancelada')).toEqual(['Cancelada']);
  });
});
