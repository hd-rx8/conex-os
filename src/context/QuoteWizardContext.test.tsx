import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyProvider } from '@/context/CurrencyContext';
import type { ProposalEditorSnapshot } from '@/features/crm/proposals/proposalEditorTypes';

const editorApi = vi.hoisted(() => ({
  getProposalEditorSnapshot: vi.fn(),
  saveProposalEdit: vi.fn(),
}));
const customServicesApi = vi.hoisted(() => ({
  customServices: [],
  fetchCustomServices: vi.fn(),
  createCustomService: vi.fn(),
  updateCustomService: vi.fn(),
  deleteCustomService: vi.fn(),
}));
const clientsApi = vi.hoisted(() => ({
  clients: [],
  fetchClients: vi.fn(),
  createClient: vi.fn(),
}));
const proposalsApi = vi.hoisted(() => ({
  createProposal: vi.fn(),
  createDraftProposal: vi.fn(),
}));

vi.mock('@/features/crm/proposals/proposalEditorApi', () => editorApi);
vi.mock('@/hooks/useCustomServices', () => ({
  useCustomServices: () => customServicesApi,
}));
vi.mock('@/hooks/useClients', () => ({
  useClients: () => clientsApi,
}));
vi.mock('@/hooks/useProposals', () => ({
  useProposals: () => proposalsApi,
}));

import { QuoteWizardProvider, useQuoteWizard } from './QuoteWizardContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const snapshot: ProposalEditorSnapshot = {
  id: 'proposal-1',
  owner: 'user-1',
  title: 'Proposta existente',
  amount: 1500,
  status: 'Rascunho',
  created_at: '2026-07-20T10:00:00.000Z',
  updated_at: '2026-07-20T10:00:00.000Z',
  share_token: 'share-token',
  notes: 'Notas do servidor',
  payment_type: 'cash',
  cash_discount_percentage: 5,
  installment_number: 2,
  installment_value: 0,
  manual_installment_total: null,
  is_validity_enabled: true,
  validity_days: 30,
  proposal_logo_url: '/logo.png',
  proposal_gradient_theme: 'conexhub',
  show_interest_rate: true,
  client: {
    id: 'client-1', name: 'Cliente', email: 'cliente@example.com', company: 'ACME', phone: '11999999999',
  },
  services: [{
    id: 'proposal-service-1', service_id: 'service-1', name: 'Serviço', description: 'Descrição',
    base_price: 1500, quantity: 1, custom_price: null, discount: 0, discount_percentage: 0,
    discount_type: 'percentage', features: ['Item'], category: 'Web', icon: '✨', is_custom: false,
    billing_type: 'one_time',
  }],
};

const Probe = () => {
  const wizard = useQuoteWizard();
  const [generationComplete, setGenerationComplete] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  return (
    <>
      <output data-testid="step">{wizard.currentStep}</output>
      <output data-testid="services">{wizard.selectedServices.length}</output>
      <output data-testid="notes">{wizard.notes}</output>
      <output data-testid="title">{wizard.proposalTitle}</output>
      <output data-testid="loading">{String(wizard.isHydrating)}</output>
      <output data-testid="dirty">{String(wizard.isDirty)}</output>
      <output data-testid="link">{wizard.generatedShareLink}</output>
      <output data-testid="status">{wizard.proposalMeta?.status}</output>
      <output data-testid="updated-at">{wizard.proposalMeta?.updatedAt}</output>
      <button onClick={() => wizard.setNotes('Notas locais')}>editar notas</button>
      {wizard.saveProposalChanges && <button onClick={() => void wizard.saveProposalChanges?.()}>salvar</button>}
      <output data-testid="generation-complete">{String(generationComplete)}</output>
      <output data-testid="registration-complete">{String(registrationComplete)}</output>
      <button onClick={() => void wizard.generateShareableLink('user-1').then(() => setGenerationComplete(true))}>gerar link</button>
      <button onClick={() => void wizard.registerProposal('user-1').then(() => setRegistrationComplete(true))}>registrar proposta</button>
      <button onClick={() => void wizard.reloadProposal()}>recarregar</button>
    </>
  );
};

const renderWizard = (props: { mode: 'create' | 'edit'; proposalId?: string }) => render(
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <QuoteWizardProvider userId="user-1" {...props}>
        <Probe />
      </QuoteWizardProvider>
    </CurrencyProvider>
  </QueryClientProvider>,
);

