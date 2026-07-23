import { describe, expect, it } from 'vitest';
import {
  fingerprintProposalDraft,
  mapSnapshotToDraft,
} from './proposalEditorMapper';
import type { ProposalEditorSnapshot } from './proposalEditorTypes';

const snapshot: ProposalEditorSnapshot = {
  id: 'proposal-1',
  owner: 'user-1',
  title: 'Proposta existente',
  amount: 0,
  status: 'Negociando',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T11:00:00.000Z',
  share_token: 'share-1',
  notes: '',
  payment_type: 'installment',
  cash_discount_percentage: 0,
  installment_number: 2,
  installment_value: 0,
  manual_installment_total: null,
  is_validity_enabled: true,
  validity_days: 30,
  proposal_logo_url: '/logo.png',
  proposal_gradient_theme: 'conexhub',
  show_interest_rate: false,
  client: {
    id: 'client-1',
    name: 'Cliente',
    email: 'cliente@example.com',
    company: 'Empresa',
    phone: '11999999999',
  },
  services: [{
    id: 'proposal-service-1',
    service_id: 'service-1',
    name: 'Mensalidade',
    description: '',
    base_price: 0,
    quantity: 1,
    custom_price: 0,
    discount: 0,
    discount_percentage: 0,
    discount_type: 'percentage',
    features: [],
    category: 'Recorrente',
    icon: '✨',
    is_custom: false,
    billing_type: 'monthly',
  }],
};

describe('proposal editor mapper', () => {
  it('maps a persisted snapshot while preserving zero values', () => {
    const draft = mapSnapshotToDraft(snapshot);

    expect(draft.proposalTitle).toBe('Proposta existente');
    expect(draft.selectedServices[0].customPrice).toBe(0);
    expect(draft.selectedServices[0].discount).toBe(0);
    expect(draft.cashDiscountPercentage).toBe(0);
    expect(draft.manualInstallmentTotal).toBeNull();
    expect(draft.showInterestRate).toBe(false);
    expect(draft.selectedClientId).toBe(snapshot.client.id);
    expect(draft.isNewClient).toBe(false);
  });

  it('creates a stable fingerprint that changes with meaningful draft edits', () => {
    const draft = mapSnapshotToDraft(snapshot);

    expect(fingerprintProposalDraft(draft))
      .toBe(fingerprintProposalDraft(structuredClone(draft)));

    const changed = structuredClone(draft);
    changed.notes = 'alterado';
    expect(fingerprintProposalDraft(changed))
      .not.toBe(fingerprintProposalDraft(draft));
  });
});
