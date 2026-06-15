import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Forms/Label',
  component: Label,
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Basic: Story = {
  args: { children: 'Email address' },
};

export const Required: Story = {
  args: { children: 'Email address', required: true },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Label size="xs">Extra small</Label>
      <Label size="sm">Small (default)</Label>
      <Label size="md">Medium</Label>
    </View>
  ),
};
