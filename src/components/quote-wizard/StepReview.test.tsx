import { forwardRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ navigate: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const wizard = vi.hoisted(() => ({
  state: {
    mode: 'edit',
    selectedServices: [{ id: 'service-1' }],
    clientInfo: { name: 'Cliente', email: 'cliente@example.com' },
    cashDiscountPercentage: 0,
    calculateOriginalSubtotal: () => 100,
    calculateTotal: () => 100,
    calculateCashDiscount: () => 0,
    calculateFinalTotal: () => 100,
    getSelectedPayment: () => ({ name: 'À vista', fee: 0, installments: 1, type: 'cash' as const }),
    getTotalInstallmentValue: () => 0,
    notes: '',
    isValidityEnabled: false,
    validityDays: 0,
    proposalTitle: 'Proposta existente',
    proposalLogoUrl: '',
    proposalGradientTheme: 'conexhub' as const,
    generatedShareLink: 'http://localhost/p/share-token',
    isGeneratingLink: false,
    paymentType: 'cash' as const,
    installmentValue: 0,
    manualInstallmentTotal: null,
    isSaving: false,
    saveError: null as string | null,
    saveProposalChanges: vi.fn(),
    reloadProposal: vi.fn(),
  },
}));

vi.mock('@/components/QuoteResult', () => ({
  default: forwardRef(() => <div data-testid="quote-result" />),
}));
vi.mock('@/hooks/useSession', () => ({ useSession: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/context/QuoteWizardContext', () => ({ useQuoteWizard: () => wizard.state }));
vi.mock('sonner', () => ({ toast }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigation.navigate,
  useLocation: () => ({ state: { returnTo: '/clients' } }),
}));

import StepReview from './StepReview';

describe('StepReview edit mode', () => {
  it('replaces legacy creation controls with explicit save actions', () => {
    render(<StepReview />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visualizar proposta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar Proposta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerar Link Compartilhável' })).not.toBeInTheDocument();
  });

  it('saves explicitly once and returns to an allowed origin after success', async () => {
    wizard.state.saveProposalChanges.mockResolvedValueOnce(true);

    render(<StepReview />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(wizard.state.saveProposalChanges).toHaveBeenCalledOnce());
    expect(toast.success).toHaveBeenCalledWith('Alterações salvas com sucesso.');
    expect(navigation.navigate).toHaveBeenCalledWith('/clients', { replace: true });
  });
});
