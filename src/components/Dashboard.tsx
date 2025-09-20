import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  LayoutDashboard as LayoutDashboardIcon 
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
    totalItems,
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
    
    // Update chart filters when period changes
    if (key === 'period') {
      let chartPeriod: DashboardChartFilters['period'] = 'last6months';
      
      switch (value) {
        case 'today':
        case '7days':
          chartPeriod = 'last3months';
          break;
        case '30days':
          chartPeriod = 'last6months';
          break;
        case 'all':
          chartPeriod = 'last12months';
          break;
      }
      
      setChartFilters(prev => ({ ...prev, period: chartPeriod }));
    }
  };

  const handleChartPeriodChange = (period: string) => {
    setChartFilters(prev => ({ 
      ...prev, 
      period: period as DashboardChartFilters['period'] 
    }));
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
    <div className="space-y-6 relative pb-20">
      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => navigate('/generator')}
        tooltip="Criar Nova Proposta"
        icon={Plus}
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período (Propostas)</label>
              <Select 
                value={filters.period} 
                onValueChange={(value) => handleFilterChange('period', value as 'today' | '7days' | '30days' | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value as 'Criada' | 'Enviada' | 'Aprovada' | 'Rejeitada' | 'Rascunho' | 'all')}
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
            <div>
              <label className="text-sm font-medium mb-2 block">Período (Gráfico)</label>
              <Select 
                value={chartFilters.period} 
                onValueChange={handleChartPeriodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="last12months">Últimos 12 meses</SelectItem>
                  <SelectItem value="thisyear">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-conexhub-blue-600">
                {metrics.totalProposals}
              </div>
            )}
            <p className="text-xs text-muted-foreground">propostas criadas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-32 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-conexhub-green-600">
                {formatCurrency(metrics.totalValue)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">em propostas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {metrics.conversionRate.toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">propostas aprovadas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-conexhub-teal-500 to-conexhub-green-600 text-white"> {/* Highlighted card */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Aprovado Este Mês</CardTitle>
            <Calendar className="w-4 h-4 text-white" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16 mb-1 bg-white/30" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {formatCurrency(metrics.thisMonth)}
              </div>
            )}
            <p className="text-xs text-conexhub-teal-100">valor aprovado no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos: Barras (3/4) e Funil (1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <DashboardBarChart 
            data={chartData} 
            isLoading={chartLoading} 
          />
        </div>
        <div className="lg:col-span-1">
          <DashboardFunnelChart 
            data={funnelData}
            isLoading={isFunnelLoading}
          />
        </div>
      </div>

      {/* Tabela de Propostas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r">Data</TableHead>
                  <TableHead className="border-r">Título</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma proposta encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  proposals.map((proposal) => (
                    <TableRow key={proposal.id} className="hover:bg-muted/50">
                      <TableCell className="border-r align-middle h-[40px]">
                        {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium border-r align-middle h-[40px]">
                        {proposal.title}
                      </TableCell>
                      <TableCell className="border-r align-middle h-[40px]">
                        <div>
                          <div className="font-medium">{proposal.clients?.name || 'Sem cliente'}</div>
                          {proposal.clients?.company && (
                            <div className="text-sm text-muted-foreground">
                              {proposal.clients.company}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r align-middle h-[40px]">
                        <span className="font-semibold text-conexhub-green-600">
                          {formatCurrency(Number(proposal.amount))}
                        </span>
                      </TableCell>
                      <TableCell className="border-r align-middle h-[40px]">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(proposal.status)}
                        >
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-middle h-[40px]">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProposal(proposal.share_token)}
                            className="h-8 w-8 p-0"
                            title="Visualizar Proposta"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProposal(proposal.id)}
                            className="h-8 w-8 p-0"
                            title="Editar Proposta"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateProposal(proposal.id)}
                            className="h-8 w-8 p-0"
                            title="Duplicar Proposta"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Excluir Proposta"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default Dashboard;