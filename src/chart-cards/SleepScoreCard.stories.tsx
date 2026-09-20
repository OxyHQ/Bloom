import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SleepScoreCard, type SleepMetric } from './SleepScoreCard';

const meta: Meta<typeof SleepScoreCard> = {
  argTypes: {
    "title": { control: 'text' },
    "range": { control: 'text' },
    "height": { control: 'number' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Sleep Score',
  component: SleepScoreCard,
};

export default meta;

type Story = StoryObj<typeof SleepScoreCard>;

// Demo metrics: 49 + 29 + 20 = 98.
const METRICS: SleepMetric[] = [
  { label: 'Duration', detail: '7h 50m', score: 49, max: 50 },
  { label: 'Bedtime', detail: '20m earlier', score: 29, max: 30 },
  { label: 'Interruptions', detail: '5m wake up', score: 20, max: 20 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** The verdict, the segmented score ring and its sub-scores; hover an arc for its score. */
export const Default: Story = {
  args: { range: "29 Jun - 5 Jul" },
  parameters: { controls: { include: ["range","title","height","activeIndex"] } },
  render: (args) => (
    <Frame>
      <SleepScoreCard {...args} testID="sleep" metrics={METRICS}  />
    </Frame>
  ),
};

/** Bedtime hovered (controlled): the centre shows 29, the other arcs drop to 70%. */
export const Hovered: Story = {
  args: { range: "29 Jun - 5 Jul", activeIndex: 1 },
  parameters: { controls: { include: ["range","activeIndex","title","height"] } },
  render: (args) => (
    <Frame>
      <SleepScoreCard {...args} metrics={METRICS}   />
    </Frame>
  ),
};

/** A rough night: more exposed track, a lower verdict, no pill. */
export const LowScore: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <SleepScoreCard
        metrics={[
          { label: 'Duration', detail: '5h 10m', score: 28, max: 50 },
          { label: 'Bedtime', detail: '1h 5m later', score: 14, max: 30 },
          { label: 'Interruptions', detail: '42m awake', score: 9, max: 20 },
        ]}
      />
    </Frame>
  ),
};
