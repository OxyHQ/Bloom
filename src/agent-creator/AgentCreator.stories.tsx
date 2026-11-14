import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { CHARACTER_TEMPLATES } from './constants';
import { AgentCreator } from './AgentCreator.web';
import { AgentCreatorField } from './AgentCreatorField';
import { AgentCreatorSection } from './AgentCreatorSection';
import { Switch } from '../switch';
import type { AgentCreatorAgent } from './types';

const meta: Meta<typeof AgentCreator> = {
  id: 'agents-agent-creator',
  title: 'Patterns/Agents/Agent Creator',
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
    color: 'green',
  });
  return (
    <View style={{ width: 360, height: 800 }}>
      <AgentCreator
        agent={agent}
        onChange={setAgent}
        sections={
          <AgentCreatorSection title="Heartbeat">
            <AgentCreatorField label="Check" divider={false}>
              <Switch
                accessibilityLabel="Check on its own"
                checked
                onCheckedChange={() => undefined}
              />
            </AgentCreatorField>
          </AgentCreatorSection>
        }
      />
    </View>
  );
}
export const Basic: Story = { render: () => <ControlledCreator /> };
