import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { AgentProgress, AgentProgressLoadingText } from './index';

const meta: Meta<typeof AgentProgress> = {
  title: 'Blocks/Agent Progress',
  component: AgentProgress,
};

export default meta;

type Story = StoryObj<typeof AgentProgress>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 40, gap: 24, alignItems: 'flex-start' }}>{children}</View>
);

/** The coding workflow demo, 3s per step, restarting when it finishes. */
export const Default: Story = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <Frame>
        <AgentProgress key={run} onFinished={() => setRun((r) => r + 1)} />
      </Frame>
    );
  },
};

/** Faster clock, for watching every transition. */
export const Fast: Story = {
  render: () => (
    <Frame>
      <AgentProgress stepDuration={1500} />
    </Frame>
  ),
};

/** Starts minimized: the 44px bar with the current step. Hover to reveal the expand glyph. */
export const Minimized: Story = {
  render: () => (
    <Frame>
      <AgentProgress defaultMinimized stepDuration={4000} />
    </Frame>
  ),
};

/** Controlled progress, as a real agent would drive it. */
export const Controlled: Story = {
  render: function Render() {
    const steps = ['Plan the change', 'Edit the files', 'Run the tests'];
    const [done, setDone] = useState(1);
    return (
      <Frame>
        <AgentProgress steps={steps} completedCount={done} stepDuration={5000} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button variant="secondary" size="small" onPress={() => setDone((d) => Math.max(0, d - 1))}>
            Back
          </Button>
          <Button variant="secondary" size="small" onPress={() => setDone((d) => Math.min(steps.length, d + 1))}>
            Complete step
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Static states, frozen (paused before the clock starts). */
export const States: Story = {
  render: () => (
    <Frame>
      <AgentProgress paused completedCount={2} testID="progress-mid" />
      <AgentProgress paused completedCount={5} testID="progress-done" />
      <AgentProgress paused defaultMinimized completedCount={3} testID="progress-min" />
      <AgentProgress
        paused
        completedCount={0}
        steps={['A single short step']}
        labels={{ stepsLeft: (n) => `${n} left`, allCompleted: 'Done' }}
      />
    </Frame>
  ),
};

/** The shimmering label on its own ("Generating image"). */
export const LoadingText: Story = {
  render: () => (
    <Frame>
      <AgentProgressLoadingText testID="shimmer">Generating image</AgentProgressLoadingText>
      <AgentProgressLoadingText variant="title-3-medium">Thinking about your request</AgentProgressLoadingText>
    </Frame>
  ),
};
