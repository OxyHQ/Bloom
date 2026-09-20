import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AgentLimitsCard } from './index';
import type { AgentLimitsContext, AgentLimitsUsageLimit } from './types';

const meta: Meta<typeof AgentLimitsCard> = {
  argTypes: {
    "plan": { control: 'text' },
    "expanded": { control: 'boolean' },
    "defaultExpanded": { control: 'boolean' }
  },
  title: 'Blocks/Agent Limits',
  component: AgentLimitsCard,
};

export default meta;

type Story = StoryObj<typeof AgentLimitsCard>;

/** Demo data: 820k of 1M used, messages dominating, 18% free. */
const CONTEXT: AgentLimitsContext = {
  max: 1_000_000,
  segments: [
    { label: 'Messages', tokens: 520_000 },
    { label: 'System tools', tokens: 96_000 },
    { label: 'MCP tools', tokens: 68_000 },
    { label: 'Skills', tokens: 54_000 },
    { label: 'System prompt', tokens: 42_000 },
    { label: 'Memory files', tokens: 24_000 },
    { label: 'Custom agents', tokens: 16_000 },
    { label: 'MCP tools (deferred)', tokens: 69_900, deferred: true },
    { label: 'System tools (deferred)', tokens: 16_100, deferred: true },
  ],
  groups: [
    {
      label: 'MCP tools',
      tokens: 137_900,
      items: [
        { label: 'browser', tokens: 54_200 },
        { label: 'figma', tokens: 41_800 },
        { label: 'vercel', tokens: 26_500 },
        { label: 'session', tokens: 15_400 },
      ],
    },
    {
      label: 'Memory files',
      tokens: 24_000,
      items: [
        { label: 'MEMORY.md', tokens: 16_400 },
        { label: 'project-conventions.md', tokens: 7_600 },
      ],
    },
    {
      label: 'Custom agents',
      tokens: 16_000,
      items: [
        { label: 'reviewer', tokens: 7_100 },
        { label: 'explorer', tokens: 5_200 },
        { label: 'planner', tokens: 3_700 },
      ],
    },
  ],
};

const LIMITS: AgentLimitsUsageLimit[] = [
  { label: '5-hour limit', used: 0.38, resets: 'Resets in 2 hr 46 min' },
  { label: 'Weekly · all models', used: 0.03, resets: 'Resets Tue 3:00 PM' },
  { label: 'Weekly · Pro', used: 0.05, resets: 'Resets Tue 3:00 PM' },
];

/** Press "Context window" to grow the breakdown; press a group to list its members. */
export const Basic: Story = {
  args: { plan: "Max (5x)" },
  parameters: { controls: { include: ["plan","expanded","defaultExpanded"] } },
  render: (args) => (
    <View style={{ maxWidth: '100%', width: 360 }}>
      <AgentLimitsCard {...args} context={CONTEXT}  limits={LIMITS} />
    </View>
  ),
};

/** Collapsed and expanded side by side, with the plan arrow. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <View style={{ maxWidth: '100%', width: 360 }}>
        <AgentLimitsCard context={CONTEXT} plan="Max (5x)" limits={LIMITS} testID="collapsed" />
      </View>
      <View style={{ maxWidth: '100%', width: 360 }}>
        <AgentLimitsCard
          context={CONTEXT}
          plan="Max (5x)"
          limits={LIMITS}
          defaultExpanded
          testID="expanded"
          onPlanPress={() => {}}
        />
      </View>
    </View>
  ),
};

/** Either section on its own. */
export const Sections: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', gap: 24, width: 360 }}>
      <AgentLimitsCard context={CONTEXT} />
      <AgentLimitsCard plan="Pro" limits={LIMITS.slice(0, 2)} onPlanPress={() => {}} />
    </View>
  ),
};
