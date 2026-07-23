import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useLocation,
} from 'react-router-dom';

const NativeRequest = globalThis.Request;

class JsdomCompatibleRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : init);
  }
}

beforeAll(() => {
  globalThis.Request = JsdomCompatibleRequest;
});

afterAll(() => {
  globalThis.Request = NativeRequest;
});

const wizard = vi.hoisted(() => ({
  state: {
    mode: 'create',
    proposalMeta: null as { id: string; title: string; status: string; shareToken?: string | null } | null,
    isHydrating: false,
    loadError: null as string | null,
    isLocked: false,
    isDirty: false,
    isSaving: false,
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
  const CurrentLocation = () => (
    <>
      <output data-testid="current-location">{useLocation().pathname}</output>
      <Link to="/opportunities">Sair do editor</Link>
    </>
  );

  const renderPage = () => {
    const router = createMemoryRouter([
      {
        path: '*',
        element: (
          <>
            <QuoteGeneratorPage userId="user-1" />
            <CurrentLocation />
          </>
        ),
      },
    ], {
      initialEntries: ['/generator/proposal-1/edit'],
    });

    return {
      router,
      ...render(<RouterProvider router={router} />),
    };
  };

  afterEach(() => vi.restoreAllMocks());

  const resetWizard = () => {
    Object.assign(wizard.state, {
      mode: 'create',
      proposalMeta: null,
      isHydrating: false,
      loadError: null,
      isLocked: false,
      isDirty: false,
      isSaving: false,
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

  it('views a locked proposal and opens its editable copy after duplication', async () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isLocked = true;
    wizard.state.proposalMeta = {
      id: 'proposal-1', title: 'Proposta final', status: 'Aprovada', shareToken: 'share-token',
    };
    proposalActions.duplicateProposal.mockResolvedValue({ data: { id: 'proposal-copy-1' }, error: null });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderPage();

    expect(screen.getByText('Esta proposta está Aprovada e não pode mais ser alterada. Você ainda pode visualizá-la ou criar uma cópia editável.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Visualizar proposta' }));
    expect(open).toHaveBeenCalledWith('/p/share-token', '_blank', 'noopener,noreferrer');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicar proposta' }));
    expect(proposalActions.duplicateProposal).toHaveBeenCalledWith('proposal-1', 'user-1');
    await waitFor(() => expect(screen.getByTestId('current-location')).toHaveTextContent('/generator/proposal-copy-1/edit'));
    expect(screen.queryByRole('button', { name: 'Próximo' })).not.toBeInTheDocument();
  });

  it('accepts only one duplicate request while the first request is still pending', () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isLocked = true;
    wizard.state.proposalMeta = { id: 'proposal-1', title: 'Proposta final', status: 'Aprovada', shareToken: 'share-token' };
    proposalActions.duplicateProposal.mockReturnValue(new Promise(() => undefined));

    renderPage();
    const duplicateButton = screen.getByRole('button', { name: 'Duplicar proposta' });
    fireEvent.click(duplicateButton);
    fireEvent.click(duplicateButton);

    expect(proposalActions.duplicateProposal).toHaveBeenCalledOnce();
    expect(duplicateButton).toBeDisabled();
    expect(duplicateButton).toHaveTextContent('Duplicando proposta...');
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

  it('asks before leaving a dirty editable proposal and keeps the draft when cancelled', async () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isDirty = true;
    wizard.state.proposalMeta = { id: 'proposal-1', title: 'Proposta existente', status: 'Rascunho' };

    const { router } = renderPage();
    fireEvent.click(screen.getByRole('link', { name: 'Sair do editor' }));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Descartar alterações?' })).toBeInTheDocument();
    expect(screen.getByText('As alterações feitas nesta proposta ainda não foram salvas.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/generator/proposal-1/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/generator/proposal-1/edit');
    expect(wizard.state.isDirty).toBe(true);
  });

  it('discards the draft and performs the pending navigation once confirmed', async () => {
    resetWizard();
    wizard.state.mode = 'edit';
    wizard.state.isDirty = true;
    wizard.state.proposalMeta = { id: 'proposal-1', title: 'Proposta existente', status: 'Rascunho' };

    const { router } = renderPage();
    fireEvent.click(screen.getByRole('link', { name: 'Sair do editor' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar alterações' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/opportunities'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it.each([
    { label: 'create', mode: 'create' as const, isDirty: true, isLocked: false, isSaving: false },
    { label: 'clean', mode: 'edit' as const, isDirty: false, isLocked: false, isSaving: false },
    { label: 'locked', mode: 'edit' as const, isDirty: true, isLocked: true, isSaving: false },
    { label: 'saving', mode: 'edit' as const, isDirty: true, isLocked: false, isSaving: true },
  ])('does not block navigation in a $label session', async ({ mode, isDirty, isLocked, isSaving }) => {
    resetWizard();
    Object.assign(wizard.state, {
      mode,
      isDirty,
      isLocked,
      isSaving,
      proposalMeta: mode === 'edit'
        ? { id: 'proposal-1', title: 'Proposta existente', status: isLocked ? 'Aprovada' : 'Rascunho' }
        : null,
    });

    const { router } = renderPage();
    fireEvent.click(screen.getByRole('link', { name: 'Sair do editor' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/opportunities'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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
