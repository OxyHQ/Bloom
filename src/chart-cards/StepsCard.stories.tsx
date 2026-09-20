import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StepsCard, type StepsPoint } from './StepsCard';

const meta: Meta<typeof StepsCard> = {
  argTypes: {
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "totalSuffix": { control: 'text' },
    "pointSuffix": { control: 'text' },
    "range": { control: 'text' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Steps',
  component: StepsCard,
};

export default meta;

type Story = StoryObj<typeof StepsCard>;

// Demo data: a deterministic week of step counts.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hash(seed: number) {
  let h = Math.imul(seed ^ 0x9e3779b9, 2654435761);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function weekData(offset: number): StepsPoint[] {
  return DAYS.map((label, i) => {
    let value = Math.round((1800 + hash(offset * 100 + i) * 7000) / 100) * 100;
    if (offset === 0 && label === 'Thu') value = Math.round((value * 0.8) / 100) * 100;
    if (offset === 0 && label === 'Wed') value = Math.round((value * 0.85) / 100) * 100;
    return { label, value };
  });
}

function weekLabel(offset: number) {
  const start = new Date(2026, 5, 29);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()} ${MONTHS[start.getMonth()]} - ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

const Frame = ({ children, width = 360 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

function Weekly({ testID, width }: { testID?: string; width?: number }) {
  const [offset, setOffset] = useState(0);
  const data = useMemo(() => weekData(offset), [offset]);
  return (
    <StepsCard
      testID={testID}
      style={width ? { width } : undefined}
      data={data}
      range={weekLabel(offset)}
      onPrevRange={() => setOffset((o) => o - 1)}
      onNextRange={() => setOffset((o) => o + 1)}
    />
  );
}

/** A week of steps; the chevrons page through weeks (the label rolls, the bars morph). */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Weekly testID="steps" />
    </Frame>
  ),
};

/** Thursday hovered (controlled): the header rolls to the day, its bar darkens inside an outline. */
export const Hovered: Story = {
  args: { activeIndex: 3 },
  parameters: { controls: { include: ["activeIndex","title","headline","totalSuffix","pointSuffix","color","activeColor"] } },
  render: (args) => (
    <Frame>
      <StepsCard {...args} data={weekData(0)} range={weekLabel(0)}  />
    </Frame>
  ),
};

/** The widest dashboard column: bars cap at 50px. A static pill and a custom colour. */
export const Wide: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={440}>
      <StepsCard data={weekData(2)} range="This week" />
      <StepsCard title="Floors" data={weekData(3).map((d) => ({ ...d, value: Math.round(d.value / 400) }))} totalSuffix="total floors" pointSuffix="floors" color="#f97316" />
    </Frame>
  ),
};
