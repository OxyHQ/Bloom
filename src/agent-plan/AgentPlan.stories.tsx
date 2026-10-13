import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AgentPlan } from './index';
import type { AgentPlanDecision } from './types';

const STEPS = [
  'Read the project files',
  'Update and install the light mode tokens',
  'Implement the dark mode tokens',
  'Run the registry, lint and production build',
];

const meta: Meta<typeof AgentPlan> = {
  title: 'Blocks/Agent Plan',
  component: AgentPlan,
  args: { steps: STEPS, decision: 'pending', disabled: false, loading: false },
  argTypes: {
    decision: { control: 'inline-radio', options: ['pending', 'approved', 'rejected'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AgentPlan>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 40, maxWidth: 420 }}>{children}</View>
);

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <AgentPlan {...args} />
    </Frame>
  ),
};

/** The caller owns the decision: a send that takes a second, then the outcome. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [decision, setDecision] = useState<AgentPlanDecision>('pending');
    const [sending, setSending] = useState(false);
    const send = (next: AgentPlanDecision) => {
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setDecision(next);
      }, 1000);
    };
    return (
      <Frame>
        <AgentPlan
          steps={STEPS}
          decision={decision}
          loading={sending}
          onApprove={() => send('approved')}
          onReject={() => send('rejected')}
        />
      </Frame>
    );
  },
};

export const Decided: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <AgentPlan steps={STEPS} decision="approved" />
      <View style={{ height: 16 }} />
      <AgentPlan steps={STEPS} decision="rejected" />
    </Frame>
  ),
};
