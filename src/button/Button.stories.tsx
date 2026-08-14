import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  args: {
    children: 'Button',
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'inverse', 'icon', 'ghost', 'text'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: { children: 'Save' },
};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const TextOnly: Story = {
  args: { variant: 'text', children: 'Text button' },
  name: 'Text',
};

export const Inverse: Story = {
  args: { variant: 'inverse', children: 'Inverse' },
};

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="inverse">Inverse</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="text">Text</Button>
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </View>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Submitting' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const Composition: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </View>
  ),
};
