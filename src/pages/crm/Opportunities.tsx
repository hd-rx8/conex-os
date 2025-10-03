import React, { useState, useEffect, useCallback } from 'react';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { useSession } from '@/hooks/useSession';
import { useClients, Client, UpdateClientData } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import MainLayout from '@/components/MainLayout';
import ViewSwitcher, { ViewType } from '@/components/ViewSwitcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  DollarSign,
  Calendar,
  Building,
  User as UserIcon,
  Plus,
  Edit,
  Eye,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useNavigate } from 'react-router-dom';
import EditableField from '@/components/EditableField';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DuplicateProposalModal from '@/components/DuplicateProposalModal';

// Define os status possíveis para as propostas
const PROPOSAL_STATUSES = ['Rascunho', 'Criada', 'Enviada', 'Negociando', 'Aprovada', 'Rejeitada'] as const;
type ProposalStatus = typeof PROPOSAL_STATUSES[number];

// Status do Kanban
const KANBAN_STATUSES: ProposalStatus[] = ['Rascunho', 'Criada', 'Enviada', 'Negociando', 'Aprovada', 'Rejeitada'];

const getStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case 'Rascunho': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300';
    case 'Criada': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-gray-700/50 dark:text-gray-300';
    case 'Enviada': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Negociando': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300';
    case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300';
    case 'Rejeitada': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300';
  }
};

const getStatusClasses = (status: Proposal['status']) => {
  switch (status) {
    case 'Rascunho': return 'bg-purple-200/50 text-purple-700 hover:bg-purple-200/80 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800/70';
    case 'Criada': return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
    case 'Enviada': return 'bg-yellow-200/50 text-yellow-700 hover:bg-yellow-200/80 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-800/70';
    case 'Negociando': return 'bg-orange-200/50 text-orange-700 hover:bg-orange-200/80 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-800/70';
    case 'Aprovada': return 'bg-green-200/50 text-green-700 hover:bg-green-200/80 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/70';
    case 'Rejeitada': return 'bg-red-200/50 text-red-700 hover:bg-red-200/80 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/70';
    default: return 'bg-gray-200/50 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/70';
  }
};

const getStatusIcon = (status: ProposalStatus) => {
  switch (status) {
    case 'Rascunho': return '📝';
    case 'Criada': return '📋';
    case 'Enviada': return '📤';
    case 'Negociando': return '🤝';
    case 'Aprovada': return '✅';
    case 'Rejeitada': return '❌';
    default: return '📄';
  }
};

