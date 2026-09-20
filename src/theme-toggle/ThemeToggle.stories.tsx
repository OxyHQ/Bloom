import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { ThemeToggle } from './index';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Blocks/Theme Toggle',
  component: ThemeToggle,
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

/** Storybook's own theme global drives the provider, so the toggle's `setMode`
 *  reports the choice; flip the toolbar theme to see both modes. */
function Surface({ children, width = 260 }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        padding: 12,
        gap: 12,
        borderRadius: 24,
        backgroundColor: theme.colors.backgroundSecondary,
      }}
    >
      {children}
    </View>
  );
}

/** Every variant, on the sidebar surface. */
export const Appearances: Story = {
  parameters: { controls: { disable: true } },
  render: function AppearancesStory() {
    const { colors } = useTheme();
    return (
    <View style={{ padding: 40, gap: 24 }}>
      <Surface>
        <ThemeToggle testID="sidebar" />
      </Surface>
      <Surface width={60}>
        <ThemeToggle collapsed testID="collapsed" />
      </Surface>
      <Surface>
        <ThemeToggle variant="sidebar-segmented" testID="sidebar-segmented" />
      </Surface>
      <View style={{ padding: 12 }}>
        <ThemeToggle variant="segmented" testID="segmented" />
      </View>
      <View style={{ padding: 12, backgroundColor: colors.backgroundSecondary, borderRadius: 999, alignSelf: 'flex-start' }}>
        <ThemeToggle variant="glass-segmented" testID="glass" />
      </View>
    </View>
  );
  },
};

export const Sidebar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40 }}>
      <Surface>
        <ThemeToggle />
      </Surface>
    </View>
  ),
};

export const Segmented: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40 }}>
      <ThemeToggle variant="segmented" />
    </View>
  ),
};

export const Playground: Story = {
  args: { variant: 'sidebar', collapsed: false, transitionDuration: 820 },
  parameters: { controls: { disable: false, include: ['variant', 'collapsed', 'transitionDuration'] } },
  argTypes: { variant: { control: 'select', options: ['sidebar', 'segmented', 'sidebar-segmented', 'glass-segmented'] }, collapsed: { control: 'boolean' }, transitionDuration: { control: { type: 'range', min: 0, max: 1600, step: 20 } } },
  render: args => <Surface><ThemeToggle {...args} /></Surface>,
};
