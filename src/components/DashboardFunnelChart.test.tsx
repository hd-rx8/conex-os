import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FunnelChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Funnel: () => <div data-testid="conversion-funnel" />,
  Tooltip: () => null,
  Cell: () => null,
}));

import DashboardFunnelChart from './DashboardFunnelChart';

describe('DashboardFunnelChart', () => {
  it('keeps the conversion funnel and its stage summary', () => {
    render(
      <DashboardFunnelChart
        isLoading={false}
        data={[
          {
            stage: 'Total de Propostas',
            status: 'all',
            count: 10,
            valueSum: 5000,
          },
          {
            stage: 'Em Negociação',
            status: 'Negociando',
            count: 4,
            valueSum: 2000,
          },
          {
            stage: 'Aprovadas',
            status: 'Aprovada',
            count: 2,
            valueSum: 1000,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Funil de Conversão' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('conversion-funnel')).toBeInTheDocument();
    expect(screen.getByText('10 propostas no período')).toBeInTheDocument();
  });

  it('shows an empty state instead of a fictitious funnel when every stage is zero', () => {
    render(
      <DashboardFunnelChart
        isLoading={false}
        data={[
          {
            stage: 'Total de Propostas',
            status: 'all',
            count: 0,
            valueSum: 0,
          },
          {
            stage: 'Enviadas ou posteriores',
            status: 'advanced',
            count: 0,
            valueSum: 0,
          },
          {
            stage: 'Aprovadas',
            status: 'Aprovada',
            count: 0,
            valueSum: 0,
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        'Nenhuma proposta encontrada para os filtros selecionados.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('conversion-funnel')).not.toBeInTheDocument();
  });
});
