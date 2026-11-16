import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Surface } from '../surface';
import { ThemeToggle } from './index';

const meta: Meta<typeof ThemeToggle> = {
  id: 'blocks-theme-toggle',
  title: 'Components/Actions/Theme Toggle',
  component: ThemeToggle,
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

/** Every variant, on the sidebar surface. */
export const Appearances: Story = {
  parameters: { controls: { disable: true } },
  render: function AppearancesStory() {
    return (
      <View style={{ padding: 16, gap: 24 }}>
        <Surface style={{ padding: 12, gap: 12, width: 260, maxWidth: '100%' }}>
          <ThemeToggle testID="sidebar" />
        </Surface>
        <Surface style={{ padding: 12, alignSelf: 'flex-start' }}>
          <ThemeToggle collapsed testID="collapsed" />
        </Surface>
        <Surface style={{ padding: 12, gap: 12, width: 260, maxWidth: '100%' }}>
          <ThemeToggle variant="sidebar-segmented" testID="sidebar-segmented" />
        </Surface>
        <View style={{ padding: 12 }}>
          <ThemeToggle variant="segmented" testID="segmented" />
        </View>
        <Surface radius={999} style={{ padding: 12, alignSelf: 'flex-start' }}>
          <ThemeToggle variant="bare-segmented" testID="bare" />
        </Surface>
      </View>
    );
  },
};

export const Sidebar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 16 }}>
      <Surface style={{ padding: 12, gap: 12, width: 260, maxWidth: '100%' }}>
        <ThemeToggle />
      </Surface>
    </View>
  ),
};

export const Segmented: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 16 }}>
      <ThemeToggle variant="segmented" />
    </View>
  ),
};

export const Playground: Story = {
  args: { variant: 'sidebar', collapsed: false, transitionDuration: 820 },
  parameters: {
    controls: { disable: false, include: ['variant', 'collapsed', 'transitionDuration'] },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['sidebar', 'segmented', 'sidebar-segmented', 'bare-segmented'],
    },
    collapsed: { control: 'boolean' },
    transitionDuration: { control: { type: 'range', min: 0, max: 1600, step: 20 } },
  },
  render: (args) => (
    <Surface style={{ padding: 12, gap: 12, width: 260, maxWidth: '100%' }}>
      <ThemeToggle {...args} />
    </Surface>
  ),
};
