import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useProposals, Proposal, CreateProposalData, UpdateProposalData } from '@/hooks/useProposals';
import { useUsers } from '@/hooks/useUsers';
import { useClients, Client } from '@/hooks/useClients'; // Import useClients and Client
import { useSession } from '@/hooks/useSession';
import { FileText as FileTextIcon, Search, Edit, Copy, Trash2, Plus, Filter, Printer } from 'lucide-react'; 
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader'; 
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency
import DuplicateProposalModal from '@/components/DuplicateProposalModal';

interface ProposalFormData {
  title: string;
  amount: number;
  client_id: string | null; // Changed to client_id
  owner: string;
}

const ProposalForm = ({ 
  proposal, 
  allUsers,
  allClients, // Pass allClients to the form
  currentUserId,
  onSubmit, 
  onCancel 
}: { 
  proposal?: Proposal; 
  allUsers: any[];
  allClients: Client[]; // Type for allClients
  currentUserId: string;
  onSubmit: (data: CreateProposalData | UpdateProposalData) => void; 
  onCancel: () => void;
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProposalFormData>({
    defaultValues: {
      title: proposal?.title || '',
      amount: proposal?.amount || 0,
      client_id: proposal?.client_id || null, // Use client_id
      owner: proposal?.owner || currentUserId
    }
  });

  const onFormSubmit = (data: ProposalFormData) => {
    onSubmit({
      title: data.title,
      amount: Number(data.amount),
      client_id: data.client_id || null, // Use client_id
      owner: data.owner
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input
          {...register('title', { required: 'Título é obrigatório' })}
          placeholder="Digite o título da proposta"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">Valor *</label>
        <Input
          {...register('amount', { 
            required: 'Valor é obrigatório',
            min: { value: 0, message: 'Valor deve ser positivo' }
          })}
          type="number"
          step="0.01"
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Cliente</label>
        <Select 
          value={watch('client_id') || ''} 
          onValueChange={(value) => setValue('client_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {/* Removed SelectItem with empty value to fix the error */}
            {allClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.email ? `(${client.email})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Responsável *</label>
        <Select 
          value={watch('owner')} 
          onValueChange={(value) => setValue('owner', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {allUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {proposal ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

const ProposalSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
  </TableRow>
);

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

export default function Proposals() {
  const { user: currentUser } = useSession();
  const { allUsers } = useUsers();
  const { clients: allClients } = useClients(); // Use useClients hook
  const { formatCurrency } = useCurrency(); // Use formatCurrency from context
  const {
    proposals,
    loading,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    createProposal,
    updateProposal,
    updateProposalStatus,
    duplicateProposal,
    deleteProposal
  } = useProposals();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [duplicatingProposal, setDuplicatingProposal] = useState<Proposal | null>(null);

  const handleCreateProposal = async (data: CreateProposalData) => {
    const result = await createProposal(data);
    if (result.data) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateProposal = async (data: UpdateProposalData) => {
    if (!editingProposal) return;
    
    const result = await updateProposal(editingProposal.id, data);
    if (result.data) {
      setEditingProposal(null);
    }
  };

  const handleStatusChange = async (proposal: Proposal, newStatus: Proposal['status']) => {
    await updateProposalStatus(proposal.id, newStatus);
  };

  const handleDuplicate = (proposal: Proposal) => {
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

  const handleDelete = async (proposal: Proposal) => {
    if (confirm(`Tem certeza que deseja excluir a proposta "${proposal.title}"?`)) {
      await deleteProposal(proposal.id);
    }
  };

  const handlePrintProposal = (proposalId: string) => {
    if (proposalId) {
      window.open(`/proposals/${proposalId}/print`, '_blank');
    } else {
      toast.error('ID da proposta não disponível.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Propostas"
          subtitle="Gerencie todas as propostas criadas"
          icon={FileTextIcon}
        >
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="gradient-button-bg hover:opacity-90 text-white mt-4 md:mt-0 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Proposta</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Proposta</DialogTitle>
              </DialogHeader>
              <ProposalForm 
                allUsers={allUsers}
                allClients={allClients}
                currentUserId={currentUser?.id || ''}
                onSubmit={handleCreateProposal}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Propostas</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar propostas..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
              
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Criada">Criada</SelectItem>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Negociando">Negociando</SelectItem>
                  <SelectItem value="Aprovada">Aprovada</SelectItem>
                  <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.ownerId || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, ownerId: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Responsáveis</SelectItem>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="secondary">
                {totalItems} proposta{totalItems !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-r">Data</TableHead>
                    <TableHead className="border-r">Título</TableHead>
                    <TableHead className="border-r">Responsável</TableHead>
                    <TableHead className="border-r">Cliente</TableHead>
                    <TableHead className="border-r">Valor</TableHead>
                    <TableHead className="border-r">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <ProposalSkeleton key={i} />
                    ))
                  ) : proposals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {filters.search || filters.status !== 'all' || filters.ownerId !== 'all' 
                          ? 'Nenhuma proposta encontrada' 
                          : 'Nenhuma proposta cadastrada'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="border-r align-middle h-[40px]">
                          {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium border-r align-middle h-[40px]">
                          {proposal.title}
                        </TableCell>
                        <TableCell className="border-r align-middle h-[40px]">
                          {proposal.app_users?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="border-r align-middle h-[40px]">
                          {proposal.clients?.name || '-'}
                        </TableCell>
                        <TableCell className="border-r align-middle h-[40px]">
                          {formatCurrency(Number(proposal.amount))}
                        </TableCell>
                        <TableCell className="border-r p-0 align-middle h-[40px]">
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
                              <SelectItem value="Criada">Criada</SelectItem>
                              <SelectItem value="Enviada">Enviada</SelectItem>
                              <SelectItem value="Negociando">Negociando</SelectItem>
                              <SelectItem value="Aprovada">Aprovada</SelectItem>
                              <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                              <SelectItem value="Rascunho">Rascunho</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right align-middle h-[40px]">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintProposal(proposal.id)}
                              title="Imprimir/Salvar PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProposal(proposal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicate(proposal)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(proposal)}
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

        {/* Edit Proposal Dialog */}
        <Dialog open={!!editingProposal} onOpenChange={() => setEditingProposal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Proposta</DialogTitle>
            </DialogHeader>
            {editingProposal && (
              <ProposalForm 
                proposal={editingProposal}
                allUsers={allUsers}
                allClients={allClients}
                currentUserId={currentUser?.id || ''}
                onSubmit={handleUpdateProposal}
                onCancel={() => setEditingProposal(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Duplicate Proposal Modal */}
        <DuplicateProposalModal
          isOpen={!!duplicatingProposal}
          onClose={() => setDuplicatingProposal(null)}
          proposal={duplicatingProposal}
          onDuplicate={handleDuplicateWithOptions}
        />
      </div>
    </Layout>
  );
}