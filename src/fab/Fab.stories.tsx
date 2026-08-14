import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Fab } from './Fab';
import * as Icons from '../icons';

const meta: Meta<typeof Fab> = {
  title: 'Actions/Fab',
  component: Fab,
  args: {
    accessibilityLabel: 'Compose',
    icon: <Icons.PlusLarge_Stroke2_Corner0_Rounded size="lg" fill="#fff" />,
    onPress: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'surface'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    placement: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'static'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Fab>;

/** Default circular icon FAB, anchored to the bottom-right of its container. */
export const Default: Story = {};

/** Lower-emphasis surface FAB. */
export const Surface: Story = {
  args: { variant: 'surface' },
};

/** Extended FAB: icon + label pill. */
export const Extended: Story = {
  args: { label: 'Compose' },
};

/**
 * A raw pixel diameter via `size={number}` — here 48px, halfway between the
 * `small` (40) and `medium` (56) presets. The icon box and font scale with the
 * diameter automatically.
 */
export const NumericSize: Story = {
  args: { size: 48 },
};

/**
 * The FAB anchored to the bottom-right of a CONSTRAINED column. On web the FAB
 * uses `position: sticky`, so it tracks the bottom of THIS column (not the
 * viewport) — exactly what a multi-column app layout needs.
 */
export const InContainerColumn: Story = {
  render: (args) => (
    <View
      style={{
        position: 'relative',
        width: 360,
        height: 480,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <Fab {...args} />
    </View>
  ),
};
