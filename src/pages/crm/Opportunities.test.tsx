import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const renderOpportunities = (view: 'kanban' | 'list' | 'table') => {
  localStorage.setItem('opportunities-view', view);
  return render(
    <MemoryRouter initialEntries={['/crm/opportunities']}>
      <Opportunities />
      <LocationState />
    </MemoryRouter>,
  );
};

const expectEditRoute = () => {
  expect(screen.getByTestId('location')).toHaveTextContent(JSON.stringify({
    pathname: '/generator/proposal-1/edit',
    state: { returnTo: '/crm/opportunities' },
  }));
};

const openKanbanActions = (title: string) => {
  const trigger = screen.getByRole('button', { name: `Mais ações para ${title}` });
  fireEvent.keyDown(trigger, { key: 'Enter' });
};

afterEach(() => {
  proposals.splice(2);
  localStorage.clear();
  proposalsApi.duplicateProposal.mockReset();
  proposalsApi.updateProposalStatus.mockReset();
});

describe('Opportunities proposal actions', () => {
  it('groups the canonical NEGOCIACAO status in the negotiation Kanban column', () => {
    proposals.push(proposal({
      id: 'proposal-negotiation',
      title: 'Proposta em negociação',
      status: 'NEGOCIACAO',
    }));

    renderOpportunities('kanban');

    const negotiationColumn = screen.getByRole('heading', { name: /Em Negociação/ }).parentElement;
    const elaborationColumn = screen.getByRole('heading', { name: /Em Elaboração/ }).parentElement;

    expect(negotiationColumn).not.toBeNull();
    expect(elaborationColumn).not.toBeNull();
    expect(within(negotiationColumn!).getByRole('heading', { name: 'Proposta em negociação' })).toBeInTheDocument();
    expect(within(elaborationColumn!).queryByRole('heading', { name: 'Proposta em negociação' })).not.toBeInTheDocument();
  });

  it('routes editable proposals from the list to their canonical edit route with a return location', () => {
    renderOpportunities('list');

    fireEvent.click(screen.getByRole('button', { name: 'Editar Proposta editável' }));

    expectEditRoute();
  });

  it('routes editable proposals from the Kanban action menu to their canonical edit route', async () => {
    renderOpportunities('kanban');

    openKanbanActions('Proposta editável');
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }));

    expectEditRoute();
  });

  it('routes editable proposals from the table to their canonical edit route', () => {
    renderOpportunities('table');

    fireEvent.click(screen.getByRole('button', { name: 'Editar Proposta editável' }));

    expectEditRoute();
  });

  it('keeps finalized Kanban cards non-draggable and preserves view and duplicate actions', async () => {
    renderOpportunities('kanban');

    const card = screen.getByRole('heading', { name: 'Proposta finalizada' }).closest('[draggable]');
    expect(card).toHaveAttribute('draggable', 'false');
    expect(card).not.toHaveClass('cursor-grab');

    openKanbanActions('Proposta finalizada');

    expect(await screen.findByRole('menuitem', { name: /Editar indisponível/ })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('menuitem', { name: 'Visualizar' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toBeInTheDocument();
  });

  it('blocks finalized proposals in the table before opening their detail', () => {
    renderOpportunities('table');

    expect(screen.getByRole('combobox', { name: 'Status Proposta finalizada' })).toBeDisabled();
    expect(screen.getByRole('button', {
      name: 'Editar Proposta finalizada. Proposta finalizada: duplique para editar',
    })).toBeDisabled();
  });

  it('keeps finalized detail fields read-only and duplicates into an editable copy', async () => {
    proposalsApi.duplicateProposal.mockResolvedValue({ data: { id: 'proposal-copy-1' }, error: null });
    renderOpportunities('table');

    fireEvent.click(screen.getByRole('button', { name: 'Visualizar Proposta finalizada' }));

    expect(screen.queryByRole('button', { name: 'Editar Título da Proposta' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Proposta finalizada: duplique para editar.');

    fireEvent.click(screen.getByRole('button', { name: 'Duplicar Proposta finalizada para editar' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(JSON.stringify({
      pathname: '/generator/proposal-copy-1/edit',
      state: { returnTo: '/crm/opportunities' },
    })));
  });
});
