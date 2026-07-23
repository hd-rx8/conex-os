import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

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
  useQuoteWizard: () => ({
    currentStep: 0,
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    steps: [
      { id: 'services', label: 'Serviços' },
      { id: 'settings', label: 'Dados' },
      { id: 'client', label: 'Cliente' },
      { id: 'review', label: 'Revisão' },
    ],
    selectedServices: [],
    clientInfo: { name: '', email: '' },
    proposalTitle: '',
  }),
}));

import QuoteGeneratorPage from './QuoteGeneratorPage';

describe('QuoteGeneratorPage', () => {
  it('keeps wizard validation inside the standardized page shell', () => {
    render(<QuoteGeneratorPage userId="user-1" />);

    expect(
      screen.getByRole('heading', { name: 'Gerador de propostas' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
  });
});
