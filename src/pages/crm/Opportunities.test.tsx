import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Opportunities from './Opportunities';

const proposal = (overrides: Record<string, unknown> = {}) => ({
  id: 'proposal-1',
  title: 'Proposta editável',
  amount: 1500,
  client_id: 'client-1',
  status: 'Rascunho',
  owner: 'user-1',
  created_at: '2026-07-20T10:00:00.000Z',
  updated_at: '2026-07-20T10:00:00.000Z',
  share_token: 'share-token',
  notes: null,
  expected_close_date: null,
  clients: { name: 'Cliente', email: 'cliente@example.com', company: 'Empresa', phone: null },
  app_users: { name: 'Usuário' },
  ...overrides,
});

const proposals = [proposal(), proposal({ id: 'proposal-2', title: 'Proposta finalizada', status: 'Aprovada' })];
const proposalsApi = {
  proposals,
  allProposals: proposals,
  loading: false,
  filters: { status: 'all', ownerId: 'all', search: '', sortBy: 'created_at', sortOrder: 'desc', period: 'all', dateField: 'created_at' },
  setFilters: vi.fn(),
  currentPage: 1,
  setCurrentPage: vi.fn(),
  totalPages: 1,
  totalItems: 2,
  itemsPerPage: 10,
  createProposal: vi.fn(),
  createDraftProposal: vi.fn(),
  getProposalByShareToken: vi.fn(),
  updateProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  duplicateProposal: vi.fn(),
  deleteProposal: vi.fn(),
  refetch: vi.fn(),
};

vi.mock('@/hooks/useProposals', () => ({ useProposals: () => proposalsApi }));
vi.mock('@/hooks/useSession', () => ({ useSession: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/hooks/useClients', () => ({ useClients: () => ({ clients: [], updateClient: vi.fn() }) }));
vi.mock('@/hooks/useUsers', () => ({ useUsers: () => ({ allUsers: [] }) }));
vi.mock('@/context/CurrencyContext', () => ({ useCurrency: () => ({ formatCurrency: (value: number) => `R$ ${value}` }) }));
vi.mock('@/components/MainLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/DuplicateProposalModal', () => ({ default: () => null }));

const LocationState = () => {
  const location = useLocation();
  return <output data-testid="location">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
};

const renderOpportunities = () => {
  localStorage.setItem('opportunities-view', 'list');
  return render(
    <MemoryRouter initialEntries={['/crm/opportunities']}>
      <Opportunities />
      <LocationState />
    </MemoryRouter>,
  );
};

describe('Opportunities proposal actions', () => {
  it('routes editable proposals from the list to their canonical edit route with a return location', () => {
    renderOpportunities();

    fireEvent.click(screen.getByRole('button', { name: 'Editar Proposta editável' }));

    expect(screen.getByTestId('location')).toHaveTextContent(JSON.stringify({
      pathname: '/generator/proposal-1/edit',
      state: { returnTo: '/crm/opportunities' },
    }));
  });

  it('blocks editing finalized proposals while retaining view and duplicate actions in the list', () => {
    renderOpportunities();

    expect(screen.getByRole('button', {
      name: 'Editar Proposta finalizada. Proposta finalizada: duplique para editar',
    })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Visualizar Proposta finalizada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicar Proposta finalizada' })).toBeInTheDocument();
  });
});
