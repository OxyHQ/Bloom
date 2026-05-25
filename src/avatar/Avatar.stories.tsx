import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    size: {
      control: { type: 'number', min: 16, max: 256, step: 4 },
    },
    shape: {
      control: 'select',
      options: ['circle', 'squircle'],
    },
    verified: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

const SAMPLE_URI =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

export const Basic: Story = {
  args: { size: 64, name: 'Nate Isern' },
};

export const FromUri: Story = {
  args: { size: 64, uri: SAMPLE_URI },
  name: 'From URI',
};

export const Initials: Story = {
  args: { size: 64, name: 'Ada Lovelace' },
};

export const Squircle: Story = {
  args: { size: 64, name: 'Ada Lovelace', shape: 'squircle' },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Avatar size={24} name="Ada" />
      <Avatar size={32} name="Ada" />
      <Avatar size={40} name="Ada" />
      <Avatar size={56} name="Ada" />
      <Avatar size={80} name="Ada" />
      <Avatar size={120} name="Ada" />
    </View>
  ),
};

export const Composition: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Avatar size={48} name="Ada Lovelace" />
      <Avatar size={48} name="Grace Hopper" />
      <Avatar size={48} name="Alan Turing" />
      <Avatar size={48} name="Linus Torvalds" />
      <Avatar size={48} name="Margaret Hamilton" />
    </View>
  ),
};
