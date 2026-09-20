import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AgentsChartCard, type AgentsPoint } from './AgentsChartCard';

const meta: Meta<typeof AgentsChartCard> = {
  argTypes: {
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "range": { control: 'text' },
    "prevRangeLabel": { control: 'text' },
    "nextRangeLabel": { control: 'text' },
    "startLabel": { control: 'text' },
    "endLabel": { control: 'text' },
    "trackHeight": { control: 'number' },
    "maxBarHeight": { control: 'number' },
    "max": { control: 'number' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Agents Chart',
  component: AgentsChartCard,
};

export default meta;

type Story = StoryObj<typeof AgentsChartCard>;

// Demo data: December's bar heights, a hash-scattered month for the
// others, ~5px of bar per agent.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DECEMBER = [
  73, 141, 118, 0, 118, 18, 0, 0, 0, 95,
  0, 158, 78, 45, 0, 45, 135, 88, 0, 0,
  107, 21, 45, 105, 87, 66, 19, 128, 98, 34,
];

function hash(a: number, b: number) {
  let h = a * 374761393 + b * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function month(m: number): { data: AgentsPoint[]; headline: number } {
  const bars =
    m === 11
      ? DECEMBER
      : Array.from({ length: 30 }, (_, day) => {
          const seed = hash(m + 1, day + 7);
          return seed % 4 === 0 ? 0 : 18 + (seed % 140);
        });
  return {
    data: bars.map((h, day) => ({ label: `${MONTHS[m]!.slice(0, 3)} ${day + 1}`, value: h / 5 })),
    headline: m === 11 ? 32 : 22 + (hash(m + 3, 17) % 27),
  };
}

const MAX = 158 / 5;

const Frame = ({ children, width = 680 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

function Switchable({ testID, width }: { testID?: string; width?: number }) {
  const [m, setM] = useState(11);
  const { data, headline } = useMemo(() => month(m), [m]);
  return (
    <AgentsChartCard
      testID={testID}
      style={width ? { width } : undefined}
      data={data}
      headline={headline}
      max={MAX}
      range={MONTHS[m]}
      onPrevRange={() => setM((v) => (v + 11) % 12)}
      onNextRange={() => setM((v) => (v + 1) % 12)}
    />
  );
}

/** December, per the design; the chevrons page months (the label rolls, the bars rise again). Hover a day. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Switchable testID="agents" />
    </Frame>
  ),
};

/** Dec 12 hovered (controlled): the bar darkens, the header shows the day. */
export const Hovered: Story = {
  args: { range: "December", activeIndex: 11 },
  parameters: { controls: { include: ["range","activeIndex","title","headline","prevRangeLabel","nextRangeLabel","startLabel","endLabel","trackHeight","maxBarHeight","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <AgentsChartCard {...args} {...month(11)} max={MAX}   />
    </Frame>
  ),
};

/** An idle day hovered: the 4px stub takes the cursor colour. */
export const IdleDayHovered: Story = {
  args: { range: "December", activeIndex: 3 },
  parameters: { controls: { include: ["range","activeIndex","title","headline","prevRangeLabel","nextRangeLabel","startLabel","endLabel","trackHeight","maxBarHeight","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <AgentsChartCard {...args} {...month(11)} max={MAX}   />
    </Frame>
  ),
};

/** A phone-width column, no pill, custom colours and axis labels. */
export const Narrow: Story = {
  args: { title: "Runs", color: "#fdba74", activeColor: "#f97316", startLabel: "May 1", endLabel: "May 30" },
  parameters: { controls: { include: ["title","color","activeColor","startLabel","endLabel","headline","range","prevRangeLabel","nextRangeLabel","trackHeight","maxBarHeight","max","activeIndex"] } },
  render: (args) => (
    <Frame width={358}>
      <AgentsChartCard {...args}
        {...month(4)}

        format={(v) => `${v} runs`}




      />
    </Frame>
  ),
};
