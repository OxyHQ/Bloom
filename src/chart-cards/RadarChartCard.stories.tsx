import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadarChartCard, type RadarPoint, type RadarRange, type RadarSeries } from './RadarChartCard';

const meta: Meta<typeof RadarChartCard> = {
  argTypes: {
    "variant": { control: 'select', options: ["filled","dots","lines","score"] },
    "title": { control: 'text' },
    "max": { control: 'number' },
    "headline": { control: 'number' },
    "delta": { control: 'number' },
    "range": { control: 'text' },
    "defaultRange": { control: 'text' },
    "alertBelow": { control: 'number' },
    "tiles": { control: 'boolean' },
    "radiusScale": { control: 'number' },
    "plotOffsetY": { control: 'number' },
    "legend": { control: 'select', options: ["bottom","top","overlay"] },
    "activeIndex": { control: 'number' }
  },
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
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** Default look: soft fill + 2px outline, a period dropdown. */
export const Filled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" series={DESKTOP} ranges={RANGES} />
    </Frame>
  ),
};

/** A dot on every vertex. */
export const Dots: Story = {
  args: { variant: "dots" },
  parameters: { controls: { include: ["variant","title","max","headline","delta","range","defaultRange","alertBelow","tiles","radiusScale","plotOffsetY","legend","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RadarChartCard {...args} testID="radar"  series={DESKTOP} ranges={RANGES} />
    </Frame>
  ),
};

/** Outline only — two series compared, legend under the chart. */
export const Lines: Story = {
  args: { variant: "lines", range: "Jan – Jun 2024" },
  parameters: { controls: { include: ["variant","range","title","max","headline","delta","defaultRange","alertBelow","tiles","radiusScale","plotOffsetY","legend","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RadarChartCard {...args} testID="radar"  series={BOTH} data={H1}  />
    </Frame>
  ),
};

/** Axis values on the labels, the average in a raised centre disc, values under 50 in rose. */
export const Score: Story = {
  args: { variant: "score", alertBelow: 50 },
  parameters: { controls: { include: ["variant","alertBelow","title","max","headline","delta","range","defaultRange","tiles","radiusScale","plotOffsetY","legend","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RadarChartCard {...args} testID="radar"  series={SCORE_SERIES} ranges={SCORE_RANGES}  />
    </Frame>
  ),
};

/** The multi-series legend in the header, or overlaid on the chart — the card keeps its height. */
export const LegendPlacement: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <RadarChartCard testID="radar" variant="lines" series={BOTH} ranges={RANGES} legend="top" />
      <RadarChartCard series={BOTH} ranges={RANGES} legend="overlay" />
    </Frame>
  ),
};

/** Stat tiles, one per axis; the card grows to fit. */
export const Tiles: Story = {
  args: { tiles: true },
  parameters: { controls: { include: ["tiles","variant","title","max","headline","delta","range","defaultRange","alertBelow","radiusScale","plotOffsetY","legend","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RadarChartCard {...args} testID="radar" series={DESKTOP} ranges={RANGES}  />
    </Frame>
  ),
};

/** February hovered (controlled): header, label, pulsing dots, legend values, dimmed tiles. */
export const Hovered: Story = {
  parameters: { controls: { disable: true } },
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
  args: { radiusScale: 1.15 },
  parameters: { controls: { include: ["radiusScale","variant","title","max","headline","delta","range","defaultRange","alertBelow","tiles","legend","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RadarChartCard {...args} series={DESKTOP} ranges={RANGES}  plotOffsetY={-6} />
    </Frame>
  ),
};
