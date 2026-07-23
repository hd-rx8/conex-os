import {
  normalizeProposalStatus,
  type ProposalStatus,
} from '@/features/crm/proposals/proposalStatus';

export type DashboardProposalStatus = ProposalStatus;

export interface DashboardProposal {
  id: string;
  status: DashboardProposalStatus;
  amount: number;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
}

export interface DashboardMetrics {
  totalProposals: number;
  totalValue: number;
  thisMonth: number;
  conversionRate: number;
}

export interface DashboardMonthlyData {
  month_start: string;
  month_label: string;
  generated_total: number;
  closed_total: number;
  proposals_count: number;
}

export interface DashboardFunnelStage {
  stage: string;
  status: string;
  count: number;
  valueSum: number;
  previousConversionRate: number;
  totalConversionRate: number;
}

interface DashboardAnalyticsOptions {
  dateField: 'created_at' | 'approved_at';
  now?: Date;
}

const ADVANCED_STATUSES = new Set<string>([
  'ENVIADA',
  'NEGOCIACAO',
  'FECHADO_GANHO',
  'FECHADO_PERDIDO',
]);

const toAmount = (value: number) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const percentage = (value: number, total: number) =>
  total > 0 ? (value / total) * 100 : 0;

const getUtcMonthKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const getMonthLabel = (monthStart: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthStart}T00:00:00.000Z`));

const isSameUtcMonth = (value: string, reference: Date) => {
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === reference.getUTCFullYear() &&
    date.getUTCMonth() === reference.getUTCMonth()
  );
};

export function deriveDashboardAnalytics(
  proposals: DashboardProposal[],
  {
    dateField,
    now = new Date(),
  }: DashboardAnalyticsOptions,
) {
  const totalValue = proposals.reduce(
    (sum, proposal) => sum + toAmount(proposal.amount),
    0,
  );
  const approved = proposals.filter(
    (proposal) => normalizeProposalStatus(proposal.status) === 'FECHADO_GANHO',
  );
  const advanced = proposals.filter((proposal) =>
    ADVANCED_STATUSES.has(normalizeProposalStatus(proposal.status) ?? ''),
  );
  const approvedThisMonth = approved
    .filter((proposal) =>
      isSameUtcMonth(
        proposal.approved_at || proposal.updated_at,
        now,
      ),
    )
    .reduce((sum, proposal) => sum + toAmount(proposal.amount), 0);

  const monthlyMap = new Map<string, DashboardMonthlyData>();

  proposals.forEach((proposal) => {
    const selectedDate = proposal[dateField];
    if (!selectedDate) return;

    const monthStart = getUtcMonthKey(selectedDate);
    if (!monthStart) return;

    const current = monthlyMap.get(monthStart) ?? {
      month_start: monthStart,
      month_label: getMonthLabel(monthStart),
      generated_total: 0,
      closed_total: 0,
      proposals_count: 0,
    };
    const amount = toAmount(proposal.amount);

    current.generated_total += amount;
    current.proposals_count += 1;
    if (normalizeProposalStatus(proposal.status) === 'FECHADO_GANHO') {
      current.closed_total += amount;
    }

    monthlyMap.set(monthStart, current);
  });

  const totalCount = proposals.length;
  const advancedValue = advanced.reduce(
    (sum, proposal) => sum + toAmount(proposal.amount),
    0,
  );
  const approvedValue = approved.reduce(
    (sum, proposal) => sum + toAmount(proposal.amount),
    0,
  );

  const metrics: DashboardMetrics = {
    totalProposals: totalCount,
    totalValue,
    thisMonth: approvedThisMonth,
    conversionRate: percentage(approved.length, totalCount),
  };

  const funnelData: DashboardFunnelStage[] = [
    {
      stage: 'Total de Propostas',
      status: 'all',
      count: totalCount,
      valueSum: totalValue,
      previousConversionRate: totalCount > 0 ? 100 : 0,
      totalConversionRate: totalCount > 0 ? 100 : 0,
    },
    {
      stage: 'Enviadas ou posteriores',
      status: 'advanced',
      count: advanced.length,
      valueSum: advancedValue,
      previousConversionRate: percentage(advanced.length, totalCount),
      totalConversionRate: percentage(advanced.length, totalCount),
    },
    {
      stage: 'Fechado ganho',
      status: 'FECHADO_GANHO',
      count: approved.length,
      valueSum: approvedValue,
      previousConversionRate: percentage(approved.length, advanced.length),
      totalConversionRate: percentage(approved.length, totalCount),
    },
  ];

  return {
    metrics,
    monthlyData: Array.from(monthlyMap.values()).sort((left, right) =>
      left.month_start.localeCompare(right.month_start),
    ),
    funnelData,
  };
}
