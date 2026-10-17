import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FOLD_CONFIG } from '../agent-avatar';
import { AgentCreator } from './AgentCreator.web';
import type { AgentCreatorAgent } from './types';

const meta: Meta<typeof AgentCreator> = { title: 'Application/Agent Creator', component: AgentCreator };
export default meta;
type Story = StoryObj<typeof AgentCreator>;
function ControlledCreator() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({ id: 'designer', name: 'Landing page designer', label: 'Design', description: 'Clear layouts, thoughtful hierarchy, and a little personality.', avatar: { ...FOLD_CONFIG, hue: 157, saturation: 37, eyes: 'curious' } });
  return <View style={{ width: 360, height: 800 }}><AgentCreator agent={agent} onChange={setAgent} /></View>;
}
export const Basic: Story = { render: () => <ControlledCreator /> };
