import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LineChartCard } from './LineChartCard';
import type { LinePoint, LineRange } from './LineChartCard';

const meta: Meta<typeof LineChartCard> = {
  argTypes: {
    "shape": { control: 'select', options: ["curved","sharp"] },
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "delta": { control: 'number' },
    "defaultRange": { control: 'text' },
    "rangesLabel": { control: 'text' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Line Chart',
  component: LineChartCard,
};

export default meta;

type Story = StoryObj<typeof LineChartCard>;

// Demo periods.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const zip = (values: number[]): LinePoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));

const RANGES: LineRange[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    headline: 18240,
    delta: 0.094,
    data: zip([1400, 1900, 2600, 2300, 3400, 3100, 2700, 3800, 4600, 4200, 3600, 5200]),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    headline: 64820,
    delta: 0.126,
    data: zip([3200, 4100, 3800, 5200, 6400, 5900, 5100, 6800, 8100, 7600, 8400, 9600]),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    headline: 512400,
    delta: -0.032,
    data: zip([28000, 34000, 46000, 41000, 52000, 49000, 61000, 55000, 68000, 72000, 64000, 83000]),
  },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** The home dashboard's revenue card: curved line over a gradient, Weekly / Monthly / Yearly. */
export const Curved: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <LineChartCard testID="line" ranges={RANGES} />
    </Frame>
  ),
};

/** Straight segments between the points. */
export const Sharp: Story = {
  args: { shape: "sharp" },
  parameters: { controls: { include: ["shape","title","headline","delta","defaultRange","rangesLabel","color","activeColor","activeIndex"] } },
  render: (args) => (
    <Frame>
      <LineChartCard {...args} testID="line"  ranges={RANGES} />
    </Frame>
  ),
};

/** July hovered (controlled): month name, its value, cursor rule and the pulsing dot; the chip hides. */
export const Hovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <LineChartCard ranges={RANGES} activeIndex={6} />
      <LineChartCard shape="sharp" ranges={RANGES} activeIndex={6} />
    </Frame>
  ),
};

/** A falling period selected, and a card without a switcher. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <LineChartCard ranges={RANGES} defaultRange="yearly" />
      <LineChartCard title="Signups" data={RANGES[0]!.data} format={(v) => String(Math.round(v))} formatAxisValue={(v) => `${Math.round(v / 1000)}K`} />
    </Frame>
  ),
};

/**
 * A narrower card. The header stacks on the VIEWPORT (`sm`, 640) — on a phone
 * the switcher drops under the headline; on a desktop viewport a narrow card
 * keeps one row.
 */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={420}>
      <LineChartCard ranges={RANGES} />
    </Frame>
  ),
};
