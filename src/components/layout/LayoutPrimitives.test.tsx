import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { ContentCard } from './ContentCard';
import { MetricCard } from './MetricCard';
import { PageHeader } from './PageHeader';
import { PageToolbar } from './PageToolbar';

describe('layout primitives', () => {
  it('renders page hierarchy and actions', () => {
    render(
      <PageHeader
        eyebrow="CRM"
        title="Dashboard"
        description="Visão comercial"
        actions={<button type="button">Novo</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('Visão comercial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument();
  });

  it('renders metric, toolbar and content surfaces', () => {
    render(
      <>
        <PageToolbar>
          <label>
            Buscar
            <input />
          </label>
        </PageToolbar>
        <MetricCard
          label="Propostas"
          value="12"
          detail="no período"
          icon={Activity}
        />
        <ContentCard title="Recentes">
          <p>Conteúdo</p>
        </ContentCard>
      </>,
    );

    expect(screen.getByText('Buscar')).toBeInTheDocument();
    expect(screen.getByText('Propostas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Recentes')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('uses a stable skeleton when a metric is loading', () => {
    render(<MetricCard label="Receita" value="R$ 0" loading />);

    expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
  });
});