const Opportunities: React.FC = () => {
  const { user: currentUser } = useSession();
  const {
    proposals,
    allProposals,
    loading,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    updateProposalStatus,
    updateProposal,
    deleteProposal,
    duplicateProposal,
    refetch
  } = useProposals();
  const { clients: allClients, updateClient } = useClients();
  const { allUsers } = useUsers();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  // View state
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('opportunities-view');
    return (savedView as ViewType) || 'kanban';
  });

  // Kanban states
  const [groupedProposals, setGroupedProposals] = useState<Record<ProposalStatus, Proposal[]>>(() => {
    const initialGroups: Record<ProposalStatus, Proposal[]> = {} as Record<ProposalStatus, Proposal[]>;
    PROPOSAL_STATUSES.forEach(status => {
      initialGroups[status] = [];
    });
    return initialGroups;
  });

  const [draggingProposalId, setDraggingProposalId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sheet states
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Duplicate state
  const [duplicatingProposal, setDuplicatingProposal] = useState<Proposal | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Save view to localStorage
  useEffect(() => {
    localStorage.setItem('opportunities-view', currentView);
  }, [currentView]);

  // Apply filters to proposals
  const filterProposals = useCallback((proposalList: Proposal[]) => {
    return proposalList.filter(proposal => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          proposal.title.toLowerCase().includes(searchLower) ||
          proposal.clients?.name?.toLowerCase().includes(searchLower) ||
          proposal.app_users?.name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Owner filter
      if (filterOwner !== 'all' && proposal.owner !== filterOwner) {
        return false;
      }

      // Client filter
      if (filterClient !== 'all' && proposal.client_id !== filterClient) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && proposal.status !== filterStatus) {
        return false;
      }

      // Period filter
      if (filterPeriod !== 'all') {
        const now = new Date();
        const proposalDate = new Date(proposal.created_at);
        let filterDate = new Date();

        switch (filterPeriod) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            filterDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            filterDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            filterDate.setDate(now.getDate() - 90);
            break;
        }

        if (proposalDate < filterDate) return false;
      }

      return true;
    });
  }, [searchTerm, filterOwner, filterClient, filterStatus, filterPeriod]);

  // Sort proposals
  const sortProposals = useCallback((proposalList: Proposal[]) => {
    return [...proposalList].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'amount':
          aValue = Number(a.amount);
          bValue = Number(b.amount);
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [sortBy, sortOrder]);

  // Update grouped proposals for kanban view
  useEffect(() => {
    if (allProposals && currentView === 'kanban') {
      const filteredProposals = filterProposals(allProposals);
      const sortedProposals = sortProposals(filteredProposals);

      const newGroupedProposals: Record<ProposalStatus, Proposal[]> = {} as Record<ProposalStatus, Proposal[]>;
      PROPOSAL_STATUSES.forEach(status => {
        newGroupedProposals[status] = [];
      });

      sortedProposals.forEach(proposal => {
        if (PROPOSAL_STATUSES.includes(proposal.status as ProposalStatus)) {
          newGroupedProposals[proposal.status as ProposalStatus].push(proposal);
        } else {
          newGroupedProposals['Criada'].push(proposal);
        }
      });
      setGroupedProposals(newGroupedProposals);
    }
  }, [allProposals, currentView, filterProposals, sortProposals]);

  // Sync filters with useProposals hook for list and table views
  useEffect(() => {
    if (currentView !== 'kanban') {
      setFilters({
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? (filterStatus as Proposal['status']) : undefined,
        ownerId: filterOwner !== 'all' ? filterOwner : undefined,
        clientId: filterClient !== 'all' ? filterClient : undefined,
      });
    }
  }, [searchTerm, filterStatus, filterOwner, filterClient, currentView, setFilters]);

  // Kanban handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, proposalId: string) => {
    setDraggingProposalId(proposalId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', proposalId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: ProposalStatus) => {
    e.preventDefault();
    if (!draggingProposalId) return;

    const proposalId = e.dataTransfer.getData('text/plain');
    const proposalToMove = allProposals.find(p => p.id === proposalId);

    if (proposalToMove && proposalToMove.status !== newStatus) {
      // Optimistic UI update
      setGroupedProposals(prev => {
        const newGroups = { ...prev };
        PROPOSAL_STATUSES.forEach(status => {
          newGroups[status] = newGroups[status].filter(p => p.id !== proposalId);
        });
        newGroups[newStatus] = [...newGroups[newStatus], { ...proposalToMove, status: newStatus }];
        return newGroups;
      });
      setSelectedProposal(prev => prev?.id === proposalId ? { ...prev, status: newStatus } : prev);

      const { error } = await updateProposalStatus(proposalId, newStatus);
      if (error) {
        toast.error('Erro ao atualizar status da proposta.');
        refetch();
      } else {
        toast.success(`Proposta "${proposalToMove.title}" movida para "${newStatus}"`);
        refetch();
      }
    }
    setDraggingProposalId(null);
    setIsDragging(false);
  };

  // Common handlers
  const handleCardClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsSheetOpen(true);
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta proposta?')) {
      const { error } = await deleteProposal(proposalId);
      if (error) {
        toast.error('Erro ao excluir proposta.');
      } else {
        toast.success('Proposta excluída com sucesso.');
      }
    }
  };

  const handleDuplicateProposal = (proposal: Proposal) => {
    setDuplicatingProposal(proposal);
  };

  const handleDuplicateWithOptions = async (proposalId: string, newClientId: string | null, newTitle: string) => {
    if (!currentUser) return;

    const result = await duplicateProposal(proposalId, currentUser.id, {
      newClientId,
      newTitle
    });

    if (result.data) {
      toast.success('Proposta duplicada com sucesso!');
    } else if (result.error) {
      console.error('Duplicate error:', result.error);
      toast.error('Erro ao duplicar proposta: ' + (result.error.message || 'Erro desconhecido'));
    }
  };

  const handlePrintProposal = (proposalId: string) => {
    if (proposalId) {
      window.open(`/proposals/${proposalId}/print`, '_blank');
    } else {
      toast.error('ID da proposta não disponível.');
    }
  };

  const handleStatusChange = async (proposal: Proposal, newStatus: Proposal['status']) => {
    await updateProposalStatus(proposal.id, newStatus);
  };

  const handleUpdateProposalField = useCallback(async (field: keyof Proposal, newValue: string | number | Date | null) => {
    if (!selectedProposal || !currentUser) return;

    setIsSaving(prev => ({ ...prev, [field]: true }));
    try {
      let updateData: Partial<Proposal> = {};
      if (newValue instanceof Date) {
        updateData[field] = newValue.toISOString() as any;
      } else {
        updateData[field] = newValue as any;
      }

      const { data, error } = await updateProposal(selectedProposal.id, updateData);

      if (error) {
        toast.error(`Erro ao atualizar ${field}: ${error.message}`);
        refetch();
      } else {
        setSelectedProposal(prev => prev ? { ...prev, ...updateData } : null);
        toast.success(`Campo atualizado com sucesso!`);
        refetch();
      }
    } catch (err: any) {
      console.error(`Error updating proposal ${field}:`, err);
      toast.error(`Erro ao atualizar campo.`);
    } finally {
      setIsSaving(prev => ({ ...prev, [field]: false }));
    }
  }, [selectedProposal, currentUser, updateProposal, refetch]);

  const handleUpdateClientField = useCallback(async (field: keyof Client, newValue: string | null) => {
    if (!selectedProposal?.client_id || !currentUser) return;

    setIsSaving(prev => ({ ...prev, [`client_${field}`]: true }));
    try {
      const updateData: UpdateClientData = { [field]: newValue };
      const { data, error } = await updateClient(selectedProposal.client_id, updateData);

      if (error) {
        toast.error(`Erro ao atualizar cliente: ${error.message}`);
        refetch();
      } else {
        setSelectedProposal(prev => prev ? {
          ...prev,
          clients: prev.clients ? { ...prev.clients, [field]: newValue } : prev.clients
        } : null);
        toast.success(`Campo do cliente atualizado com sucesso!`);
        refetch();
      }
    } catch (err: any) {
      console.error(`Error updating client ${field}:`, err);
      toast.error(`Erro ao atualizar campo do cliente.`);
    } finally {
      setIsSaving(prev => ({ ...prev, [`client_${field}`]: false }));
    }
  }, [selectedProposal, currentUser, updateClient, refetch]);

  const handleSelectClient = useCallback(async (newClientId: string | null) => {
    if (!selectedProposal || !currentUser) return;

    setIsSaving(prev => ({ ...prev, 'client_id': true }));
    try {
      const { data, error } = await updateProposal(selectedProposal.id, { client_id: newClientId });

      if (error) {
        toast.error(`Erro ao vincular cliente: ${error.message}`);
        refetch();
      } else {
        const updatedClient = allClients.find(c => c.id === newClientId);
        setSelectedProposal(prev => prev ? { ...prev, client_id: newClientId, clients: updatedClient || null } : null);
        toast.success('Cliente vinculado com sucesso!');
        refetch();
      }
    } catch (err: any) {
      console.error('Error linking client:', err);
      toast.error('Erro ao vincular cliente.');
    } finally {
      setIsSaving(prev => ({ ...prev, 'client_id': false }));
    }
  }, [selectedProposal, currentUser, updateProposal, allClients, refetch]);

  // Kanban Card Component
  const KanbanCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => (
    <Card
      draggable
      onDragStart={(e) => handleDragStart(e, proposal.id)}
      onClick={() => handleCardClick(proposal)}
      className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow duration-200 group border"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
              {proposal.title}
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{proposal.clients?.name || 'Cliente Desconhecido'}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleCardClick(proposal);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleDuplicateProposal(proposal);
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProposal(proposal.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-medium text-conexhub-green-600">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(Number(proposal.amount))}
            </span>
            <Badge variant="outline" className={cn("text-xs", getStatusColor(proposal.status as ProposalStatus))}>
              {getStatusIcon(proposal.status as ProposalStatus)} {proposal.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              <span className="truncate">{proposal.app_users?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(parseISO(proposal.updated_at), 'dd/MM', { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // List Card Component
  const ListCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1 line-clamp-2">{proposal.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span>{proposal.clients?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{proposal.app_users?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-semibold text-conexhub-green-600">
                {formatCurrency(Number(proposal.amount))}
              </span>
              <Badge className={cn("text-xs", getStatusColor(proposal.status as ProposalStatus))}>
                {proposal.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCardClick(proposal)}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePrintProposal(proposal.id)}
              title="Imprimir"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicateProposal(proposal)}
              title="Duplicar"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteProposal(proposal.id)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && currentView === 'kanban') {
    return (
      <MainLayout module="crm">
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Carregando oportunidades...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="crm">
      <div className="space-y-4 relative pb-20">
        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => navigate('/generator')}
          tooltip="Criar Nova Proposta"
          icon={Plus}
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por título, cliente ou responsável..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {allClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                    <SelectItem value="Criada">Criada</SelectItem>
                    <SelectItem value="Enviada">Enviada</SelectItem>
                    <SelectItem value="Negociando">Negociando</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="7days">7 dias</SelectItem>
                    <SelectItem value="30days">30 dias</SelectItem>
                    <SelectItem value="90days">90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as 'created_at' | 'amount' | 'updated_at');
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at-desc">Mais recente</SelectItem>
                    <SelectItem value="updated_at-asc">Mais antigo</SelectItem>
                    <SelectItem value="amount-desc">Maior valor</SelectItem>
                    <SelectItem value="amount-asc">Menor valor</SelectItem>
                    <SelectItem value="created_at-desc">Criado recente</SelectItem>
                    <SelectItem value="created_at-asc">Criado antigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban View */}
        {currentView === 'kanban' && (
          <div className="relative">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex space-x-4 p-4 min-h-[600px] items-start">
                {KANBAN_STATUSES.map(status => (
                  <div
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className={cn(
                      "flex-shrink-0 w-72 sm:w-80 bg-muted/40 rounded-lg p-4 shadow-sm border",
                      draggingProposalId && "border-dashed border-primary"
                    )}
                  >
                    <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">{getStatusIcon(status)}</span>
                        <span className="truncate">{status}</span>
                      </span>
                      <Badge variant="secondary" className={cn("text-xs", getStatusColor(status))}>
                        {groupedProposals[status]?.length || 0}
                      </Badge>
                    </h3>
                    <div className="space-y-3 min-h-[100px]">
                      {groupedProposals[status]?.map(proposal => (
                        <KanbanCard key={proposal.id} proposal={proposal} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {isDragging && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg w-full max-w-lg">
                <div className="flex justify-center gap-2 p-2">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'Aprovada')}
                    className="flex-1 py-2 px-4 rounded-md bg-green-600 text-white text-sm font-semibold flex items-center justify-center transition-colors duration-300 hover:bg-green-700 cursor-pointer border-2 border-transparent hover:border-white"
                  >
                    ✅ APROVADA
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'Rejeitada')}
                    className="flex-1 py-2 px-4 rounded-md bg-red-600 text-white text-sm font-semibold flex items-center justify-center transition-colors duration-300 hover:bg-red-700 cursor-pointer border-2 border-transparent hover:border-white"
                  >
                    ❌ REJEITADA
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {currentView === 'list' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Propostas</CardTitle>
                <Badge variant="secondary">
                  {totalItems} proposta{totalItems !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma proposta encontrada
                  </div>
                ) : (
                  proposals.map((proposal) => (
                    <ListCard key={proposal.id} proposal={proposal} />
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Table View */}
        {currentView === 'table' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tabela de Propostas</CardTitle>
                <Badge variant="secondary">
                  {totalItems} proposta{totalItems !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border-r min-w-[100px]">Data</TableHead>
                      <TableHead className="border-r min-w-[200px]">Título</TableHead>
                      <TableHead className="border-r min-w-[150px]">Cliente</TableHead>
                      <TableHead className="border-r min-w-[120px]">Valor</TableHead>
                      <TableHead className="border-r min-w-[120px]">Status</TableHead>
                      <TableHead className="text-right min-w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : proposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma proposta encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      proposals.map((proposal) => (
                        <TableRow key={proposal.id} className="h-12">
                          <TableCell className="border-r py-2">
                            {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium border-r py-2">
                            {proposal.title}
                          </TableCell>
                          <TableCell className="border-r py-2">
                            {proposal.clients?.name || '-'}
                          </TableCell>
                          <TableCell className="border-r py-2">
                            {formatCurrency(Number(proposal.amount))}
                          </TableCell>
                          <TableCell className="border-r p-0">
                            <Select
                              value={proposal.status}
                              onValueChange={(value) => handleStatusChange(proposal, value as Proposal['status'])}
                            >
                              <SelectTrigger
                                className={`w-full h-full justify-center rounded-none border-none bg-transparent py-1 px-2 text-xs font-semibold uppercase tracking-wider transition-colors focus:ring-0 focus:ring-offset-0 ${getStatusClasses(
                                  proposal.status
                                )}`}
                              >
                                <span className="flex items-center">{proposal.status}</span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Rascunho">Rascunho</SelectItem>
                                <SelectItem value="Criada">Criada</SelectItem>
                                <SelectItem value="Enviada">Enviada</SelectItem>
                                <SelectItem value="Negociando">Negociando</SelectItem>
                                <SelectItem value="Aprovada">Aprovada</SelectItem>
                                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCardClick(proposal)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintProposal(proposal.id)}
                                title="Imprimir"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateProposal(proposal)}
                                title="Duplicar"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProposal(proposal.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Side Panel for Proposal Details */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            {selectedProposal && (
              <ScrollArea className="h-[calc(100vh-24px)] pr-4">
                <div className="py-4 space-y-6">
                  {/* Header with Title */}
                  <div className="space-y-2">
                    <SheetHeader className="text-left">
                      <SheetTitle className="sr-only">Detalhes da Proposta</SheetTitle>
                    </SheetHeader>

                    <div className="space-y-1">
                      <EditableField
                        value={selectedProposal.title}
                        onSave={(newValue) => handleUpdateProposalField('title', newValue)}
                        type="text"
                        placeholder="Título da Proposta"
                        isLoading={isSaving.title}
                        disabled={selectedProposal.owner !== currentUser?.id}
                        displayClassName="text-2xl font-bold gradient-text"
                        label="Título da Proposta"
                        required={true}
                      />
                      <p className="text-sm text-muted-foreground">
                        Detalhes completos da proposta.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Status and Basic Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Status:</p>
                        <EditableField
                          value={selectedProposal.status}
                          onSave={(newValue) => handleUpdateProposalField('status', newValue)}
                          type="select"
                          selectOptions={PROPOSAL_STATUSES.map(s => ({ value: s, label: s }))}
                          isLoading={isSaving.status}
                          disabled={selectedProposal.owner !== currentUser?.id}
                          formatDisplayValue={(value) => (
                            <Badge className={getStatusColor(value as ProposalStatus)}>
                              {value}
                            </Badge>
                          )}
                          label="Status"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Valor:</p>
                        <EditableField
                          value={selectedProposal.amount}
                          onSave={(newValue) => handleUpdateProposalField('amount', newValue)}
                          type="number"
                          placeholder="0.00"
                          isLoading={isSaving.amount}
                          disabled={selectedProposal.owner !== currentUser?.id}
                          formatDisplayValue={(value) => (
                            <span className="font-semibold text-conexhub-green-600">
                              {formatCurrency(Number(value))}
                            </span>
                          )}
                          label="Valor"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Criada em:</p>
                        <EditableField
                          value={parseISO(selectedProposal.created_at)}
                          onSave={(newValue) => handleUpdateProposalField('created_at', newValue)}
                          type="date"
                          placeholder="Selecione a data"
                          isLoading={isSaving.created_at}
                          disabled={selectedProposal.owner !== currentUser?.id}
                          label="Data de Criação"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Previsão de Fechamento:</p>
                        <EditableField
                          value={selectedProposal.expected_close_date ? parseISO(selectedProposal.expected_close_date) : null}
                          onSave={(newValue) => handleUpdateProposalField('expected_close_date', newValue)}
                          type="date"
                          placeholder="Selecione a data"
                          isLoading={isSaving.expected_close_date}
                          disabled={selectedProposal.owner !== currentUser?.id}
                          label="Previsão de Fechamento"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Última Atualização:</p>
                      <p className="text-sm">
                        {format(parseISO(selectedProposal.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Responsável Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Responsável</h3>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedProposal.app_users?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Responsável pela proposta</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Cliente Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cliente</h3>

                    {selectedProposal.client_id ? (
                      <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Nome:</p>
                          <EditableField
                            value={selectedProposal.clients?.name || ''}
                            onSave={(newValue) => handleUpdateClientField('name', newValue as string)}
                            type="text"
                            placeholder="Nome do Cliente"
                            isLoading={isSaving.client_name}
                            disabled={selectedProposal.owner !== currentUser?.id}
                            displayClassName="font-medium"
                            label="Nome do Cliente"
                            required={true}
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Empresa:</p>
                          <EditableField
                            value={selectedProposal.clients?.company || ''}
                            onSave={(newValue) => handleUpdateClientField('company', newValue as string)}
                            type="text"
                            placeholder="Nome da Empresa"
                            isLoading={isSaving.client_company}
                            disabled={selectedProposal.owner !== currentUser?.id}
                            label="Empresa do Cliente"
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">E-mail:</p>
                          <EditableField
                            value={selectedProposal.clients?.email || ''}
                            onSave={(newValue) => handleUpdateClientField('email', newValue as string)}
                            type="text"
                            placeholder="email@exemplo.com"
                            isLoading={isSaving.client_email}
                            disabled={selectedProposal.owner !== currentUser?.id}
                            label="E-mail do Cliente"
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Telefone:</p>
                          <EditableField
                            value={selectedProposal.clients?.phone || ''}
                            onSave={(newValue) => handleUpdateClientField('phone', newValue as string)}
                            type="text"
                            placeholder="(00) 00000-0000"
                            isLoading={isSaving.client_phone}
                            disabled={selectedProposal.owner !== currentUser?.id}
                            label="Telefone do Cliente"
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectClient(null)}
                          className="mt-2 w-full"
                          disabled={selectedProposal.owner !== currentUser?.id}
                        >
                          Desvincular Cliente
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">Nenhum cliente vinculado.</p>
                        <Select
                          value=""
                          onValueChange={handleSelectClient}
                          disabled={selectedProposal.owner !== currentUser?.id || isSaving.client_id}
                        >
                          <SelectTrigger className="w-full placeholder:text-muted-foreground dark:placeholder:text-muted-foreground placeholder:opacity-80">
                            <SelectValue placeholder="Vincular cliente existente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} {client.email ? `(${client.email})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSaving.client_id && (
                          <div className="flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary mt-2" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Notes Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Observações</h3>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <EditableField
                        value={selectedProposal.notes}
                        onSave={(newValue) => handleUpdateProposalField('notes', newValue)}
                        type="textarea"
                        placeholder="Adicione observações sobre a proposta..."
                        isLoading={isSaving.notes}
                        disabled={selectedProposal.owner !== currentUser?.id}
                        displayClassName="whitespace-pre-wrap"
                        label="Observações"
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </SheetContent>
        </Sheet>

        {/* Duplicate Proposal Modal */}
        <DuplicateProposalModal
          isOpen={!!duplicatingProposal}
          onClose={() => setDuplicatingProposal(null)}
          proposal={duplicatingProposal}
          onDuplicate={handleDuplicateWithOptions}
        />
      </div>
    </MainLayout>
  );
};

export default Opportunities;
