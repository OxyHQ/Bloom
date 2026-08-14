import React from 'react';
import { View, ImageBackground } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FrostedIconButton } from './FrostedIconButton';
import * as Icons from '../icons';

const meta: Meta<typeof FrostedIconButton> = {
  title: 'Actions/FrostedIconButton',
  component: FrostedIconButton,
  args: {
    accessibilityLabel: 'Back',
    icon: <Icons.ChevronLeft_Stroke2_Corner0_Rounded size="md" />,
    onPress: () => {},
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    active: { control: 'boolean' },
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
      <FrostedIconButton {...args} active />
    </View>
  ),
};

/** Frosting over an image (the reason it exists) — blur shows the banner behind. */
export const OverImage: Story = {
  render: (args) => (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/600/300' }}
      style={{ width: 320, height: 180, padding: 16, justifyContent: 'flex-start' }}
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
