import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  AreaChartCard,
  BarListCard,
  ComboChartCard,
  FunnelChartCard,
  RadialChartCard,
  type ComboSeries,
} from '../../src/chart-cards';
import { chartHueTone } from '../../src/chart-cards/palette';
import { RiMegaphoneLine } from '../../src/icons/remix';
import { StatCards } from '../../src/stat-cards';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { useTheme } from '../../src/theme/use-theme';
import { DashboardShell, ThreeUpChartRow, TwoUpChartRow } from '../shared/dashboard';
import { CampaignsTable } from './CampaignsTable';
import {
  compactNumber,
  currency,
  FUNNEL_RANGES,
  MARKETING_STATS,
  ROAS_LINE,
  SPEND_BAR,
  SPEND_RANGES,
  SPEND_ROAS_RANGES,
  TRAFFIC_TABS,
  VISITOR_RANGES,
  VISITOR_SERIES,
} from './marketing-data';

/**
 * The marketing dashboard template: the floating sidebar / reveal-drawer
 * shell, KPI stat cards, a 3-up row (acquisition funnel, spend-by-channel
 * half gauge, traffic sources bar list), a 2-up row (ad spend vs. ROAS combo,
 * visitors-by-channel area, both with stat tiles) and the campaigns data
 * table.
 */
export function MarketingDashboardTemplate() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // `var(--color-chart-6)` / `-active`.
  const roasLine = useMemo<ComboSeries>(() => ({ ...ROAS_LINE, ...chartHueTone(theme, 6) }), [theme]);

  return (
    <DashboardShell selected="marketing" title="Marketing" crumbIcon={RiMegaphoneLine} primaryAction="New campaign">
      {/* One per row on phones (`max-sm:grid-cols-1`) — a 2-up KPI grid at
          390px crushes the values. The shared 2-up from sm, 4-up from lg. */}
      <StatCards stats={MARKETING_STATS} columns={width < BREAKPOINTS.sm ? 1 : 4} />
      <ThreeUpChartRow>
        <FunnelChartCard
          title="Acquisition funnel"
          ranges={FUNNEL_RANGES}
          defaultRange="30d"
          format={compactNumber}
        />
        <RadialChartCard
          variant="stacked"
          title="Spend by channel"
          ranges={SPEND_RANGES}
          defaultRange="30d"
          format={currency}
        />
        <BarListCard tabs={TRAFFIC_TABS} metricLabel="Sessions" />
      </ThreeUpChartRow>
      {/* Both cards carry stat tiles, so they grow together. */}
      <TwoUpChartRow>
        <ComboChartCard title="Ad spend" bar={SPEND_BAR} line={roasLine} ranges={SPEND_ROAS_RANGES} tiles />
        <AreaChartCard title="Visitors" series={VISITOR_SERIES} ranges={VISITOR_RANGES} tiles />
      </TwoUpChartRow>
      <CampaignsTable />
    </DashboardShell>
  );
}
