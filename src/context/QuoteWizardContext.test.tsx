import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hookSetShowInterestRate = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useQuoteGenerator', () => ({
  useQuoteGenerator: () => ({
    selectedServices: [],
    clientInfo: { name: '', email: '', company: '', phone: '' },
    selectedPayment: 'cash',
    paymentType: 'cash',
    installmentNumber: 2,
    installmentValue: 0,
    manualInstallmentTotal: null,
    cashDiscountPercentage: 5,
    notes: '',
    isValidityEnabled: true,
    validityDays: 30,
    proposalTitle: '',
    proposalLogoUrl: '',
    proposalGradientTheme: 'conexhub',
    showInterestRate: false,
    addService: vi.fn(),
    removeService: vi.fn(),
    updateServiceQuantity: vi.fn(),
    updateServicePrice: vi.fn(),
    updateServiceDiscount: vi.fn(),
    updateServiceDiscountType: vi.fn(),
    updateServiceFeatures: vi.fn(),
    setClientInfo: vi.fn(),
    setSelectedPayment: vi.fn(),
    setPaymentType: vi.fn(),
    setInstallmentNumber: vi.fn(),
    setInstallmentValue: vi.fn(),
    setManualInstallmentTotal: vi.fn(),
    setCashDiscountPercentage: vi.fn(),
    setNotes: vi.fn(),
    setIsValidityEnabled: vi.fn(),
    setValidityDays: vi.fn(),
    setProposalTitle: vi.fn(),
    setProposalLogoUrl: vi.fn(),
    setProposalGradientTheme: vi.fn(),
    setShowInterestRate: hookSetShowInterestRate,
    calculateSubtotal: () => 0,
    calculateOriginalSubtotal: () => 0,
    calculateTotal: () => 0,
    calculateOneTimeTotal: () => 0,
    calculateMonthlyTotal: () => 0,
    calculateCashDiscount: () => 0,
    calculateCashTotal: () => 0,
    calculateFinalTotal: () => 0,
    calculateInstallmentInterestRate: () => 0,
    getTotalInstallmentValue: () => 0,
    getSelectedPayment: () => ({
      name: 'À vista',
      fee: 0,
      installments: 1,
      type: 'cash' as const,
    }),
    clearQuote: vi.fn(),
    services: [],
    paymentOptions: [],
  }),
}));

vi.mock('@/hooks/useCustomServices', () => ({
  useCustomServices: () => ({
    customServices: [],
    fetchCustomServices: vi.fn(),
    createCustomService: vi.fn(),
    updateCustomService: vi.fn(),
    deleteCustomService: vi.fn(),
  }),
}));

vi.mock('@/hooks/useProposals', () => ({
  useProposals: () => ({ createProposal: vi.fn(), createDraftProposal: vi.fn() }),
}));

vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({ clients: [], fetchClients: vi.fn(), createClient: vi.fn() }),
}));

import { QuoteWizardProvider, useQuoteWizard } from './QuoteWizardContext';

const InterestRateControl = () => {
  const { showInterestRate, setShowInterestRate } = useQuoteWizard();

  return (
    <button onClick={() => setShowInterestRate(true)}>
      {String(showInterestRate)}
    </button>
  );
};

describe('QuoteWizardProvider', () => {
  beforeEach(() => {
    hookSetShowInterestRate.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('uses the hook interest-rate state and setter as the UI source', () => {
    render(
      <QuoteWizardProvider userId="user-1">
        <InterestRateControl />
      </QuoteWizardProvider>,
    );

    const control = screen.getByRole('button', { name: 'false' });
    fireEvent.click(control);

    expect(hookSetShowInterestRate).toHaveBeenCalledWith(true);
  });
});
