import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const wizard = vi.hoisted(() => ({
  state: {
    mode: 'create',
    proposalMeta: null as { id: string; title: string; status: string } | null,
    isHydrating: false,
    loadError: null as string | null,
    isLocked: false,
    isDirty: false,
    currentStep: 0,
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    reloadProposal: vi.fn(),
    steps: [
      { id: 'services', name: 'Serviços' },
      { id: 'settings', name: 'Dados' },
      { id: 'client', name: 'Cliente' },
      { id: 'review', name: 'Revisão' },
    ],
    selectedServices: [],
    clientInfo: { name: '', email: '' },
    proposalTitle: '',
  },
}));
const proposalActions = vi.hoisted(() => ({
  duplicateProposal: vi.fn(),
}));

vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/Stepper', () => ({
  default: () => <div data-testid="stepper" />,
}));
vi.mock('@/components/quote-wizard/StepServices', () => ({
  default: () => <div>Serviços</div>,
}));
vi.mock('@/components/quote-wizard/StepSettings', () => ({
  default: () => <div>Dados</div>,
}));
vi.mock('@/components/quote-wizard/StepClient', () => ({
  default: () => <div>Cliente</div>,
}));
vi.mock('@/components/quote-wizard/StepReview', () => ({
  default: () => <div>Revisão</div>,
}));
vi.mock('@/context/QuoteWizardContext', () => ({
  useQuoteWizard: () => wizard.state,
}));
vi.mock('@/hooks/useProposals', () => ({
  useProposals: () => proposalActions,
}));

import QuoteGeneratorPage from './QuoteGeneratorPage';

describe('QuoteGeneratorPage', () => {
  const renderPage = () => render(
    <MemoryRouter>
      <QuoteGeneratorPage userId="user-1" />
    </MemoryRouter>,
  );

  const resetWizard = () => {
    Object.assign(wizard.state, {
      mode: 'create',
      proposalMeta: null,
      isHydrating: false,
      loadError: null,
      isLocked: false,
      isDirty: false,
      currentStep: 0,
      selectedServices: [],
      clientInfo: { name: '', email: '' },
      proposalTitle: '',
    });
    wizard.state.reloadProposal.mockReset();
    proposalActions.duplicateProposal.mockReset().mockResolvedValue({ data: null, error: null });
  };

  it('shows loading skeletons instead of the default form while an edit proposal hydrates', () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isHydrating = true;

    renderPage();

    expect(screen.getByTestId('proposal-editor-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('stepper')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próximo' })).not.toBeInTheDocument();
  });

  it('explains unavailable proposals and offers retry and back actions', () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.loadError = 'forbidden';

    renderPage();

    expect(screen.getByText('Não foi possível abrir esta proposta. Ela pode não existir ou não estar disponível para sua conta.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(wizard.state.reloadProposal).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Voltar para oportunidades' })).toBeInTheDocument();
  });

  it('keeps a locked proposal out of the wizard and offers view and duplicate actions', () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isLocked = true;
    wizard.state.proposalMeta = { id: 'proposal-1', title: 'Proposta final', status: 'Aprovada' };

    renderPage();

    expect(screen.getByText('Esta proposta está Aprovada e não pode mais ser alterada. Você ainda pode visualizá-la ou criar uma cópia editável.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visualizar proposta' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Duplicar proposta' }));
    expect(proposalActions.duplicateProposal).toHaveBeenCalledWith('proposal-1', 'user-1');
    expect(screen.queryByRole('button', { name: 'Próximo' })).not.toBeInTheDocument();
  });

  it('shows the editing header with title, status and only a dirty-state badge when changed', () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isDirty = true;
    wizard.state.proposalMeta = { id: 'proposal-1', title: 'Proposta existente', status: 'Rascunho' };

    renderPage();

    expect(screen.getByRole('heading', { name: 'Editando proposta' })).toBeInTheDocument();
    expect(screen.getByText('Proposta existente')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
  });

  it('keeps wizard validation inside the standardized page shell', () => {
    resetWizard();
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Gerador de propostas' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
  });
});
