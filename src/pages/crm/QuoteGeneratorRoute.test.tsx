import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/QuoteWizardContext', () => ({
  QuoteWizardProvider: ({ children, mode, proposalId }: { children: React.ReactNode; mode: string; proposalId?: string }) => (
    <div data-testid="provider" data-mode={mode} data-proposal-id={proposalId}>{children}</div>
  ),
}));
vi.mock('./QuoteGeneratorPage', () => ({ default: () => <div>Gerador</div> }));

import QuoteGeneratorRoute from './QuoteGeneratorRoute';

const renderRoute = (entry: string, mode: 'create' | 'edit') => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/generator" element={<QuoteGeneratorRoute userId="user-1" mode={mode} />} />
      <Route path="/generator/:proposalId/edit" element={<QuoteGeneratorRoute userId="user-1" mode="edit" />} />
    </Routes>
  </MemoryRouter>,
);

describe('QuoteGeneratorRoute', () => {
  it('redirects a legacy create query to the edit route', () => {
    renderRoute('/generator?proposalId=proposal%201', 'create');

    expect(screen.getByTestId('provider')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByTestId('provider')).toHaveAttribute('data-proposal-id', 'proposal 1');
  });

  it('mounts an edit provider scoped to the route proposal ID', () => {
    renderRoute('/generator/proposal-1/edit', 'edit');

    expect(screen.getByTestId('provider')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByTestId('provider')).toHaveAttribute('data-proposal-id', 'proposal-1');
  });
});
