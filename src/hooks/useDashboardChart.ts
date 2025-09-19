import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './useSession';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

export interface DashboardChartData {
  month_start: string;
  month_label: string;
  generated_total: number;
  closed_total: number;
  proposals_count: number;
}

export interface DashboardChartFilters {
  period: 'last3months' | 'last6months' | 'last12months' | 'thisyear' | 'custom';
  fromDate?: Date;
  toDate?: Date;
}

export const useDashboardChart = (filters: DashboardChartFilters) => {
  const { user } = useSession();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    const to = endOfMonth(now);
    
    let from: Date;
    switch (filters.period) {
      case 'last3months':
        from = startOfMonth(subMonths(now, 2));
        break;
      case 'last6months':
        from = startOfMonth(subMonths(now, 5));
        break;
      case 'last12months':
        from = startOfMonth(subMonths(now, 11));
        break;
      case 'thisyear':
        from = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        break;
      case 'custom':
        from = filters.fromDate || startOfMonth(subMonths(now, 5));
        break;
      default:
        from = startOfMonth(subMonths(now, 5)); // Default to 6 months
    }
    
    return { from, to };
  });

  // Update date range when filters change
  useEffect(() => {
    const now = new Date();
    const to = filters.toDate || endOfMonth(now);
    
    let from: Date;
    switch (filters.period) {
      case 'last3months':
        from = startOfMonth(subMonths(now, 2));
        break;
      case 'last6months':
        from = startOfMonth(subMonths(now, 5));
        break;
      case 'last12months':
        from = startOfMonth(subMonths(now, 11));
        break;
      case 'thisyear':
        from = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        break;
      case 'custom':
        from = filters.fromDate || startOfMonth(subMonths(now, 5));
        break;
      default:
        from = startOfMonth(subMonths(now, 5)); // Default to 6 months
    }
    
    setDateRange({ from, to });
  }, [filters]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-bars', user?.id, { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('dashboard_values_by_month', {
        p_user: user.id,
        p_from: dateRange.from.toISOString(),
        p_to: dateRange.to.toISOString()
      });

      if (error) {
        throw error;
      }

      return data as DashboardChartData[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Buscar dados específicos para o gráfico de funil
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['dashboard-funnel', user?.id, { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Buscar todas as propostas no período
      const { data, error } = await supabase
        .from('proposals')
        .select('status, amount')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) {
        throw error;
      }

      // Inicializar contadores
      let totalCount = 0;
      let totalValue = 0;
      let negotiatingCount = 0;
      let negotiatingValue = 0;
      let approvedCount = 0;
      let approvedValue = 0;

      // Processar dados
      data.forEach(proposal => {
        // Total (todas as propostas)
        totalCount++;
        totalValue += Number(proposal.amount) || 0;

        // Negociando (status 'Enviada' ou 'Negociando')
        if (proposal.status === 'Enviada' || proposal.status === 'Negociando') {
          negotiatingCount++;
          negotiatingValue += Number(proposal.amount) || 0;
        }

        // Aprovadas (status 'Aprovada')
        if (proposal.status === 'Aprovada') {
          approvedCount++;
          approvedValue += Number(proposal.amount) || 0;
        }
      });

      // Criar estrutura do funil
      const stages = [
        { stage: 'Total de Propostas', status: 'total', count: totalCount, valueSum: totalValue },
        { stage: 'Em Negociação', status: 'negotiating', count: negotiatingCount, valueSum: negotiatingValue },
        { stage: 'Aprovadas', status: 'approved', count: approvedCount, valueSum: approvedValue }
      ];

      return stages;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    chartData: data || [],
    funnelData: funnelData || [
      { stage: 'Total de Propostas', status: 'total', count: 0, valueSum: 0 },
      { stage: 'Em Negociação', status: 'negotiating', count: 0, valueSum: 0 },
      { stage: 'Aprovadas', status: 'approved', count: 0, valueSum: 0 }
    ],
    isLoading,
    isFunnelLoading: funnelLoading,
    error,
    refetch,
    dateRange
  };
};