import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadarChartCard, type RadarPoint, type RadarRange, type RadarSeries } from './RadarChartCard';

const meta: Meta<typeof RadarChartCard> = {
  title: 'Charts/Radar Chart',
  component: RadarChartCard,
};

export default meta;

type Story = StoryObj<typeof RadarChartCard>;

// Demo data.
const H1: RadarPoint[] = [
  { label: 'January', desktop: 186, mobile: 80 },
  { label: 'February', desktop: 305, mobile: 200 },
  { label: 'March', desktop: 237, mobile: 120 },
  { label: 'April', desktop: 273, mobile: 190 },
  { label: 'May', desktop: 209, mobile: 130 },
  { label: 'June', desktop: 214, mobile: 140 },
];

const H2: RadarPoint[] = [
  { label: 'July', desktop: 244, mobile: 160 },
  { label: 'August', desktop: 198, mobile: 122 },
  { label: 'September', desktop: 286, mobile: 190 },
  { label: 'October', desktop: 312, mobile: 210 },
  { label: 'November', desktop: 262, mobile: 175 },
  { label: 'December', desktop: 331, mobile: 240 },
];

const DESKTOP: RadarSeries[] = [{ key: 'desktop', label: 'Desktop' }];
const BOTH: RadarSeries[] = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'mobile', label: 'Mobile' },
];

const RANGES: RadarRange[] = [
  { id: 'h1', label: 'H1 2024', data: H1, delta: 0.052 },
  { id: 'h2', label: 'H2 2024', data: H2, delta: 0.081 },
  {
    id: 'year',
    label: '2024',
    data: [...H1, ...H2].map((row) => ({ ...row, label: String(row.label).slice(0, 3) })),
    delta: 0.067,
  },
];

const SCORE_SERIES: RadarSeries[] = [{ key: 'score', label: 'Score' }];
const scoreRows = (values: number[]): RadarPoint[] =>
  ['Focus', 'Consistency', 'Target', 'Balance', 'Deep work'].map((label, i) => ({ label, score: values[i]! }));

const SCORE_RANGES: RadarRange[] = [
  { id: 'this-week', label: 'This week', data: scoreRows([100, 9, 100, 100, 97]) },
  { id: 'last-week', label: 'Last week', data: scoreRows([82, 64, 90, 71, 88]) },
  { id: 'this-month', label: 'This month', data: scoreRows([91, 48, 96, 84, 93]) },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Default look: soft fill + 2px outline, a period dropdown. */
export const Filled: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" series={DESKTOP} ranges={RANGES} />
    </Frame>
  ),
};

/** A dot on every vertex. */
export const Dots: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" variant="dots" series={DESKTOP} ranges={RANGES} />
    </Frame>
  ),
};

/** Outline only — two series compared, legend under the chart. */
export const Lines: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" variant="lines" series={BOTH} data={H1} range="Jan – Jun 2024" />
    </Frame>
  ),
};

/** Axis values on the labels, the average in a raised centre disc, values under 50 in rose. */
export const Score: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" variant="score" series={SCORE_SERIES} ranges={SCORE_RANGES} alertBelow={50} />
    </Frame>
  ),
};

/** The multi-series legend in the header, or overlaid on the chart — the card keeps its height. */
export const LegendPlacement: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" variant="lines" series={BOTH} ranges={RANGES} legend="top" />
      <RadarChartCard series={BOTH} ranges={RANGES} legend="overlay" />
    </Frame>
  ),
};

/** Stat tiles, one per axis; the card grows to fit. */
export const Tiles: Story = {
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" series={DESKTOP} ranges={RANGES} tiles />
    </Frame>
  ),
};

/** February hovered (controlled): header, label, pulsing dots, legend values, dimmed tiles. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <RadarChartCard series={BOTH} ranges={RANGES} activeIndex={1} />
      <RadarChartCard variant="score" series={SCORE_SERIES} ranges={SCORE_RANGES} alertBelow={50} activeIndex={1} />
      <RadarChartCard series={DESKTOP} ranges={RANGES} tiles activeIndex={1} />
    </Frame>
  ),
};

/** `radiusScale` and `plotOffsetY` tune the polygon inside a fixed card. */
export const Scaled: Story = {
  render: () => (
    <Frame>
      <RadarChartCard series={DESKTOP} ranges={RANGES} radiusScale={1.15} plotOffsetY={-6} />
    </Frame>
  ),
};
