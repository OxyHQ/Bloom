import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EarningsChartCard } from './EarningsChartCard';
import type { EarningsPoint, EarningsRange } from './EarningsChartCard';

const meta: Meta<typeof EarningsChartCard> = {
  argTypes: {
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "delta": { control: 'number' },
    "defaultRange": { control: 'text' },
    "rangesLabel": { control: 'text' },
    "yMax": { control: 'number' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Earnings Chart',
  component: EarningsChartCard,
};

export default meta;

type Story = StoryObj<typeof EarningsChartCard>;

// Demo periods and axis ticks.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const zip = (values: number[]): EarningsPoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));
const Y_TICKS = [0, 3000, 5000, 10000];
const Y_MAX = 12000;

const RANGES: EarningsRange[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    headline: 7462,
    delta: 0.148,
    data: zip([3240, 7420, 9650, 7130, 3670, 2300, 3820, 5040, 6840, 4540, 11520, 8210]),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    headline: 32180,
    delta: 0.082,
    data: zip([5200, 6100, 7300, 8900, 9600, 10800, 11200, 9800, 8600, 7400, 6900, 8100]),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    headline: 389204,
    delta: 0.214,
    data: zip([4200, 4800, 5600, 6100, 6800, 7500, 8200, 8900, 9600, 10300, 11000, 11600]),
  },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** "Earned so far": bars in full-height tracks, Figma ticks, Weekly / Monthly / Yearly. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <EarningsChartCard testID="earn" ranges={RANGES} yTicks={Y_TICKS} yMax={Y_MAX} />
    </Frame>
  ),
};

/** June hovered (controlled): the outline around its track, the darker bar, the month in the header. */
export const Hovered: Story = {
  args: { activeIndex: 5 },
  parameters: { controls: { include: ["activeIndex","title","headline","delta","defaultRange","rangesLabel","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <EarningsChartCard {...args} ranges={RANGES} yTicks={Y_TICKS} yMax={Y_MAX}  />
    </Frame>
  ),
};

/** Recharts' nice ticks when no Figma ticks are given, and the card without a switcher. */
export const AutoAxis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <EarningsChartCard ranges={RANGES} defaultRange="yearly" />
      <EarningsChartCard title="Payouts" data={RANGES[1]!.data} delta={-0.021} />
    </Frame>
  ),
};

/** The dashboard's wide slot (`xl:w-[673px]`), and a narrower card (the header stacks on the viewport, not the card). */
export const Widths: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={673}>
      <EarningsChartCard ranges={RANGES} yTicks={Y_TICKS} yMax={Y_MAX} />
      <View style={{ maxWidth: '100%', width: 420 }}>
        <EarningsChartCard ranges={RANGES} yTicks={Y_TICKS} yMax={Y_MAX} />
      </View>
    </Frame>
  ),
};
