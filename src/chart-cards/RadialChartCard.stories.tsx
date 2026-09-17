import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadialChartCard, type RadialDatum, type RadialRange } from './RadialChartCard';

const meta: Meta<typeof RadialChartCard> = {
  title: 'Charts/Radial Chart',
  component: RadialChartCard,
};

export default meta;

type Story = StoryObj<typeof RadialChartCard>;

// Demo data.
const BROWSERS = ['Other', 'Edge', 'Firefox', 'Safari', 'Chrome'];
const rings = (values: number[]): RadialDatum[] => BROWSERS.map((label, i) => ({ label, value: values[i]! }));

const RING_RANGES: RadialRange[] = [
  { id: '7d', label: 'Last 7 days', data: rings([90, 173, 187, 200, 275]), delta: 0.052 },
  { id: '30d', label: 'Last 30 days', data: rings([410, 520, 760, 690, 1120]), delta: 0.081 },
  { id: '90d', label: 'Last 90 days', data: rings([1480, 1720, 1900, 2610, 3260]), delta: -0.024 },
];

const GAUGE_RANGES: RadialRange[] = [
  { id: '7d', label: 'Last 7 days', data: [{ label: 'Visitors', value: 1260 }], max: 2000, delta: 0.052 },
  { id: '30d', label: 'Last 30 days', data: [{ label: 'Visitors', value: 4820 }], max: 6000, delta: 0.081 },
  { id: '90d', label: 'Last 90 days', data: [{ label: 'Visitors', value: 12400 }], max: 15000, delta: -0.024 },
];

const STACKED_RANGES: RadialRange[] = [
  { id: '7d', label: 'Last 7 days', data: [{ label: 'Desktop', value: 1260 }, { label: 'Mobile', value: 570 }], delta: 0.052 },
  { id: '30d', label: 'Last 30 days', data: [{ label: 'Desktop', value: 4820 }, { label: 'Mobile', value: 2410 }], delta: 0.081 },
  { id: '90d', label: 'Last 90 days', data: [{ label: 'Desktop', value: 12400 }, { label: 'Mobile', value: 7900 }], delta: -0.024 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Default look: one ring per browser over a grey track, first innermost. */
export const Rings: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" ranges={RING_RANGES} />
    </Frame>
  ),
};

/** Each ring's name set along the start of its arc. */
export const Labels: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" variant="labels" ranges={RING_RANGES} />
    </Frame>
  ),
};

/** No tracks: rings over a circular grid. */
export const Grid: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" variant="grid" ranges={RING_RANGES} />
    </Frame>
  ),
};

/** A single thin ring against a goal, percent in the centre. */
export const Gauge: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" variant="gauge" ranges={GAUGE_RANGES} />
    </Frame>
  ),
};

/** The gauge, thicker, on a raised inner disc. */
export const Solid: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" variant="solid" ranges={GAUGE_RANGES} />
    </Frame>
  ),
};

/** A half gauge of stacked segments; the centre follows the hovered one. */
export const Stacked: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" variant="stacked" ranges={STACKED_RANGES} />
    </Frame>
  ),
};

/** Stat tiles instead of a legend; the card grows to fit (5 items → 3 + 2). */
export const Tiles: Story = {
  render: () => (
    <Frame>
      <RadialChartCard testID="radial" ranges={RING_RANGES} tiles />
    </Frame>
  ),
};

/** Safari hovered (controlled) in every family, with a static pill and a goal. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <RadialChartCard ranges={RING_RANGES} activeIndex={3} />
      <RadialChartCard variant="labels" ranges={RING_RANGES} activeIndex={3} tiles />
      <RadialChartCard variant="stacked" range="Last 7 days" data={STACKED_RANGES[0]!.data} max={2400} activeIndex={1} />
    </Frame>
  ),
};

/** A phone-width card: the half gauge's chart area keeps a 180px floor and the card grows. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <RadialChartCard variant="stacked" ranges={STACKED_RANGES} />
      <RadialChartCard ranges={RING_RANGES} tiles />
    </Frame>
  ),
};
