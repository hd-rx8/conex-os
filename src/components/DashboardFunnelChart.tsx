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

interface FunnelStage {
  stage: string;
  status: string;
  count: number;
  valueSum: number;
}

interface FunnelData {
  name: string;
  value: number;
  valueSum: number;
  color: string;
}

interface DashboardFunnelChartProps {
  data: FunnelStage[];
  isLoading: boolean;
}

const DashboardFunnelChart: React.FC<DashboardFunnelChartProps> = ({ 
  data, 
  isLoading 
}) => {
  const { formatCurrency } = useCurrency();
  
  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'Total de Propostas': return 'hsl(var(--primary))';
      case 'Em Negociação': return 'hsl(38, 92%, 50%)';
      case 'Aprovadas': return 'hsl(142, 76%, 36%)';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const funnelData: FunnelData[] = data.map(stage => ({
    name: `${stage.stage} (${stage.count})`,
    value: stage.count,
    valueSum: stage.valueSum,
    color: getStageColor(stage.stage)
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const stageName = data.name.split(' (')[0]; // Extrair apenas o nome do estágio sem o contador
      
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium text-sm mb-1">{stageName}</p>
          <div className="flex items-center gap-2 text-sm mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="text-muted-foreground">Propostas:</span>
            <span className="font-medium">{data.value}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full opacity-0" 
            />
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-medium">{formatCurrency(data.valueSum)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Verificar se há dados para mostrar
  const hasData = funnelData.some(item => item.value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : !hasData ? (
          <div className="h-80 flex items-center justify-center flex-col text-muted-foreground">
            <p>Nenhuma proposta encontrada no período selecionado.</p>
          </div>
        ) : (
          <div className="h-80">
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
