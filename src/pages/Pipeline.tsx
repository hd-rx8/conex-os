import React, { useState, useEffect, useCallback } from 'react';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { useSession } from '@/hooks/useSession';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, LayoutDashboard as LayoutDashboardIcon, FileText, DollarSign, Calendar, Building, Mail, Phone, User as UserIcon, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EditableField from '@/components/EditableField'; // Import EditableField
import { useClients, Client, UpdateClientData } from '@/hooks/useClients'; // Import useClients and UpdateClientData
import { useUsers, AppUser } from '@/hooks/useUsers'; // Import useUsers and AppUser
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

// Define os status possíveis para as propostas
const PROPOSAL_STATUSES = ['Rascunho', 'Criada', 'Enviada', 'Aprovada', 'Rejeitada'] as const;
type ProposalStatus = typeof PROPOSAL_STATUSES[number];

const getStatusColor = (status: ProposalStatus) => {
  switch (status) {
    case 'Rascunho': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Criada': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Enviada': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200';
    case 'Rejeitada': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Pipeline: React.FC = () => {
  const { user: currentUser } = useSession();
  const { allProposals, loading, updateProposalStatus, updateProposal, refetch } = useProposals();
  const { clients: allClients, updateClient } = useClients(); // Get allClients and updateClient
  const { allUsers } = useUsers(); // Get allUsers
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [groupedProposals, setGroupedProposals] = useState<Record<ProposalStatus, Proposal[]>>(() => {
    const initialGroups: Record<ProposalStatus, Proposal[]> = {} as Record<ProposalStatus, Proposal[]>;
    PROPOSAL_STATUSES.forEach(status => {
      initialGroups[status] = [];
    });
    return initialGroups;
  });
  const [draggingProposalId, setDraggingProposalId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({}); // State to track saving status per field

  useEffect(() => {
    if (allProposals) {
      const newGroupedProposals: Record<ProposalStatus, Proposal[]> = {} as Record<ProposalStatus, Proposal[]>;
      PROPOSAL_STATUSES.forEach(status => {
        newGroupedProposals[status] = [];
      });

      allProposals.forEach(proposal => {
        if (PROPOSAL_STATUSES.includes(proposal.status as ProposalStatus)) {
          newGroupedProposals[proposal.status as ProposalStatus].push(proposal);
        } else {
          newGroupedProposals['Criada'].push(proposal);
        }
      });
      setGroupedProposals(newGroupedProposals);
    }
  }, [allProposals]);

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
        refetch(); // Revert on error
      } else {
        toast.success(`Proposta "${proposalToMove.title}" movida para "${newStatus}"`);
        refetch(); // Refetch to ensure data consistency
      }
    }
    setDraggingProposalId(null);
    setIsDragging(false);
  };

  const handleCardClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsSheetOpen(true);
  };

  const handleUpdateProposalField = useCallback(async (field: keyof Proposal, newValue: string | number | Date | null) => {
    if (!selectedProposal || !currentUser) return;

    setIsSaving(prev => ({ ...prev, [field]: true }));
    try {
      let updateData: Partial<Proposal> = {};
      if (newValue instanceof Date) {
        updateData[field] = newValue.toISOString() as any; // Supabase expects ISO string
      } else {
        updateData[field] = newValue as any;
      }

      const { data, error } = await updateProposal(selectedProposal.id, updateData);

      if (error) {
        toast.error(`Erro ao atualizar ${field}: ${error.message}`);
        refetch(); // Revert on error
      } else {
        setSelectedProposal(prev => prev ? { ...prev, ...updateData } : null);
        toast.success(`${labelMap[field]} atualizado com sucesso!`);
        refetch(); // Refetch to ensure data consistency across the app
      }
    } catch (err: any) {
      console.error(`Error updating proposal ${field}:`, err);
      toast.error(`Erro ao atualizar ${labelMap[field]}.`);
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
        refetch(); // Revert on error
      } else {
        setSelectedProposal(prev => prev ? {
          ...prev,
          clients: prev.clients ? { ...prev.clients, [field]: newValue } : prev.clients
        } : null);
        toast.success(`Campo do cliente atualizado com sucesso!`);
        refetch(); // Refetch to ensure data consistency
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

  const labelMap: Record<keyof Proposal | `client_${keyof Client}`, string> = {
    title: 'Título',
    amount: 'Valor',
    status: 'Status',
    owner: 'Responsável',
    created_at: 'Data de Criação',
    updated_at: 'Última Atualização',
    expected_close_date: 'Previsão de Fechamento',
    notes: 'Observações',
    share_token: 'Token de Compartilhamento',
    client_id: 'Cliente',
    client_name: 'Nome do Cliente',
    client_email: 'E-mail do Cliente',
    client_company: 'Empresa do Cliente',
    client_phone: 'Telefone do Cliente',
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Carregando pipeline...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Pipeline de Propostas"
          subtitle="Visualize e gerencie suas propostas em um quadro Kanban"
          icon={LayoutDashboardIcon}
        >
          <Button 
            size="lg" 
            className="gradient-button-bg hover:opacity-90 text-white mt-4 md:mt-0"
            onClick={() => navigate('/generator')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Nova Proposta
          </Button>
        </PageHeader>

        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex space-x-4 p-4 min-h-[600px] items-start">
              {PROPOSAL_STATUSES.map(status => (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className={cn(
                    "flex-shrink-0 w-80 bg-muted/40 rounded-lg p-4 shadow-sm border",
                    draggingProposalId && "border-dashed border-primary"
                  )}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                    {status}
                    <Badge variant="secondary" className={getStatusColor(status)}>
                      {groupedProposals[status]?.length || 0}
                    </Badge>
                  </h3>
                  <div className="space-y-3 min-h-[100px]">
                    {groupedProposals[status]
                        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(proposal => (
                          <Card
                            key={proposal.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, proposal.id)}
                            onClick={() => handleCardClick(proposal)}
                            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200"
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base font-semibold flex items-center justify-between">
                                <span className="truncate">{proposal.title}</span>
                                <Badge variant="outline" className={cn("ml-2", getStatusColor(proposal.status))}>
                                  {proposal.status}
                                </Badge>
                              </CardTitle>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {proposal.clients?.name || 'Cliente Desconhecido'}
                              </p>
                            </CardHeader>
                            <CardContent className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-conexhub-green-600 font-medium">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(Number(proposal.amount))}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {isDragging && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg w-full max-w-lg no-print">
              <div className="flex justify-center gap-2 p-2">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'Aprovada')}
                  className="flex-1 py-2 px-4 rounded-md bg-green-600 text-white text-sm font-semibold flex items-center justify-center transition-colors duration-300 hover:bg-green-700 cursor-pointer border-2 border-transparent hover:border-white"
                >
                  APROVADA
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'Rejeitada')}
                  className="flex-1 py-2 px-4 rounded-md bg-red-600 text-white text-sm font-semibold flex items-center justify-center transition-colors duration-300 hover:bg-red-700 cursor-pointer border-2 border-transparent hover:border-white"
                >
                  REJEITADA
                </div>
              </div>
            </div>
          )}
        </div>

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
      </div>
    </Layout>
  );
};

export default Pipeline;