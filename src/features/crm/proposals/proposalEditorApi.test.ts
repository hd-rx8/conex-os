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

const ownerSnapshot = {
  id: 'proposal-1',
  owner: 'owner-1',
  title: 'Proposta',
  amount: 100,
  status: 'Negociando',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T11:00:00.000Z',
  share_token: 'share-1',
  notes: null,
  payment_type: 'cash',
  cash_discount_percentage: 0,
  installment_number: 2,
  installment_value: 0,
  manual_installment_total: null,
  is_validity_enabled: false,
  validity_days: 0,
  proposal_logo_url: null,
  proposal_gradient_theme: 'conexhub',
  show_interest_rate: true,
  clients: {
    id: 'client-1',
    name: 'Cliente',
    email: 'cliente@example.com',
    company: 'Empresa',
    phone: '11999999999',
  },
  proposal_services: [{
    id: 'proposal-service-1',
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

  it('returns a domain conflict when the save RPC reports one', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: '40001', message: 'proposal_conflict' },
    });

    await expect(saveProposalEdit(input)).resolves.toEqual({
      success: false,
      errorCode: 'conflict',
    });
  });

  it('returns unknown when the save RPC rejects because the network is unavailable', async () => {
    rpc.mockRejectedValue(new Error('network unavailable'));

    await expect(saveProposalEdit(input)).resolves.toEqual({
      success: false,
      errorCode: 'unknown',
    });
  });

  it('normalizes the owner snapshot associations after the RLS-protected query', async () => {
    overrideTypes.mockResolvedValue({ data: ownerSnapshot, error: null });

    await expect(getProposalEditorSnapshot('proposal-1')).resolves.toMatchObject({
      ...ownerSnapshot,
      client: ownerSnapshot.clients,
      services: ownerSnapshot.proposal_services,
    });
    expect(from).toHaveBeenCalledWith('proposals');
    expect(eq).toHaveBeenCalledWith('id', 'proposal-1');
  });

  it('preserves a missing owner client as null in the Task 2 snapshot contract', async () => {
    overrideTypes.mockResolvedValue({
      data: { ...ownerSnapshot, clients: null },
      error: null,
    });

    await expect(getProposalEditorSnapshot('proposal-1')).resolves.toMatchObject({
      client: null,
      services: ownerSnapshot.proposal_services,
    });
  });

  it('converts a PostgREST missing-row owner error into a not_found domain error', async () => {
    overrideTypes.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });

    await expect(getProposalEditorSnapshot('missing')).rejects.toMatchObject({
      code: 'not_found',
      message: 'not_found',
    });
  });

  it('converts an absent owner snapshot response into a not_found domain error', async () => {
    overrideTypes.mockResolvedValue({ data: null, error: null });

    await expect(getProposalEditorSnapshot('missing')).rejects.toMatchObject({
      code: 'not_found',
      message: 'not_found',
    });
  });

  it('converts an unknown owner query rejection into an unknown domain error', async () => {
    overrideTypes.mockRejectedValue(new Error('network unavailable'));

    await expect(getProposalEditorSnapshot('proposal-1')).rejects.toMatchObject({
      code: 'unknown',
      message: 'unknown',
    });
  });

  it('does not infer a domain code from a generic Error message', async () => {
    overrideTypes.mockRejectedValue(new Error('proposal_not_found'));

    await expect(getProposalEditorSnapshot('proposal-1')).rejects.toMatchObject({
      code: 'unknown',
      message: 'unknown',
    });
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

  it('converts an absent public RPC payload into a not_found domain error', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(getPublicProposalByToken('missing-token')).rejects.toMatchObject({
      code: 'not_found',
      message: 'not_found',
    });
  });

  it('converts an unknown PostgREST public error into an unknown domain error', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'internal database error' },
    });

    await expect(getPublicProposalByToken('token-1')).rejects.toMatchObject({
      code: 'unknown',
      message: 'unknown',
    });
  });

  it('does not infer a domain code from an unknown PostgREST error message', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'proposal_not_found' },
    });

    await expect(getPublicProposalByToken('token-1')).rejects.toMatchObject({
      code: 'unknown',
      message: 'unknown',
    });
  });

  it('converts a public RPC network rejection into an unknown domain error', async () => {
    rpc.mockRejectedValue(new Error('network unavailable'));

    await expect(getPublicProposalByToken('token-1')).rejects.toMatchObject({
      code: 'unknown',
      message: 'unknown',
    });
  });
});
