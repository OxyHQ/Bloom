import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { ActivityRingsCard, type ActivityRing } from './ActivityRingsCard';

const meta: Meta<typeof ActivityRingsCard> = {
  argTypes: {
    "title": { control: 'text' },
    "height": { control: 'number' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Activity Rings',
  component: ActivityRingsCard,
};

export default meta;

type Story = StoryObj<typeof ActivityRingsCard>;

// Default rings shown with no day selected.
const RINGS: ActivityRing[] = [
  { label: 'Move', value: '1,592 kcal', goalPct: 82 },
  { label: 'Exercise', value: '1h 45m', goalPct: 60 },
  { label: 'Running', value: '5.2 km', goalPct: 75 },
];

// A picked day in the "Most active days" calendar swaps in that day's numbers.
const DAYS: { title: string; rings: ActivityRing[] }[] = [
  { title: 'Activity', rings: RINGS },
  {
    title: 'Activity for July 4, 2026',
    rings: [
      { label: 'Move', value: '1,187 kcal', goalPct: 46 },
      { label: 'Exercise', value: '1h 17m', goalPct: 44 },
      { label: 'Running', value: '5.9 km', goalPct: 89 },
    ],
  },
  {
    title: 'Activity for July 12, 2026',
    rings: [
      { label: 'Move', value: '1,904 kcal', goalPct: 94 },
      { label: 'Exercise', value: '32m', goalPct: 9 },
      { label: 'Running', value: '2.1 km', goalPct: 20 },
    ],
  },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** Three goal rings under their stat tiles; hover a ring to focus it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <ActivityRingsCard testID="activity" rings={RINGS} />
    </Frame>
  ),
};

/** Exercise hovered (controlled): the ring darkens, the others and their tiles dim. */
export const Hovered: Story = {
  args: { activeIndex: 1 },
  parameters: { controls: { include: ["activeIndex","title","height"] } },
  render: (args) => (
    <Frame>
      <ActivityRingsCard {...args} rings={RINGS}  />
    </Frame>
  ),
};

function DayPicker() {
  const [day, setDay] = useState(0);
  const current = DAYS[day]!;
  return (
    <View style={{ gap: 12 }}>
      <ActivityRingsCard testID="activity" title={current.title} rings={current.rings} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DAYS.map((d, i) => (
          <Button key={d.title} size="sm" appearance={i === day ? 'solid' : 'outline'} tone={i === day ? 'accent' : 'neutral'} onPress={() => setDay(i)}>
            {i === 0 ? 'No day' : d.title.replace('Activity for ', '')}
          </Button>
        ))}
      </View>
    </View>
  );
}

/** Picking a day sweeps the rings to that day's goals over 200ms. */
export const SelectedDay: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DayPicker />
    </Frame>
  ),
};

/** A narrow column: the rings keep their 200 viewBox and scale to fit. */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={300}>
      <ActivityRingsCard rings={RINGS} />
    </Frame>
  ),
};
