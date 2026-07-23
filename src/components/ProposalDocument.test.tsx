import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProposalSnapshot } from '@/types/proposalSnapshot';

vi.mock('@/context/GradientThemeContext', () => ({
  useGradientTheme: () => ({
    pdfHeaderGradientMap: { conexhub: 'linear-gradient(#000, #111)' },
  }),
}));

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  }),
}));

import ProposalDocument from './ProposalDocument';

const snapshot: ProposalSnapshot = {
  id: 'proposal-1',
  title: 'Proposta',
  amount: 120,
  status: 'Enviada',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T10:00:00.000Z',
  client: {
    id: 'client-1', name: 'Cliente', email: 'cliente@example.com', company: 'Empresa', phone: '11999999999',
  },
  services: [],
  payment: {
    type: 'installment',
    cash_discount_percentage: 0,
    installment_number: 2,
    installment_value: 60,
    manual_installment_total: 120,
    show_interest_rate: false,
  },
  validity: { enabled: false, days: 0 },
  theme: {
    logo_url: '/logo.png', resolved_logo_url: '/logo.png', gradient_theme: 'conexhub',
  },
  totals: {
    oneTimeTotal: 100, monthlyTotal: 0, subtotal: 100, totalCash: 100, totalInstallment: 120,
  },
};

describe('ProposalDocument', () => {
  it('hides the interest-rate row when the persisted preference is false', () => {
    render(<ProposalDocument snapshot={snapshot} />);

    expect(screen.queryByText('Taxa de juros:')).not.toBeInTheDocument();
  });

  it('shows the calculated interest-rate row when the persisted preference is true', () => {
    render(<ProposalDocument snapshot={{
      ...snapshot,
      payment: { ...snapshot.payment, show_interest_rate: true },
    }} />);

    expect(screen.getByText('Taxa de juros:')).toBeInTheDocument();
    expect(screen.getByText('20.00%')).toBeInTheDocument();
  });
});
