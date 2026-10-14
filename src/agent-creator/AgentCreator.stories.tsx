import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { CHARACTER_TEMPLATES } from './constants';
import { AgentCreator } from './AgentCreator.web';
import type { AgentCreatorAgent } from './types';

const meta: Meta<typeof AgentCreator> = {
  title: 'Agents/Agent Creator',
  component: AgentCreator,
};
export default meta;
type Story = StoryObj<typeof AgentCreator>;
function ControlledCreator() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'designer',
    name: 'Landing page designer',
    label: 'Design',
    description: 'Clear layouts, thoughtful hierarchy, and a little personality.',
    avatar: CHARACTER_TEMPLATES.lime_frog!,
  });
  return (
    <View style={{ width: 360, height: 800 }}>
      <AgentCreator agent={agent} onChange={setAgent} />
    </View>
  );
}
export const Basic: Story = { render: () => <ControlledCreator /> };

import { INITIAL_WORKSPACE } from '../multi-agent-chat/data';
function SourceComparisonCreator() {
  const [agent, setAgent] = useState<AgentCreatorAgent>(INITIAL_WORKSPACE.agents[0]!);
  return (
    <View style={{ width: 360, height: 900, padding: 12 }}>
      <AgentCreator agent={agent} onChange={setAgent} onClose={() => {}} />
    </View>
  );
}
export const SourceComparison: Story = {
  render: () => <SourceComparisonCreator />,
};
