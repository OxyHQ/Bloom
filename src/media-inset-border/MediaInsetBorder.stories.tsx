import React from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaInsetBorder } from './index';

const meta: Meta<typeof MediaInsetBorder> = {
  title: 'Components/MediaInsetBorder',
  component: MediaInsetBorder,
  argTypes: {
    opaque: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof MediaInsetBorder>;

const SAMPLE_URI =
  'https://images.unsplash.com/photo-1526779259212-939e64788e3c?w=400&q=80';

export const OverImage: Story = {
  render: (args) => (
    <View style={{ width: 240, height: 160, borderRadius: 8, overflow: 'hidden' }}>
      <Image source={{ uri: SAMPLE_URI }} style={{ width: '100%', height: '100%' }} />
      <MediaInsetBorder {...args} />
    </View>
  ),
};

export const OverFlatSurface: Story = {
  render: (args) => (
    <View
      style={{
        width: 240,
        height: 160,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
      }}
    >
      <MediaInsetBorder {...args} />
    </View>
  ),
};

export const Opaque: Story = {
  args: { opaque: true },
  render: (args) => (
    <View
      style={{
        width: 240,
        height: 160,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
      }}
    >
      <MediaInsetBorder {...args} />
    </View>
  ),
};