describe('QuoteWizardProvider', () => {
  beforeEach(() => {
    editorApi.getProposalEditorSnapshot.mockReset();
    editorApi.saveProposalEdit.mockReset();
    proposalsApi.createDraftProposal.mockReset();
    proposalsApi.createProposal.mockReset();
  });

  it('starts a create session at step zero with an empty draft', () => {
    renderWizard({ mode: 'create' });

    expect(screen.getByTestId('step')).toHaveTextContent('0');
    expect(screen.getByTestId('services')).toHaveTextContent('0');
    expect(screen.getByTestId('notes')).toHaveTextContent('');
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
  });

  it('shows loading until an edit snapshot resolves', async () => {
    let resolveSnapshot!: (value: ProposalEditorSnapshot) => void;
    editorApi.getProposalEditorSnapshot.mockReturnValue(new Promise((resolve) => { resolveSnapshot = resolve; }));

    renderWizard({ mode: 'edit', proposalId: snapshot.id });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    resolveSnapshot(snapshot);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
  });

  it('hydrates an edit snapshot once at step zero without overwriting local edits on rerender', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue(snapshot);
    const view = renderWizard({ mode: 'edit', proposalId: snapshot.id });

    await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent(snapshot.title));
    expect(screen.getByTestId('step')).toHaveTextContent('0');
    expect(screen.getByTestId('services')).toHaveTextContent('1');
    expect(screen.getByTestId('link')).toHaveTextContent(`/p/${snapshot.share_token}`);
    fireEvent.click(screen.getByRole('button', { name: 'editar notas' }));

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <QuoteWizardProvider userId="user-1" mode="edit" proposalId={snapshot.id}>
            <Probe />
          </QuoteWizardProvider>
        </CurrencyProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('notes')).toHaveTextContent('Notas locais');
    expect(editorApi.getProposalEditorSnapshot).toHaveBeenCalledTimes(1);
  });

  it('does not retain an edit draft after mounting a create session', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue(snapshot);
    const view = renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent(snapshot.title));

    view.unmount();
    renderWizard({ mode: 'create' });

    expect(screen.getByTestId('title')).toHaveTextContent('');
    expect(screen.getByTestId('notes')).toHaveTextContent('');
  });

  it('marks an edit session dirty when notes change', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue(snapshot);
    renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByRole('button', { name: 'editar notas' }));

    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });

  it('updates the baseline and clears dirty state after a successful edit save', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue(snapshot);
    editorApi.saveProposalEdit.mockResolvedValue({ success: true });
    renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByRole('button', { name: 'salvar' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'editar notas' }));
    fireEvent.click(screen.getByRole('button', { name: 'salvar' }));

    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(editorApi.saveProposalEdit).toHaveBeenCalledWith(expect.objectContaining({
      proposalId: snapshot.id,
      expectedUpdatedAt: snapshot.updated_at,
      proposal: expect.objectContaining({ notes: 'Notas locais' }),
    }));
  });

  it('never exposes saveProposalChanges for a locked snapshot', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue({ ...snapshot, status: 'Aprovada' });
    renderWizard({ mode: 'edit', proposalId: snapshot.id });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Aprovada'));
    expect(screen.queryByRole('button', { name: 'salvar' })).not.toBeInTheDocument();
  });

  it('does not create a draft or proposal from an editable edit session', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue(snapshot);
    proposalsApi.createDraftProposal.mockResolvedValue({ data: null, error: null });
    proposalsApi.createProposal.mockResolvedValue({ data: null, error: null });
    renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Rascunho'));

    fireEvent.click(screen.getByRole('button', { name: 'gerar link' }));
    fireEvent.click(screen.getByRole('button', { name: 'registrar proposta' }));

    await waitFor(() => expect(screen.getByTestId('generation-complete')).toHaveTextContent('true'));
    await waitFor(() => expect(screen.getByTestId('registration-complete')).toHaveTextContent('true'));
    expect(proposalsApi.createDraftProposal).not.toHaveBeenCalled();
    expect(proposalsApi.createProposal).not.toHaveBeenCalled();
  });

  it('does not create a draft or proposal from a locked edit session', async () => {
    editorApi.getProposalEditorSnapshot.mockResolvedValue({ ...snapshot, status: 'Aprovada' });
    proposalsApi.createDraftProposal.mockResolvedValue({ data: null, error: null });
    proposalsApi.createProposal.mockResolvedValue({ data: null, error: null });
    renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Aprovada'));

    fireEvent.click(screen.getByRole('button', { name: 'gerar link' }));
    fireEvent.click(screen.getByRole('button', { name: 'registrar proposta' }));

    await waitFor(() => expect(screen.getByTestId('generation-complete')).toHaveTextContent('true'));
    await waitFor(() => expect(screen.getByTestId('registration-complete')).toHaveTextContent('true'));
    expect(proposalsApi.createDraftProposal).not.toHaveBeenCalled();
    expect(proposalsApi.createProposal).not.toHaveBeenCalled();
  });

  it('keeps dirty local values while a newer reload refreshes proposal metadata', async () => {
    const newerSnapshot = {
      ...snapshot,
      title: 'Título atualizado no servidor',
      updated_at: '2026-07-21T10:00:00.000Z',
    };
    editorApi.getProposalEditorSnapshot
      .mockResolvedValueOnce(snapshot)
      .mockResolvedValueOnce(newerSnapshot);
    renderWizard({ mode: 'edit', proposalId: snapshot.id });
    await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent(snapshot.title));
    fireEvent.click(screen.getByRole('button', { name: 'editar notas' }));
    fireEvent.click(screen.getByRole('button', { name: 'recarregar' }));

    await waitFor(() => expect(screen.getByTestId('updated-at')).toHaveTextContent(newerSnapshot.updated_at));
    expect(screen.getByTestId('title')).toHaveTextContent(snapshot.title);
    expect(screen.getByTestId('notes')).toHaveTextContent('Notas locais');
  });
});
