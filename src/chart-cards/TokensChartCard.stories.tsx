import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokensChartCard, type TokensPoint } from './TokensChartCard';

const meta: Meta<typeof TokensChartCard> = {
  title: 'Charts/Tokens Chart',
  component: TokensChartCard,
};

export default meta;

type Story = StoryObj<typeof TokensChartCard>;

// The demo series: 30 days of tokens in millions, Jun 14 → Jul 13, with a
// long idle stretch and a big multi-day push.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VALUES = [
  34.2, 28.6, 6.1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 31.4, 4.8, 2.2, 1.1, 5.6, 1.4, 0.8, 42.1,
  51.8, 48.3, 33.6, 9.2, 3.4, 18.7, 25.3, 37.9, 30.2, 24.6,
];
const SERIES: TokensPoint[] = VALUES.map((value, day) => {
  const d = new Date(Date.UTC(2026, 5, 14 + day));
  return { label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`, value };
});

const Frame = ({ children, width = 680 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** The design: 667.7M tokens and a +9.4% chip; the plot wipes in. Hover a day. */
export const Default: Story = {
  render: () => (
    <Frame>
      <TokensChartCard testID="tokens" data={SERIES} headline={667.7} delta="+9.4%" />
    </Frame>
  ),
};

/** Jul 5 hovered (controlled): the dashed cursor, the pulsing dot, the day's value. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <TokensChartCard data={SERIES} headline={667.7} delta="+9.4%" activeIndex={21} />
    </Frame>
  ),
};

/** An idle day hovered: the dot turns grey on the dashed baseline. */
export const IdleDayHovered: Story = {
  render: () => (
    <Frame>
      <TokensChartCard data={SERIES} headline={667.7} delta="+9.4%" activeIndex={7} />
    </Frame>
  ),
};

/** A phone-width column: no chip, the headline summed from the data, custom colours. */
export const Narrow: Story = {
  render: () => (
    <Frame width={358}>
      <TokensChartCard
        title="Requests"
        data={SERIES.slice(12)}
        format={(v) => `${v.toFixed(1)}K requests`}
        color="#2dd4bf"
        activeColor="#14b8a6"
        startLabel="Jun 26"
        endLabel="Today"
      />
    </Frame>
  ),
};
