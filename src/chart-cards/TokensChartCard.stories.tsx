import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokensChartCard, type TokensPoint } from './TokensChartCard';

const meta: Meta<typeof TokensChartCard> = {
  argTypes: {
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "delta": { control: 'text' },
    "startLabel": { control: 'text' },
    "endLabel": { control: 'text' },
    "plotHeight": { control: 'number' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
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
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** The design: 667.7M tokens and a +9.4% chip; the plot wipes in. Hover a day. */
export const Default: Story = {
  args: { headline: 667.7, delta: "+9.4%" },
  parameters: { controls: { include: ["headline","delta","title","startLabel","endLabel","plotHeight","color","activeColor","activeIndex"] } },
  render: (args) => (
    <Frame>
      <TokensChartCard {...args} testID="tokens" data={SERIES}   />
    </Frame>
  ),
};

/** Jul 5 hovered (controlled): the dashed cursor, the pulsing dot, the day's value. */
export const Hovered: Story = {
  args: { headline: 667.7, delta: "+9.4%", activeIndex: 21 },
  parameters: { controls: { include: ["headline","delta","activeIndex","title","startLabel","endLabel","plotHeight","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <TokensChartCard {...args} data={SERIES}    />
    </Frame>
  ),
};

/** An idle day hovered: the dot turns grey on the dashed baseline. */
export const IdleDayHovered: Story = {
  args: { headline: 667.7, delta: "+9.4%", activeIndex: 7 },
  parameters: { controls: { include: ["headline","delta","activeIndex","title","startLabel","endLabel","plotHeight","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <TokensChartCard {...args} data={SERIES}    />
    </Frame>
  ),
};

/** A phone-width column: no chip, the headline summed from the data, custom colours. */
export const Narrow: Story = {
  args: { title: "Requests", color: "#2dd4bf", activeColor: "#14b8a6", startLabel: "Jun 26", endLabel: "Today" },
  parameters: { controls: { include: ["title","color","activeColor","startLabel","endLabel","headline","delta","plotHeight","activeIndex"] } },
  render: (args) => (
    <Frame width={358}>
      <TokensChartCard {...args}

        data={SERIES.slice(12)}
        format={(v) => `${v.toFixed(1)}K requests`}




      />
    </Frame>
  ),
};
