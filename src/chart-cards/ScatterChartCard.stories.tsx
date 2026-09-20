import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScatterChartCard } from './ScatterChartCard';
import type { ScatterPoint, ScatterRange, ScatterSeries } from './ScatterChartCard';

const meta: Meta<typeof ScatterChartCard> = {
  argTypes: {
    "title": { control: 'text' },
    "bubble": { control: 'boolean' },
    "headline": { control: 'number' },
    "delta": { control: 'number' },
    "range": { control: 'text' },
    "defaultRange": { control: 'text' },
    "tiles": { control: 'boolean' }
  },
  title: 'Charts/Scatter Chart',
  component: ScatterChartCard,
};

export default meta;

type Story = StoryObj<typeof ScatterChartCard>;

// Demo data: accounts by seats (x), MRR (y) and usage (z).
const points = (pairs: [number, number, number?][], labels: string[]): ScatterPoint[] =>
  pairs.map(([x, y, z], i) => ({ x, y, z, label: labels[i] }));

const SERIES: ScatterSeries[] = [
  {
    label: 'Starter',
    points: points(
      [[12, 180, 40], [18, 240, 60], [24, 210, 30], [31, 320, 80], [38, 290, 50], [45, 380, 70]],
      ['Acme', 'Bolt', 'Corvus', 'Delta', 'Ember', 'Flux'],
    ),
  },
  {
    label: 'Growth',
    points: points(
      [[42, 620, 90], [55, 740, 120], [61, 690, 70], [68, 880, 150], [74, 810, 100], [83, 960, 130]],
      ['Gale', 'Helio', 'Ionic', 'Juno', 'Kite', 'Lumen'],
    ),
  },
  {
    label: 'Scale',
    points: points([[78, 1240, 180], [86, 1420, 220], [92, 1310, 160], [97, 1580, 260]], ['Meridian', 'Nova', 'Orbit', 'Prism']),
  },
];

const scaleSeries = (series: ScatterSeries[], factor: number): ScatterSeries[] =>
  series.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, y: Math.round(p.y * factor) })) }));

const RANGES: ScatterRange[] = [
  { id: 'q3', label: 'This quarter', series: SERIES, delta: 0.068 },
  { id: 'q2', label: 'Last quarter', series: scaleSeries(SERIES, 0.82), delta: 0.041 },
  { id: 'year', label: 'This year', series: scaleSeries(SERIES, 3.6), delta: -0.019 },
];

const PLAIN: ScatterSeries[] = SERIES.map((s) => ({ ...s, points: s.points.map(({ z: _z, ...p }) => p) }));

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** Bubbles sized by `z`, a period dropdown, the legend of averages. */
export const Bubble: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <ScatterChartCard testID="scatter" ranges={RANGES} />
    </Frame>
  ),
};

/** No `z`: plain 64px² dots. A static pill. */
export const Scatter: Story = {
  args: { range: "This quarter", delta: 0.068 },
  parameters: { controls: { include: ["range","delta","title","bubble","headline","defaultRange","tiles"] } },
  render: (args) => (
    <Frame>
      <ScatterChartCard {...args} testID="scatter" series={PLAIN}   />
    </Frame>
  ),
};

/** Axis captions and stat tiles; hovering a tile focuses its series. */
export const Tiles: Story = {
  args: { tiles: true },
  parameters: { controls: { include: ["tiles","title","bubble","headline","delta","range","defaultRange"] } },
  render: (args) => (
    <Frame>
      <ScatterChartCard {...args} testID="scatter" ranges={RANGES}  axisLabels={['Seats', 'MRR']} />
    </Frame>
  ),
};

/** A hovered point (controlled): header "Juno · 68", the other series dimmed. */
export const Hovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <ScatterChartCard ranges={RANGES} activePoint={{ series: 1, index: 3 }} />
      <ScatterChartCard ranges={RANGES} activePoint={{ series: 2, index: 1 }} tiles axisLabels={['Seats', 'MRR']} />
    </Frame>
  ),
};

/** Custom colours and formatters, a falling delta. */
export const Custom: Story = {
  args: { title: "Response time vs load", range: "Today" },
  parameters: { controls: { include: ["title","range","bubble","headline","defaultRange","tiles"] } },
  render: (args) => (
    <Frame>
      <ScatterChartCard {...args}

        series={[
          { label: 'EU', color: '#f97316', points: points([[120, 42], [340, 55], [610, 71], [880, 96], [1150, 140]], ['a', 'b', 'c', 'd', 'e']) },
          { label: 'US', points: points([[90, 38], [300, 47], [540, 63], [790, 82], [1210, 118]], ['f', 'g', 'h', 'i', 'j']) },
        ]}
        format={(v) => `${Math.round(v)}ms`}
        formatX={(v) => `${v} rps`}

        delta={-0.12}
      />
    </Frame>
  ),
};

/** A phone-width card. */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={320}>
      <ScatterChartCard ranges={RANGES} />
    </Frame>
  ),
};
