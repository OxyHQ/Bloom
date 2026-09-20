import React from 'react';

import {
  HeatmapChartCard,
  RadialChartCard,
  SankeyChartCard,
  ScatterChartCard,
} from '../../src/chart-cards';
import { RiBankLine } from '../../src/icons/remix';
import { StatCards } from '../../src/stat-cards';
import { DashboardShell, ThreeUpChartRow } from '../shared/dashboard';
import {
  CASH_FLOW_RANGES,
  currency,
  FINANCE_STATS,
  percent,
  PORTFOLIO_RANGES,
  SPENDING_HEAT_RANGES,
  SPENDING_RANGES,
} from './finance-data';
import { TransactionsTable } from './TransactionsTable';

/**
 * The finance template: the adaptive navigation shell, KPI
 * stat cards, a full-width cash-flow sankey, a 3-up row (spending rings,
 * portfolio bubbles, daily spending heatmap) and the transactions data table.
 */
export function FinanceDashboardTemplate() {
  return (
    <DashboardShell selected="finance" title="Finance" crumbIcon={RiBankLine} primaryAction="Add transaction">
      <StatCards stats={FINANCE_STATS} />
      {/* Hero card: where the money comes from and where it goes. */}
      <SankeyChartCard
        title="Cash flow"
        ranges={CASH_FLOW_RANGES}
        format={currency}
        axisLabels={['Income', 'Spending']}
      />
      <ThreeUpChartRow>
        <RadialChartCard title="Spending by category" ranges={SPENDING_RANGES} format={currency} />
        <ScatterChartCard
          title="Portfolio"
          ranges={PORTFOLIO_RANGES}
          axisLabels={['Risk score', 'Return']}
          format={percent}
        />
        <HeatmapChartCard
          title="Daily spending"
          ranges={SPENDING_HEAT_RANGES}
          format={currency}
          columnLabelEvery={2}
        />
      </ThreeUpChartRow>
      <TransactionsTable />
    </DashboardShell>
  );
}
