import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { AgentProgress, AgentProgressLoadingText, AgentProgressPlan } from './index';
import type { AgentProgressPlanDecision } from './types';

const meta: Meta<typeof AgentProgress> = {
  argTypes: {
    stepDuration: { control: 'number' },
    completionDelay: { control: 'number' },
    paused: { control: 'boolean' },
    completedCount: { control: 'number' },
    minimized: { control: 'boolean' },
    defaultMinimized: { control: 'boolean' },
  },
  title: 'Agents/Agent Progress',
  component: AgentProgress,
};

export default meta;

type Story = StoryObj<typeof AgentProgress>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 40, gap: 24, alignItems: 'flex-start' }}>{children}</View>
);

/** The coding workflow demo, 3s per step, restarting when it finishes. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
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
  args: { stepDuration: 1500 },
  parameters: {
    controls: {
      include: [
        'stepDuration',
        'completionDelay',
        'paused',
        'completedCount',
        'minimized',
        'defaultMinimized',
      ],
    },
  },
  render: (args) => (
    <Frame>
      <AgentProgress {...args} />
    </Frame>
  ),
};

/** Starts minimized: the 44px bar with the current step. Hover to reveal the expand glyph. */
export const Minimized: Story = {
  args: { defaultMinimized: true, stepDuration: 4000 },
  parameters: {
    controls: {
      include: [
        'defaultMinimized',
        'stepDuration',
        'completionDelay',
        'paused',
        'completedCount',
        'minimized',
      ],
    },
  },
  render: (args) => (
    <Frame>
      <AgentProgress {...args} />
    </Frame>
  ),
};

/** Controlled progress, as a real agent would drive it. */
export const Controlled: Story = {
  args: { stepDuration: 5000 },
  parameters: {
    controls: {
      include: ['stepDuration', 'completionDelay', 'paused', 'minimized', 'defaultMinimized'],
    },
  },
  render: function Render(args) {
    const steps = ['Plan the change', 'Edit the files', 'Run the tests'];
    const [done, setDone] = useState(1);
    return (
      <Frame>
        <AgentProgress {...args} steps={steps} completedCount={done} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            size="sm"
            onPress={() => setDone((d) => Math.max(0, d - 1))}
            appearance="outline"
            tone="neutral"
          >
            Back
          </Button>
          <Button
            size="sm"
            onPress={() => setDone((d) => Math.min(steps.length, d + 1))}
            appearance="outline"
            tone="neutral"
          >
            Complete step
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Static states, frozen (paused before the clock starts). */
export const States: Story = {
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <AgentProgressLoadingText testID="shimmer">Generating image</AgentProgressLoadingText>
      <AgentProgressLoadingText variant="title-3-medium">
        Thinking about your request
      </AgentProgressLoadingText>
    </Frame>
  ),
};

const PLAN_STEPS = [
  'Read the project files',
  'Update and install the light mode tokens',
  'Implement the dark mode tokens',
  'Run the registry, lint and production build',
];

/** A proposed plan on the progress card: Approve and Reject; the caller owns the decision. */
export const Plan: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [decision, setDecision] = useState<AgentProgressPlanDecision>('pending');
    const [sending, setSending] = useState(false);
    const send = (next: AgentProgressPlanDecision) => {
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setDecision(next);
      }, 1000);
    };
    return (
      <View style={{ padding: 24 }}>
        <AgentProgressPlan
          steps={PLAN_STEPS}
          decision={decision}
          loading={sending}
          onApprove={() => send('approved')}
          onReject={() => send('rejected')}
        />
      </View>
    );
  },
};

/** Once decided the buttons give way to a status badge; a rejected plan strikes its steps through. */
export const PlanDecided: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 24, gap: 16 }}>
      <AgentProgressPlan steps={PLAN_STEPS} decision="approved" />
      <AgentProgressPlan steps={PLAN_STEPS} decision="rejected" />
    </View>
  ),
};
