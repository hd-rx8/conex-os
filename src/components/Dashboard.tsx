import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  Trash2,
  Filter,
} from 'lucide-react';
import { useProposals, ProposalFilters } from '@/hooks/useProposals';
import { useDashboardChart, DashboardChartFilters } from '@/hooks/useDashboardChart';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import DashboardBarChart from './DashboardBarChart';
import DashboardFunnelChart from './DashboardFunnelChart';
import FloatingActionButton from './FloatingActionButton';
import { ContentCard } from './layout/ContentCard';
import { MetricCard } from './layout/MetricCard';
import { PageHeader } from './layout/PageHeader';
import { PageToolbar } from './layout/PageToolbar';

interface DashboardProps {
  userId: string;
}

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

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [chartFilters, setChartFilters] = useState<DashboardChartFilters>({
    period: 'last6months'
  });
  
  const {
    proposals,
    loading,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    duplicateProposal,
    deleteProposal,
    metrics,
  } = useProposals();

  const { 
    chartData, 
    funnelData,
    isLoading: chartLoading,
    isFunnelLoading
  } = useDashboardChart(chartFilters);

  const handleFilterChange = (key: keyof ProposalFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, currentPage: 1 }));

    // Automatically sync chart period with main filter
    if (key === 'period') {
      let chartPeriod: DashboardChartFilters['period'] = 'last6months';

      switch (value) {
        case 'today':
        case '7days':
          chartPeriod = 'last3months';
          break;
        case '30days':
        case 'currentMonth':
          chartPeriod = 'last6months';
          break;
        case 'custom':
        case 'all':
          chartPeriod = 'last12months';
          break;
      }

      setChartFilters(prev => ({ ...prev, period: chartPeriod }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Criada': return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
      case 'Enviada': return 'bg-yellow-200/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
      case 'Negociando': return 'bg-orange-200/50 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800';
      case 'Aprovada': return 'bg-green-200/50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'Rejeitada': return 'bg-red-200/50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      case 'Rascunho': return 'bg-purple-200/50 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-200/50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const handleViewProposal = (shareToken: string | null) => {
    if (shareToken) {
      window.open(`/p/${shareToken}`, '_blank');
    } else {
      toast.error('Token de compartilhamento não disponível para esta proposta.');
    }
  };

  const handleEditProposal = (proposalId: string) => {
    navigate(`/generator?proposalId=${proposalId}`);
    toast.info(`Redirecionando para editar proposta ${proposalId}.`);
  };

  const handleDuplicateProposal = async (proposalId: string) => {
    await duplicateProposal(proposalId, userId);
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (confirm('Tem certeza que deseja excluir esta proposta?')) {
      await deleteProposal(proposalId);
    }
  };

  return (
    <div className="app-page relative pb-20">
      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => navigate('/generator')}
        tooltip="Criar Nova Proposta"
        icon={Plus}
      />

      <PageHeader
        eyebrow="CRM"
        title="Dashboard"
        description="Acompanhe propostas, receita e conversão em um só lugar."
        actions={(
          <Button onClick={() => navigate('/generator')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova proposta
          </Button>
        )}
      />

      {/* Filtros */}
      <PageToolbar className="block">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" />
          Filtros
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Período</label>
            <Select
              value={filters.period}
              onValueChange={(value) => handleFilterChange('period', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7days">Semana (7 dias)</SelectItem>
                <SelectItem value="30days">Mês (30 dias)</SelectItem>
                <SelectItem value="currentMonth">Mês atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Tipo de Data</label>
            <Select
              value={filters.dateField || 'created_at'}
              onValueChange={(value) => handleFilterChange('dateField', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data de Criação</SelectItem>
                <SelectItem value="approved_at">Data de Aprovação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Criada">Criada</SelectItem>
                <SelectItem value="Enviada">Enviada</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.period === 'custom' && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filters.customStartDate || ''}
                onChange={(event) => handleFilterChange('customStartDate', event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filters.customEndDate || ''}
                onChange={(event) => handleFilterChange('customEndDate', event.target.value)}
              />
            </div>
          </div>
        )}
      </PageToolbar>

      {/* Cards de Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total de propostas"
          value={metrics.totalProposals}
          detail="propostas criadas"
          icon={FileText}
          tone="primary"
          loading={loading}
        />
        <MetricCard
          label="Valor total"
          value={formatCurrency(metrics.totalValue)}
          detail="no período filtrado"
          icon={DollarSign}
          tone="success"
          loading={loading}
        />
        <MetricCard
          label="Taxa de conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          detail="propostas aprovadas"
          icon={TrendingUp}
          tone="warning"
          loading={loading}
        />
        <MetricCard
          label="Aprovado este mês"
          value={formatCurrency(metrics.thisMonth)}
          detail="aprovado no mês atual"
          icon={Calendar}
          tone="success"
          loading={loading}
          className="border-0 bg-gradient-to-br from-conexhub-teal-500 to-conexhub-green-600 text-white [&_.text-muted-foreground]:text-white/80"
        />
      </section>

      {/* Gráficos: Barras (2/3) e Funil (1/3) */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <DashboardBarChart
            data={chartData}
            isLoading={chartLoading}
          />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <DashboardFunnelChart
            data={funnelData}
            isLoading={isFunnelLoading}
          />
        </div>
      </section>

      {/* Tabela de Propostas Recentes */}
      <ContentCard
        title="Propostas recentes"
        description="Últimas movimentações no período selecionado."
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[110px]">Data</TableHead>
                <TableHead className="min-w-[220px]">Título</TableHead>
                <TableHead className="min-w-[180px]">Cliente</TableHead>
                <TableHead className="min-w-[130px]">Valor</TableHead>
                <TableHead className="min-w-[130px]">Status</TableHead>
                <TableHead className="min-w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <ProposalSkeleton key={index} />
                ))
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhuma proposta encontrada com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id} className="h-16 hover:bg-muted/30">
                    <TableCell>
                      {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">{proposal.title}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {proposal.clients?.name || 'Sem cliente'}
                        </div>
                        {proposal.clients?.company && (
                          <div className="truncate text-sm text-muted-foreground">
                            {proposal.clients.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-conexhub-green-600">
                        {formatCurrency(Number(proposal.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(proposal.status)}
                      >
                        {proposal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewProposal(proposal.share_token)}
                          className="h-9 w-9"
                          aria-label={`Visualizar ${proposal.title}`}
                          title="Visualizar proposta"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProposal(proposal.id)}
                          className="h-9 w-9"
                          aria-label={`Editar ${proposal.title}`}
                          title="Editar proposta"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateProposal(proposal.id)}
                          className="h-9 w-9"
                          aria-label={`Duplicar ${proposal.title}`}
                          title="Duplicar proposta"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          aria-label={`Excluir ${proposal.title}`}
                          title="Excluir proposta"
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
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
};

export default Dashboard;
