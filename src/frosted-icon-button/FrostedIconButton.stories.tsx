import React from 'react';
import { View, ImageBackground } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FrostedIconButton } from './FrostedIconButton';
import * as Icons from '../icons';

const meta: Meta<typeof FrostedIconButton> = {
  title: 'Base/Frosted Icon Button',
  component: FrostedIconButton,
  args: {
    accessibilityLabel: 'Back',
    icon: Icons.RiArrowLeftSLine,
    onPress: () => {},
  },
  argTypes: {
    "tone": { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    "title": { control: 'text' },
    "type": { control: 'select', options: ["button","submit","reset"] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof FrostedIconButton>;

/** The frosted chip on a SOLID dark background — must read as a distinct button. */
export const OnSolidDark: Story = {
  render: (args) => (
    <View style={{ padding: 40, backgroundColor: 'rgb(11, 11, 15)' }}>
      <FrostedIconButton {...args} />
    </View>
  ),
};

/** The solid "on" state for toggles (no blur, brand fill). */
export const Active: Story = {
  render: (args) => (
    <View style={{ padding: 40, backgroundColor: 'rgb(11, 11, 15)' }}>
      <FrostedIconButton {...args} checked />
    </View>
  ),
};

/** Frosting over an image (the reason it exists) — blur shows the banner behind. */
export const OverImage: Story = {
  render: (args) => (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/600/300' }}
      style={{ maxWidth: '100%', width: 320, height: 180, padding: 16, justifyContent: 'flex-start' }}
    >
      <FrostedIconButton {...args} />
    </ImageBackground>
  ),
};

/** Both sizes side by side. */
export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 12, padding: 40, backgroundColor: 'rgb(11, 11, 15)' }}>
      <FrostedIconButton {...args} size="sm" />
      <FrostedIconButton {...args} size="md" />
    </View>
  ),
};
