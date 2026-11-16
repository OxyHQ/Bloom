import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppShell } from '../app-shell';
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
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AgentCreator>;
function ControlledCreator() {
  const [heartbeat, setHeartbeat] = useState(true);
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'designer',
    name: 'Landing page designer',
    label: 'Design',
    description: 'Clear layouts, thoughtful hierarchy, and a little personality.',
    avatar: CHARACTER_TEMPLATES.lime_frog!,
    color: 'green',
  });
  return (
    <AppShell
      header={null}
      scroll="fixed"
      contentMaxWidth="none"
      panelLayout={{
        flow: 'bounded',
        panels: [
          {
            id: 'creator',
            span: 1,
            content: (
              <AgentCreator
                agent={agent}
                onChange={setAgent}
                sections={
                  <AgentCreatorSection title="Heartbeat">
                    <AgentCreatorField label="Check" divider={false}>
                      <Switch
                        accessibilityLabel="Check on its own"
                        checked={heartbeat}
                        onCheckedChange={setHeartbeat}
                      />
                    </AgentCreatorField>
                  </AgentCreatorSection>
                }
              />
            ),
          },
        ],
      }}
    />
  );
}
export const Basic: Story = { render: () => <ControlledCreator /> };
