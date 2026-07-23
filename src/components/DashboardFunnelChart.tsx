import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ResponsiveContainer,
  FunnelChart, 
  Funnel, 
  Tooltip, 
  Cell
} from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';
import type { DashboardFunnelStage } from '@/features/crm/dashboard/dashboardAnalytics';

interface FunnelData {
  name: string;
  value: number;
  actualValue: number;
  valueSum: number;
  color: string;
  previousConversionRate: number;
  totalConversionRate: number;
}

interface DashboardFunnelChartProps {
  data: Array<
    Pick<DashboardFunnelStage, 'stage' | 'status' | 'count' | 'valueSum'> &
      Partial<
        Pick<
          DashboardFunnelStage,
          'previousConversionRate' | 'totalConversionRate'
        >
      >
  >;
  isLoading: boolean;
}

interface FunnelTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FunnelData }>;
}

const DashboardFunnelChart: React.FC<DashboardFunnelChartProps> = ({ 
  data, 
  isLoading 
}) => {
  const { formatCurrency } = useCurrency();
  
  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'Total de Propostas': return 'hsl(var(--primary))';
      case 'Em Negociação':
      case 'Enviadas ou posteriores':
        return 'hsl(38, 92%, 50%)';
      case 'Aprovadas': return 'hsl(142, 76%, 36%)';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const funnelData: FunnelData[] = data.map((stage) => ({
    name: `${stage.stage} (${stage.count})`,
    value: stage.count,
    actualValue: stage.count,
    valueSum: stage.valueSum,
    color: getStageColor(stage.stage),
    previousConversionRate: stage.previousConversionRate ?? 0,
    totalConversionRate: stage.totalConversionRate ?? 0,
  }));

  const CustomTooltip = ({ active, payload }: FunnelTooltipProps) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0].payload;
      const stageName = tooltipData.name.split(' (')[0];

      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium text-sm mb-1">{stageName}</p>
          <div className="flex items-center gap-2 text-sm mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tooltipData.color }}
            />
            <span className="text-muted-foreground">Propostas:</span>
            <span className="font-medium">{tooltipData.actualValue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full opacity-0"
            />
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-medium">{formatCurrency(tooltipData.valueSum)}</span>
          </div>
          <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            {tooltipData.previousConversionRate.toFixed(1)}% da etapa anterior ·{' '}
            {tooltipData.totalConversionRate.toFixed(1)}% do total
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = data.some((stage) => stage.count > 0);
  const totalProposals = data[0]?.count ?? 0;

  return (
    <Card className="h-full overflow-hidden shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalProposals} {totalProposals === 1 ? 'proposta' : 'propostas'} no período
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !hasData ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>Nenhuma proposta encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardFunnelChart;
