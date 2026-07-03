import React from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PressableScale } from './index';

const meta: Meta<typeof PressableScale> = {
  title: 'Components/PressableScale',
  component: PressableScale,
  argTypes: {
    targetScale: { control: { type: 'number', min: 0.8, max: 1, step: 0.01 } },
  },
};

export default meta;

type Story = StoryObj<typeof PressableScale>;

export const Basic: Story = {
  render: (args) => (
    <PressableScale
      {...args}
      accessibilityLabel="Press me"
      contentContainerStyle={{
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#111827',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>Press me</Text>
    </PressableScale>
  ),
};

export const StrongScale: Story = {
  args: { targetScale: 0.9 },
  render: (args) => (
    <PressableScale
      {...args}
      accessibilityLabel="Press me harder"
      contentContainerStyle={{
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#4f46e5',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>Strong scale (0.9)</Text>
    </PressableScale>
  ),
};

export const Card: Story = {
  render: (args) => (
    <PressableScale {...args} accessibilityLabel="Open card">
      <View
        style={{
          width: 220,
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#f3f4f6',
          gap: 6,
        }}
      >
        <Text style={{ fontWeight: '700' }}>Tappable card</Text>
        <Text style={{ color: '#6b7280' }}>The whole card springs on press.</Text>
      </View>
    </PressableScale>
  ),
};
