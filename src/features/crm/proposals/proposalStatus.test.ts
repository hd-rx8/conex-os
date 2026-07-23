import { describe, expect, it } from 'vitest';
import {
  EDITABLE_PROPOSAL_STATUSES,
  LOCKED_PROPOSAL_STATUSES,
  PROPOSAL_STATUSES,
  canEditProposal,
  isLockedProposal,
} from './proposalStatus';

describe('proposal status editing policy', () => {
  it.each(['Rascunho', 'Criada', 'Enviada', 'Negociando'] as const)(
    'allows %s',
    (status) => {
      expect(canEditProposal(status)).toBe(true);
      expect(isLockedProposal(status)).toBe(false);
    },
  );

  it.each(['Aprovada', 'Rejeitada'] as const)('locks %s', (status) => {
    expect(canEditProposal(status)).toBe(false);
    expect(isLockedProposal(status)).toBe(true);
  });

  it('classifies every status exactly once', () => {
    expect([...EDITABLE_PROPOSAL_STATUSES, ...LOCKED_PROPOSAL_STATUSES].sort())
      .toEqual([...PROPOSAL_STATUSES].sort());
  });

  it('rejects unknown values', () => {
    expect(canEditProposal('Cancelada')).toBe(false);
    expect(isLockedProposal('Cancelada')).toBe(false);
  });
});
