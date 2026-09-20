import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DotGridMeter } from './index';
import { BloomThemeProvider } from '../theme';
import { Text } from '../typography';

function Demo() {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ fontSize: 12, opacity: 0.6 }}>Token diversity</Text>
      <DotGridMeter filled={34} total={50} columns={10} accessibilityLabel="Invites used" />
      <Text style={{ fontSize: 12, opacity: 0.6 }}>Compact (accent)</Text>
      <DotGridMeter
        filled={7}
        total={12}
        columns={6}
        dotSize={12}
        gap={8}
        filledColor="#8B5CF6"
        accessibilityLabel="Onboarding steps"
      />
    </View>
  );
}

const meta: Meta<typeof DotGridMeter> = {
  argTypes: {
    "filled": { control: 'number' },
    "total": { control: 'number' },
    "columns": { control: 'number' },
    "dotSize": { control: 'number' },
    "gap": { control: 'number' },
    "filledColor": { control: 'text' },
    "emptyColor": { control: 'text' }
  },
  title: 'Charts/Dot Grid Meter',
  component: DotGridMeter,
};

export default meta;

type Story = StoryObj<typeof DotGridMeter>;

export const Light: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24 }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

export const Dark: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, backgroundColor: '#000' }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { filled: 34, total: 50, columns: 10, dotSize: 8, gap: 4, accessibilityLabel: 'Invites used' },
};
