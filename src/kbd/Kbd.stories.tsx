import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Data Display/Kbd',
  component: Kbd,
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Single: Story = {
  args: { children: 'K' },
};

export const Combo: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Kbd size="sm">Esc</Kbd>
      <Kbd size="md">Enter</Kbd>
    </View>
  ),
};
