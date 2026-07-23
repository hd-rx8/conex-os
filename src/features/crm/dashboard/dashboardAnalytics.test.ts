import { describe, expect, it } from 'vitest';

import {
  deriveDashboardAnalytics,
  type DashboardProposal,
} from './dashboardAnalytics';

const proposal = (
  id: string,
  status: DashboardProposal['status'],
  amount: number,
  approvedAt: string | null = null,
): DashboardProposal => ({
  id,
  status,
  amount,
  created_at: `2025-09-${id.padStart(2, '0')}T12:00:00.000Z`,
  updated_at: approvedAt ?? `2025-09-${id.padStart(2, '0')}T12:00:00.000Z`,
  approved_at: approvedAt,
});

describe('deriveDashboardAnalytics', () => {
  it('derives cards, monthly values and funnel from the same proposals', () => {
    const analytics = deriveDashboardAnalytics(
      [
        proposal('1', 'Aprovada', 1900, '2026-07-23T10:00:00.000Z'),
        proposal('2', 'FECHADO_GANHO', 1350, '2026-07-23T11:00:00.000Z'),
        proposal('3', 'FECHADO_GANHO', 700, '2026-07-19T12:00:00.000Z'),
        proposal('4', 'Rejeitada', 2375),
        proposal('5', 'NEGOCIACAO', 1710),
      ],
      {
        dateField: 'created_at',
        now: new Date('2026-07-23T15:00:00.000Z'),
      },
    );

    expect(analytics.metrics).toEqual({
      totalProposals: 5,
      totalValue: 8035,
      thisMonth: 3950,
      conversionRate: 60,
    });

    expect(analytics.monthlyData).toHaveLength(1);
    expect(analytics.monthlyData[0]).toMatchObject({
      month_start: '2025-09-01',
      generated_total: 8035,
      closed_total: 3950,
      proposals_count: 5,
    });

    expect(analytics.funnelData).toEqual([
      expect.objectContaining({
        stage: 'Total de Propostas',
        count: 5,
        valueSum: 8035,
        previousConversionRate: 100,
        totalConversionRate: 100,
      }),
      expect.objectContaining({
        stage: 'Enviadas ou posteriores',
        count: 5,
        valueSum: 8035,
        previousConversionRate: 100,
        totalConversionRate: 100,
      }),
      expect.objectContaining({
        stage: 'Fechado ganho',
        status: 'FECHADO_GANHO',
        count: 3,
        valueSum: 3950,
        previousConversionRate: 60,
        totalConversionRate: 60,
      }),
    ]);
  });

  it('returns a genuinely empty dataset when no proposal matches', () => {
    const analytics = deriveDashboardAnalytics([], {
      dateField: 'created_at',
      now: new Date('2026-07-23T15:00:00.000Z'),
    });

    expect(analytics.metrics.totalProposals).toBe(0);
    expect(analytics.monthlyData).toEqual([]);
    expect(analytics.funnelData.every((stage) => stage.count === 0)).toBe(true);
  });

  it('recognizes legacy and canonical sent-or-later statuses', () => {
    const analytics = deriveDashboardAnalytics(
      [
        proposal('1', 'Enviada', 100),
        proposal('2', 'ENVIADA', 200),
        proposal('3', 'Negociando', 300),
        proposal('4', 'EM_NEGOCIACAO', 400),
        proposal('5', 'NEGOCIACAO', 500),
        proposal('6', 'EM_REVISAO', 600),
      ],
      { dateField: 'created_at' },
    );

    expect(analytics.funnelData[1]).toMatchObject({
      stage: 'Enviadas ou posteriores',
      count: 5,
      valueSum: 1500,
    });
  });
});
