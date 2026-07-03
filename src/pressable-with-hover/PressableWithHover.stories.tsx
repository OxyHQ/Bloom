import React from 'react';
import { Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PressableWithHover } from './index';

const meta: Meta<typeof PressableWithHover> = {
  title: 'Components/PressableWithHover',
  component: PressableWithHover,
};

export default meta;

type Story = StoryObj<typeof PressableWithHover>;

export const Basic: Story = {
  render: () => (
    <PressableWithHover
      accessibilityLabel="Hover me"
      style={{
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
      }}
      hoverStyle={{ backgroundColor: '#e5e7eb' }}
    >
      <Text style={{ fontWeight: '600' }}>Hover me (web)</Text>
    </PressableWithHover>
  ),
};

export const ListRow: Story = {
  render: () => (
    <PressableWithHover
      accessibilityLabel="Settings row"
      style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, width: 260 }}
      hoverStyle={{ backgroundColor: '#f3f4f6' }}
    >
      <Text>Account settings</Text>
    </PressableWithHover>
  ),
};
