import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
};

export default meta;

type Story = StoryObj<typeof Divider>;

/**
 * The default is a hairline in the `border` role, full width. Nothing else in
 * the library should draw a 1px separator by hand — three families used to, and
 * each had a slightly different colour.
 */
export const Horizontal: Story = {
  render: () => (
    <View style={{ width: 360 }}>
      <Text>Above</Text>
      <Divider spacing={12} />
      <Text>Below</Text>
    </View>
  ),
};

/**
 * `vertical` swaps the axis. A vertical divider needs a parent with a height —
 * it fills the cross axis, it does not invent one.
 */
export const Vertical: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
      <Text>Drafts</Text>
      <Divider vertical spacing={12} />
      <Text>Sent</Text>
      <Divider vertical spacing={12} />
      <Text>Archive</Text>
    </View>
  ),
};

/**
 * `thickness` and `color` are escape hatches for a specific surface (a settings
 * group inset rule, a toolbar). Reach for `spacing` first: most "the divider
 * looks wrong" cases are margin, not weight.
 */
export const ThicknessAndColor: Story = {
  render: () => (
    <View style={{ width: 360, gap: 4 }}>
      <Divider />
      <Divider thickness={2} />
      <Divider thickness={4} color="tomato" />
      <Divider style={{ marginLeft: 40, width: 'auto', opacity: 0.3 }} />
    </View>
  ),
};
