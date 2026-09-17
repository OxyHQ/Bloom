import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AreaChartCard } from './index';
import type { AreaPoint, AreaRange, AreaSeries } from './types';

const meta: Meta<typeof AreaChartCard> = {
  title: 'Charts/Area Chart',
  component: AreaChartCard,
};

export default meta;

type Story = StoryObj<typeof AreaChartCard>;

// Demo data: a year of visitors by channel.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const rowsOf = (organic: number[], referral: number[], paid: number[], offset = 0): AreaPoint[] =>
  organic.map((value, i) => ({
    label: MONTHS[i + offset]!,
    organic: value,
    referral: referral[i]!,
    paid: paid[i]!,
  }));

const SERIES: AreaSeries[] = [
  { key: 'organic', label: 'Organic' },
  { key: 'referral', label: 'Referral' },
  { key: 'paid', label: 'Paid' },
];

const YEAR = rowsOf(
  [2400, 2800, 3200, 3000, 3600, 4200, 4600, 4400, 5100, 5600, 5400, 6200],
  [1200, 1400, 1300, 1700, 1900, 1800, 2200, 2500, 2400, 2900, 3200, 3400],
  [800, 700, 1100, 900, 1300, 1500, 1400, 1800, 2000, 1900, 2300, 2600],
);

const RANGES: AreaRange[] = [
  { id: 'year', label: 'This year', data: YEAR, delta: 0.082 },
  {
    id: 'h2',
    label: 'Last 6 months',
    data: rowsOf(
      [4600, 4400, 5100, 5600, 5400, 6200],
      [2200, 2500, 2400, 2900, 3200, 3400],
      [1400, 1800, 2000, 1900, 2300, 2600],
      6,
    ),
    delta: 0.114,
  },
  {
    id: 'prev',
    label: 'Last year',
    data: rowsOf(
      [1900, 2100, 2000, 2400, 2600, 2500, 3100, 3000, 3400, 3800, 3600, 4100],
      [900, 1100, 1000, 1300, 1200, 1500, 1600, 1800, 1700, 2100, 2300, 2200],
      [600, 500, 800, 700, 900, 1100, 1000, 1200, 1400, 1300, 1600, 1800],
    ),
    delta: -0.036,
  },
];

const WEEK: AreaPoint[] = [
  { label: 'Mon', organic: 120, referral: 40, paid: 12 },
  { label: 'Tue', organic: 180, referral: 60, paid: 30 },
  { label: 'Wed', organic: 150, referral: 90, paid: 20 },
  { label: 'Thu', organic: 210, referral: 70, paid: 44 },
  { label: 'Fri', organic: 260, referral: 110, paid: 52 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Default look: areas stacked into one silhouette, a period dropdown, the legend. */
export const Stacked: Story = {
  render: () => (
    <Frame>
      <AreaChartCard testID="area" series={SERIES} ranges={RANGES} />
    </Frame>
  ),
};

/** Translucent areas drawn over each other; the headline follows the first series. */
export const Overlap: Story = {
  render: () => (
    <Frame>
      <AreaChartCard testID="area" variant="overlap" series={SERIES} ranges={RANGES} />
    </Frame>
  ),
};

/** 100% stacked: every month fills the height, so the chart reads as share. */
export const Percent: Story = {
  render: () => (
    <Frame>
      <AreaChartCard testID="area" variant="percent" series={SERIES} ranges={RANGES} />
    </Frame>
  ),
};

/** Straight segments between points, in every variant. */
export const Sharp: Story = {
  render: () => (
    <Frame>
      <AreaChartCard shape="sharp" series={SERIES} ranges={RANGES} />
      <AreaChartCard shape="sharp" variant="overlap" series={SERIES} ranges={RANGES} />
      <AreaChartCard shape="sharp" variant="percent" series={SERIES} ranges={RANGES} />
    </Frame>
  ),
};

/** Stat tiles instead of the legend; the card grows to fit (a marketing dashboard). */
export const Tiles: Story = {
  render: () => (
    <Frame>
      <AreaChartCard testID="area" title="Visitors" series={SERIES} ranges={RANGES} tiles />
    </Frame>
  ),
};

/** A static period pill and a falling delta. */
export const StaticRange: Story = {
  render: () => (
    <Frame>
      <AreaChartCard testID="area" range="Jan – Dec 2024" delta={-0.036} data={WEEK} series={SERIES} />
    </Frame>
  ),
};

/** July hovered (controlled): header, cursor, active dots, legend values. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <AreaChartCard series={SERIES} ranges={RANGES} activeIndex={6} />
      <AreaChartCard variant="overlap" series={SERIES} ranges={RANGES} activeIndex={6} />
      <AreaChartCard variant="percent" series={SERIES} ranges={RANGES} activeIndex={6} tiles />
    </Frame>
  ),
};

/** Custom series colours, more series than the legend fits on one line, a flat delta. */
export const CustomSeries: Story = {
  render: () => (
    <Frame>
      <AreaChartCard
        title="Sessions"
        delta={0}
        data={YEAR.map((row, i) => ({ ...row, social: 600 + ((i * 137) % 500), email: 300 + ((i * 89) % 260) }))}
        series={[
          ...SERIES,
          { key: 'social', label: 'Social' },
          { key: 'email', label: 'Email', color: '#f97316' },
        ]}
        format={(v) => `${Math.round(v).toLocaleString('en-US')}`}
      />
    </Frame>
  ),
};

/** A phone-width card: month labels thin out, tiles go two per row below `sm`. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <AreaChartCard series={SERIES} ranges={RANGES} />
      <AreaChartCard series={SERIES} ranges={RANGES} tiles />
    </Frame>
  ),
};
