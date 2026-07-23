import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { getPublicProposalByToken, getProposalByShareToken, useProposals } = vi.hoisted(() => ({
  getPublicProposalByToken: vi.fn(),
  getProposalByShareToken: vi.fn(),
  useProposals: vi.fn(),
}));

vi.mock('@/features/crm/proposals/proposalEditorApi', () => ({
  getPublicProposalByToken,
}));

vi.mock('@/hooks/useProposals', () => ({
  useProposals,
}));

vi.mock('@/components/ProposalDocument', () => ({
  default: ({ snapshot }: { snapshot: { title: string; payment: { show_interest_rate: boolean } } }) => (
    <div data-testid="proposal-document">
      {snapshot.title}:{String(snapshot.payment.show_interest_rate)}
    </div>
  ),
}));

import PublicProposalView from './PublicProposalView';

const publicDocument = {
  id: 'proposal-1',
  title: 'Proposta pública',
  amount: 120,
  status: 'Enviada',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T10:00:00.000Z',
  notes: null,
  payment_type: 'installment',
  cash_discount_percentage: 0,
  installment_number: 2,
  installment_value: 60,
  manual_installment_total: null,
  is_validity_enabled: false,
  validity_days: 0,
  proposal_logo_url: null,
  proposal_gradient_theme: 'conexhub',
  show_interest_rate: false,
  client: {
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

const renderPublicView = () => render(
  <MemoryRouter initialEntries={['/proposta/token-1']}>
    <Routes>
      <Route path="/proposta/:share_token" element={<PublicProposalView />} />
    </Routes>
  </MemoryRouter>,
);

describe('PublicProposalView', () => {
  it('loads a public proposal through the token API without using the owner proposal hook', async () => {
    getPublicProposalByToken.mockResolvedValue(publicDocument);
    getProposalByShareToken.mockResolvedValue({ data: publicDocument, error: null });
    useProposals.mockReturnValue({ getProposalByShareToken });

    renderPublicView();

    await waitFor(() => expect(getPublicProposalByToken).toHaveBeenCalledWith('token-1'));
    expect(useProposals).not.toHaveBeenCalled();
    expect(await screen.findByTestId('proposal-document')).toHaveTextContent('Proposta pública:false');
  });

  it.each(['not_found', 'unknown'])('shows the safe public error state for a %s token failure', async () => {
    getPublicProposalByToken.mockRejectedValue(new Error('internal error'));
    getProposalByShareToken.mockResolvedValue({ data: null, error: new Error('internal error') });
    useProposals.mockReturnValue({ getProposalByShareToken });

    renderPublicView();

    expect(await screen.findByText('Erro ao Carregar Proposta')).toBeInTheDocument();
    expect(screen.getByText('Proposta não encontrada ou token inválido.')).toBeInTheDocument();
    expect(screen.queryByTestId('proposal-document')).not.toBeInTheDocument();
  });
});
