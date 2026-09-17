import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { resolveButtonRamps } from '../button/shared';
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
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        width,
        padding: 12,
        gap: 12,
        borderRadius: 24,
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
      }}
    >
      {children}
    </View>
  );
}

/** Every appearance, on the sidebar surface. */
export const Appearances: Story = {
  render: () => (
    <View style={{ padding: 40, gap: 24 }}>
      <Surface>
        <ThemeToggle testID="sidebar" />
      </Surface>
      <Surface width={60}>
        <ThemeToggle collapsed testID="collapsed" />
      </Surface>
      <Surface>
        <ThemeToggle appearance="sidebar-segmented" testID="sidebar-segmented" />
      </Surface>
      <View style={{ padding: 12 }}>
        <ThemeToggle appearance="segmented" testID="segmented" />
      </View>
      <View style={{ padding: 12, backgroundColor: '#f2f2f2', borderRadius: 999, alignSelf: 'flex-start' }}>
        <ThemeToggle appearance="glass-segmented" testID="glass" />
      </View>
    </View>
  ),
};

export const Sidebar: Story = {
  render: () => (
    <View style={{ padding: 40 }}>
      <Surface>
        <ThemeToggle />
      </Surface>
    </View>
  ),
};

export const Segmented: Story = {
  render: () => (
    <View style={{ padding: 40 }}>
      <ThemeToggle appearance="segmented" />
    </View>
  ),
};
