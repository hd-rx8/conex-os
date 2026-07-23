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
  BarChart: () => <div data-testid="monthly-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import DashboardBarChart from './DashboardBarChart';

describe('DashboardBarChart', () => {
  it('shows an empty state when the filtered dataset has no monthly values', () => {
    render(<DashboardBarChart data={[]} isLoading={false} />);

    expect(
      screen.getByText(
        'Nenhuma proposta encontrada para os filtros selecionados.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('monthly-chart')).not.toBeInTheDocument();
  });
});
