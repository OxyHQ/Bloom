import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ComboChartCard, formatPercent } from './ComboChartCard';
import type { ComboPoint, ComboRange, ComboSeries } from './ComboChartCard';
import { formatNumber } from './primitives/format';

const meta: Meta<typeof ComboChartCard> = {
  title: 'Charts/Combo Chart',
  component: ComboChartCard,
};

export default meta;

type Story = StoryObj<typeof ComboChartCard>;

// Demo data: sessions against conversion rate.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const rowsOf = (sessions: number[], rate: number[], offset = 0): ComboPoint[] =>
  sessions.map((value, i) => ({ label: MONTHS[i + offset]!, sessions: value, rate: rate[i]! }));

const YEAR = rowsOf(
  [4200, 4800, 5600, 5200, 6400, 7100, 6800, 7600, 8400, 8100, 9200, 9800],
  [2.4, 2.6, 3.1, 2.9, 3.4, 3.8, 3.6, 4.1, 4.4, 4.2, 4.8, 5.2],
);

const BAR: ComboSeries = { key: 'sessions', label: 'Sessions', format: formatNumber };
const LINE: ComboSeries = { key: 'rate', label: 'Conversion', format: formatPercent };

const RANGES: ComboRange[] = [
  { id: 'year', label: 'This year', data: YEAR, delta: 0.094 },
  {
    id: 'h2',
    label: 'Last 6 months',
    data: rowsOf([6800, 7600, 8400, 8100, 9200, 9800], [3.6, 4.1, 4.4, 4.2, 4.8, 5.2], 6),
    delta: 0.121,
  },
  {
    id: 'prev',
    label: 'Last year',
    data: rowsOf(
      [3100, 3400, 3900, 3700, 4300, 4600, 4400, 5100, 5400, 5200, 5900, 6300],
      [1.9, 2.1, 2.4, 2.2, 2.7, 2.9, 2.8, 3.2, 3.3, 3.1, 3.6, 3.9],
    ),
    delta: -0.028,
  },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Bars on the left axis, the line on the right, a period dropdown. */
export const Default: Story = {
  render: () => (
    <Frame>
      <ComboChartCard testID="combo" bar={BAR} line={LINE} ranges={RANGES} />
    </Frame>
  ),
};

/** Stat tiles under a 196px plot: the bar total and the line average. */
export const Tiles: Story = {
  render: () => (
    <Frame>
      <ComboChartCard testID="combo" bar={BAR} line={LINE} ranges={RANGES} tiles />
    </Frame>
  ),
};

/** July hovered (controlled): its bar darkens, the rest dim, the line dot pulses, the tiles follow. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <ComboChartCard bar={BAR} line={LINE} ranges={RANGES} activeIndex={6} />
      <ComboChartCard bar={BAR} line={LINE} ranges={RANGES} activeIndex={6} tiles />
    </Frame>
  ),
};

/** The line as the headline, a static pill, and a custom caption. */
export const HeadlineFromLine: Story = {
  render: () => (
    <Frame>
      <ComboChartCard bar={BAR} line={LINE} data={YEAR} headlineFrom="line" range="This year" />
      <ComboChartCard
        title="Traffic"
        bar={{ ...BAR, label: 'Visits' }}
        line={{ ...LINE, label: 'Signups' }}
        data={YEAR}
        delta={0}
        caption={(row) => (row ? `${formatNumber(Number(row.sessions))} visits, ${row.rate}% converted` : 'last 12 months')}
      />
    </Frame>
  ),
};

/** Phone width: month labels thin out, tiles go two per row. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <ComboChartCard bar={BAR} line={LINE} ranges={RANGES} tiles />
    </Frame>
  ),
};
