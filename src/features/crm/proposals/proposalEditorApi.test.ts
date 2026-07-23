import { describe, expect, it, vi } from 'vitest';
import type { ProposalEditPayload } from './proposalEditorTypes';

const { rpc, overrideTypes, single, eq, select, from } = vi.hoisted(() => {
  const overrideTypes = vi.fn();
  const single = vi.fn(() => ({ overrideTypes }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { rpc: vi.fn(), overrideTypes, single, eq, select, from };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from, rpc },
}));

import {
  getProposalEditorSnapshot,
  getPublicProposalByToken,
  mapProposalEditorError,
  saveProposalEdit,
} from './proposalEditorApi';

const input: ProposalEditPayload = {
  proposalId: 'proposal-1',
  expectedUpdatedAt: '2026-07-23T11:00:00.000Z',
  proposal: {
    title: 'Proposta atualizada',
    client_id: 'client-1',
    notes: 'Notas',
    payment_type: 'cash',
    cash_discount_percentage: 0,
    installment_number: 2,
    installment_value: 0,
    manual_installment_total: null,
    is_validity_enabled: false,
    validity_days: 0,
    proposal_logo_url: '',
    proposal_gradient_theme: 'conexhub',
    show_interest_rate: true,
  },
  services: [{
    service_id: 'service-1',
    name: 'Serviço',
    description: null,
    base_price: 100,
    quantity: 1,
    custom_price: null,
    discount: 0,
    discount_percentage: 0,
    discount_type: 'percentage',
    features: [],
    category: null,
    icon: null,
    is_custom: false,
    billing_type: 'one_time',
  }],
  newClient: null,
};

describe('proposal editor API', () => {
  it('sends the edit payload to the transactional RPC', async () => {
    rpc.mockResolvedValue({
      data: [{ proposal_id: input.proposalId }],
      error: null,
    });

    await expect(saveProposalEdit(input)).resolves.toEqual({ success: true });

    expect(rpc).toHaveBeenCalledWith('update_editable_proposal', {
      p_proposal_id: input.proposalId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_proposal: input.proposal,
      p_services: input.services,
      p_new_client: input.newClient,
    });
  });

  it('requires exactly one committed RPC result row', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    await expect(saveProposalEdit(input)).resolves.toEqual({
      success: false,
      errorCode: 'unknown',
    });
  });

  it('maps backend editing errors to UI-safe codes', () => {
    expect(mapProposalEditorError({ code: '40001', message: 'proposal_conflict' }))
      .toBe('conflict');
    expect(mapProposalEditorError({ code: 'P0001', message: 'proposal_locked' }))
      .toBe('locked');
    expect(mapProposalEditorError({ code: 'P0002', message: 'proposal_not_found' }))
      .toBe('not_found');
    expect(mapProposalEditorError({ code: '42501', message: 'denied' }))
      .toBe('forbidden');
    expect(mapProposalEditorError({ code: '22023', message: 'invalid_service' }))
      .toBe('validation');
  });

  it('normalizes the owner snapshot associations after the RLS-protected query', async () => {
    overrideTypes.mockResolvedValue({
      data: {
        id: 'proposal-1',
        clients: { id: 'client-1', name: 'Cliente' },
        proposal_services: [{ id: 'proposal-service-1' }],
      },
      error: null,
    });

    await expect(getProposalEditorSnapshot('proposal-1')).resolves.toEqual({
      id: 'proposal-1',
      clients: { id: 'client-1', name: 'Cliente' },
      proposal_services: [{ id: 'proposal-service-1' }],
      client: { id: 'client-1', name: 'Cliente' },
      services: [{ id: 'proposal-service-1' }],
    });
    expect(from).toHaveBeenCalledWith('proposals');
    expect(eq).toHaveBeenCalledWith('id', 'proposal-1');
  });

  it('fetches public documents exclusively through the public token RPC', async () => {
    const document = { id: 'proposal-1', proposal_services: [] };
    rpc.mockResolvedValue({ data: document, error: null });

    await expect(getPublicProposalByToken('token-1')).resolves.toBe(document);

    expect(rpc).toHaveBeenCalledWith('get_public_proposal_by_token', {
      p_share_token: 'token-1',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('preserves the backend error for callers that need a safe load state', async () => {
    const error = { code: 'P0002', message: 'proposal_not_found' };
    rpc.mockResolvedValue({ data: null, error });

    await expect(getPublicProposalByToken('missing-token')).rejects.toBe(error);
  });
});
