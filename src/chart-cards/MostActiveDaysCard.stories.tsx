import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MostActiveDaysCard, type ActivityDay } from './MostActiveDaysCard';

const meta: Meta<typeof MostActiveDaysCard> = {
  argTypes: {
    "year": { control: 'number' },
    "initialMonth": { control: 'number' },
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "suffix": { control: 'text' }
  },
  title: 'Charts/Most Active Days',
  component: MostActiveDaysCard,
};

export default meta;

type Story = StoryObj<typeof MostActiveDaysCard>;

// Demo data: deterministic ring fractions for 2026, today Jul 10.
const TODAY = { month: 6, day: 10 };

function hash(seed: number) {
  let h = Math.imul(seed ^ 0x9e3779b9, 2654435761);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function ringPct(month: number, day: number, ring: number) {
  const h = hash(month * 1000 + day * 10 + ring);
  if (ring === 0) return 0.18 + h * h * 0.77;
  return 0.3 + h * 0.66;
}

const rings = ({ month, day }: ActivityDay) =>
  month > TODAY.month || (month === TODAY.month && day > TODAY.day) ? null : [0, 1, 2].map((r) => ringPct(month, day, r));

const Frame = ({ children, width = 360 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

function Selectable({ testID, width }: { testID?: string; width?: number }) {
  const [selected, setSelected] = useState<ActivityDay | null>({ month: 6, day: 8 });
  return (
    <MostActiveDaysCard
      testID={testID}
      style={width ? { width } : undefined}
      year={2026}
      initialMonth={6}
      headline={32459}
      rings={rings}
      selectedDay={selected}
      onSelectDay={setSelected}
    />
  );
}

/** Glides to July on mount; scroll, or page months with the chevrons. Days after Jul 10 have no data yet. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Selectable testID="days" />
    </Frame>
  ),
};

/** Starting in January with nothing selected, custom ring colours. */
export const January: Story = {
  args: { year: 2026, headline: 32459 },
  parameters: { controls: { include: ["year","headline","initialMonth","title","suffix"] } },
  render: (args) => (
    <Frame>
      <MostActiveDaysCard {...args}
        testID="days"


        rings={rings}
        ringColors={['#f97316', '#8b5cf6', '#14b8a6']}
      />
    </Frame>
  ),
};

/** The widest dashboard column. */
export const Wide: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={440}>
      <Selectable />
    </Frame>
  ),
};
