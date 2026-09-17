import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeatmapChartCard } from './HeatmapChartCard';
import type { HeatmapRange, HeatmapRow } from './HeatmapChartCard';

const meta: Meta<typeof HeatmapChartCard> = {
  title: 'Charts/Heatmap Chart',
  component: HeatmapChartCard,
};

export default meta;

type Story = StoryObj<typeof HeatmapChartCard>;

// Demo data: active users by weekday × hour.
const COLUMNS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];

const ROWS: HeatmapRow[] = [
  { label: 'Mon', values: [4, 2, 1, 6, 28, 46, 52, 58, 44, 30, 18, 9] },
  { label: 'Tue', values: [3, 2, 2, 8, 32, 50, 55, 62, 48, 33, 20, 10] },
  { label: 'Wed', values: [5, 3, 1, 7, 30, 48, 57, 60, 47, 31, 19, 8] },
  { label: 'Thu', values: [4, 2, 2, 9, 34, 52, 60, 64, 50, 35, 22, 11] },
  { label: 'Fri', values: [6, 3, 2, 8, 29, 44, 49, 46, 36, 24, 15, 9] },
  { label: 'Sat', values: [8, 5, 3, 4, 12, 20, 26, 28, 25, 22, 16, 12] },
  { label: 'Sun', values: [7, 4, 2, 3, 10, 17, 22, 24, 23, 20, 14, 10] },
];

/** Longer periods: the week scaled up with a small deterministic wobble so the pattern shifts. */
const scaleRows = (rows: HeatmapRow[], factor: number): HeatmapRow[] =>
  rows.map((row, r) => ({
    label: row.label,
    values: row.values.map((v, c) => Math.round(v * factor * (1 + ((((r * 7 + c * 3) % 5) - 2) * 0.06)))),
  }));

const RANGES: HeatmapRange[] = [
  { id: '7d', label: 'Last 7 days', rows: ROWS, delta: 0.052 },
  { id: '4w', label: 'Last 4 weeks', rows: scaleRows(ROWS, 3.8), delta: 0.118 },
  { id: 'quarter', label: 'Last quarter', rows: scaleRows(ROWS, 11.4), delta: 0.034 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Weekday × hour, a period dropdown, the Less → More legend. */
export const Default: Story = {
  render: () => (
    <Frame>
      <HeatmapChartCard testID="heatmap" columns={COLUMNS} ranges={RANGES} />
    </Frame>
  ),
};

/** A hovered cell (controlled): ring, active colour, darkened row + column labels, header swap. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <HeatmapChartCard columns={COLUMNS} ranges={RANGES} activeCell={{ row: 3, col: 7 }} />
    </Frame>
  ),
};

/** Region × month with a custom accent, a fixed `max`, a static pill and a falling delta. */
export const CustomAccent: Story = {
  render: () => (
    <Frame>
      <HeatmapChartCard
        title="Orders"
        range="2024"
        delta={-0.021}
        color="#f97316"
        max={100}
        columns={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        rows={['North America', 'Europe', 'Asia', 'LATAM'].map((label, r) => ({
          label,
          values: Array.from({ length: 12 }, (_, c) => ((r * 31 + c * 17) % 90) + 5),
        }))}
        legendLabels={['Fewer', 'More']}
      />
    </Frame>
  ),
};

/** 24 hourly columns: every other label shows. */
export const DenseColumns: Story = {
  render: () => (
    <Frame>
      <HeatmapChartCard
        range="Last 7 days"
        columns={Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))}
        rows={ROWS.map((row) => ({ label: row.label, values: row.values.flatMap((v) => [v, Math.round(v * 0.8)]) }))}
      />
    </Frame>
  ),
};

/** A phone-width card. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <HeatmapChartCard columns={COLUMNS} ranges={RANGES} />
    </Frame>
  ),
};
