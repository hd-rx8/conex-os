import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useClients, Client, CreateClientData, UpdateClientData } from '@/hooks/useClients';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { UserPlus, Search, Edit, Trash2, Users as UsersIcon, Building, FileText, DollarSign, Calendar, Loader2, Printer, Eye, Mail, Phone, User as UserIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader'; 
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import ptBR locale
import { useCurrency } from '@/context/CurrencyContext';
import EditableField from '@/components/EditableField';
import { useNavigate } from 'react-router-dom';

// Zod schema for client form validation
const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const ClientForm = ({ 
  client, 
  onSubmit, 
  onCancel 
}: { 
  client?: Client; 
  onSubmit: (data: CreateClientData | UpdateClientData) => void; 
  onCancel: () => void;
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      email: client?.email || '',
      company: client?.company || '',
      phone: client?.phone || ''
    }
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const onFormSubmit = (data: ClientFormData) => {
    onSubmit({
      name: data.name,
      email: data.email || null,
      company: data.company || null,
      phone: data.phone || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome do Cliente *</label>
        <Input
          {...register('name')}
          placeholder="Digite o nome completo do cliente"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">E-mail</label>
        <Input
          {...register('email')}
          type="email"
          placeholder="cliente@email.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">Empresa</label>
        <Input
          {...register('company')}
          placeholder="Nome da empresa (opcional)"
        />
        {errors.company && (
          <p className="text-sm text-destructive mt-1">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Telefone</label>
        <Input
          {...register('phone')}
          onChange={handlePhoneChange}
          placeholder="(XX) X XXXX-XXXX"
          maxLength={16}
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {client ? 'Atualizar Cliente' : 'Criar Cliente'}
        </Button>
      </div>
    </form>
  );
};

const ClientSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
  </TableRow>
);

const getStatusColor = (status: Proposal['status']) => {
  switch (status) {
    case 'Criada': return 'bg-gray-100 text-gray-800';
    case 'Enviada': return 'bg-blue-100 text-blue-800';
    case 'Aprovada': return 'bg-green-100 text-green-800';
    case 'Rejeitada': return 'bg-red-100 text-red-800';
    case 'Rascunho': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Clients() {
  const {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  } = useClients();

  const { allProposals, loading: proposalsLoading } = useProposals();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [selectedClientForProposals, setSelectedClientForProposals] = useState<Client | null>(null);
  const [clientProposals, setClientProposals] = useState<Proposal[]>([]);

  // Estados para o sheet de detalhes do cliente
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  const handleCreateClient = async (data: CreateClientData) => {
    const result = await createClient(data);
    if (result.data) {
      setIsCreateDialogOpen(false);
      fetchClients();
    }
  };

  const handleUpdateClient = async (data: UpdateClientData) => {
    if (!editingClient) return;
    
    const result = await updateClient(editingClient.id, data);
    if (result.data) {
      setEditingClient(null);
      fetchClients();
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      await deleteClient(client.id);
      fetchClients();
    }
  };

  const handleViewClientProposals = (client: Client) => {
    setSelectedClientForProposals(client);
    const proposalsForClient = allProposals.filter(p => p.client_id === client.id);
    setClientProposals(proposalsForClient);
    setShowProposalsModal(true);
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsSheetOpen(true);
  };

  const handleUpdateClientField = useCallback(async (field: keyof Client, newValue: string | null) => {
    if (!selectedClient) return;

    setIsSaving(prev => ({ ...prev, [field]: true }));
    try {
      const updateData: UpdateClientData = { [field]: newValue };
      const { data, error } = await updateClient(selectedClient.id, updateData);

      if (error) {
        toast.error(`Erro ao atualizar ${field}: ${error.message}`);
        fetchClients(); // Revert on error
      } else {
        setSelectedClient(prev => prev ? { ...prev, ...updateData } : null);
        toast.success(`Campo atualizado com sucesso!`);
        fetchClients(); // Refetch to ensure data consistency
      }
    } catch (err: any) {
      console.error(`Error updating client ${field}:`, err);
      toast.error(`Erro ao atualizar campo.`);
    } finally {
      setIsSaving(prev => ({ ...prev, [field]: false }));
    }
  }, [selectedClient, updateClient, fetchClients]);

  const handlePrintProposal = (shareToken: string | null) => {
    if (shareToken) {
      window.open(`/p/${shareToken}`, '_blank');
    } else {
      toast.error('Token de compartilhamento não disponível para esta proposta.');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Clientes"
          subtitle="Gerencie seus clientes e suas informações de contato"
          icon={Building}
        >
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Novo Cliente</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm 
                onSubmit={handleCreateClient}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Badge variant="secondary">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <ClientSkeleton key={i} />
                    ))
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClients.map((client) => (
                      <TableRow 
                        key={client.id} 
                        onClick={() => handleViewClientProposals(client)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.email || '-'}</TableCell>
                        <TableCell>{client.company || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleViewClientDetails(client); }}
                              title="Visualizar detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                              title="Editar cliente"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }}
                              title="Excluir cliente"
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

        {/* Edit Client Dialog */}
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            {editingClient && (
              <ClientForm 
                client={editingClient}
                onSubmit={handleUpdateClient}
                onCancel={() => setEditingClient(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Proposals Modal */}
        <Dialog open={showProposalsModal} onOpenChange={setShowProposalsModal}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Propostas para {selectedClientForProposals?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {proposalsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Carregando propostas...</p>
                </div>
              ) : clientProposals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma proposta encontrada para este cliente.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead> {/* Added Actions column */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientProposals.map((proposal) => {
                        const createdAt = new Date(proposal.created_at);
                        const expirationDate = addDays(createdAt, 30);
                        return (
                          <TableRow key={proposal.id}>
                            <TableCell className="font-medium">{proposal.title}</TableCell>
                            <TableCell>{formatCurrency(Number(proposal.amount))}</TableCell>
                            <TableCell>{format(createdAt, 'dd/MM/yyyy', { locale: ptBR })}</TableCell> {/* Use ptBR locale */}
                            <TableCell>{format(expirationDate, 'dd/MM/yyyy', { locale: ptBR })}</TableCell> {/* Use ptBR locale */}
                            <TableCell>
                              <Badge className={getStatusColor(proposal.status)}>
                                {proposal.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handlePrintProposal(proposal.share_token); }}
                                title="Imprimir/Salvar PDF"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Client Details Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            {selectedClient && (
              <ScrollArea className="h-[calc(100vh-24px)] pr-4">
                <div className="py-4 space-y-6">
                  {/* Header with Title */}
                  <div className="space-y-2">
                    <SheetHeader className="text-left">
                      <SheetTitle className="sr-only">Detalhes do Cliente</SheetTitle>
                    </SheetHeader>
                    
                    <div className="space-y-1">
                      <EditableField
                        value={selectedClient.name}
                        onSave={(newValue) => handleUpdateClientField('name', newValue as string)}
                        type="text"
                        placeholder="Nome do Cliente"
                        isLoading={isSaving.name}
                        displayClassName="text-2xl font-bold gradient-text"
                        label="Nome do Cliente"
                        required={true}
                      />
                      <p className="text-sm text-muted-foreground">
                        Informações completas do cliente.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações de Contato</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">E-mail:</p>
                        <EditableField
                          value={selectedClient.email || ''}
                          onSave={(newValue) => handleUpdateClientField('email', newValue as string)}
                          type="text"
                          placeholder="email@exemplo.com"
                          isLoading={isSaving.email}
                          displayClassName="flex items-center gap-2"
                          formatDisplayValue={(value) => (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{value || 'Não informado'}</span>
                            </div>
                          )}
                          label="E-mail do Cliente"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Telefone:</p>
                        <EditableField
                          value={selectedClient.phone || ''}
                          onSave={(newValue) => handleUpdateClientField('phone', newValue as string)}
                          type="text"
                          placeholder="(00) 00000-0000"
                          isLoading={isSaving.phone}
                          displayClassName="flex items-center gap-2"
                          formatDisplayValue={(value) => (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{value || 'Não informado'}</span>
                            </div>
                          )}
                          label="Telefone do Cliente"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Empresa:</p>
                        <EditableField
                          value={selectedClient.company || ''}
                          onSave={(newValue) => handleUpdateClientField('company', newValue as string)}
                          type="text"
                          placeholder="Nome da Empresa"
                          isLoading={isSaving.company}
                          displayClassName="flex items-center gap-2"
                          formatDisplayValue={(value) => (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{value || 'Não informado'}</span>
                            </div>
                          )}
                          label="Empresa do Cliente"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Client Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Estatísticas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Total de Propostas</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {allProposals.filter(p => p.client_id === selectedClient.id).length}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Valor Total</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            allProposals
                              .filter(p => p.client_id === selectedClient.id)
                              .reduce((sum, p) => sum + Number(p.amount), 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Proposals Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Propostas</h3>
                      <Button
                        size="sm"
                        onClick={() => navigate('/generator', { state: { clientId: selectedClient.id } })}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Proposta
                      </Button>
                    </div>
                    
                    {(() => {
                      const clientProposals = allProposals.filter(p => p.client_id === selectedClient.id);
                      
                      if (clientProposals.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma proposta encontrada para este cliente.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => navigate('/generator', { state: { clientId: selectedClient.id } })}
                            >
                              Criar Primeira Proposta
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {clientProposals
                            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                            .map((proposal) => (
                              <Card key={proposal.id} className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{proposal.title}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {formatCurrency(Number(proposal.amount))}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(parseISO(proposal.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <Badge className={getStatusColor(proposal.status)}>
                                      {proposal.status}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePrintProposal(proposal.share_token)}
                                      title="Visualizar proposta"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </ScrollArea>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}