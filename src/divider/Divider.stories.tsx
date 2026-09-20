import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Divider> = {
  argTypes: {
    "variant": { control: 'select', options: ["single","fill","double"] },
    "align": { control: 'select', options: ["end","start","center"] },
    "color": { control: 'text' },
    "thickness": { control: 'number' },
    "vertical": { control: 'boolean' },
    "spacing": { control: 'number' }
  },
  title: 'Base/Divider',
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
  args: { spacing: 12 },
  parameters: { controls: { include: ["spacing","variant","align","color","thickness","vertical"] } },
  render: (args) => (
    <View style={{ maxWidth: '100%', width: 360 }}>
      <Text>Above</Text>
      <Divider {...args}  />
      <Text>Below</Text>
    </View>
  ),
};

/**
 * The three treatments, empty and with content in every alignment.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 620, gap: 16 }}>
      <Divider />
      <Divider variant="double" />
      <Divider variant="fill" />
      <Divider>Today</Divider>
      <Divider align="start">Start</Divider>
      <Divider align="end">End</Divider>
      <Divider variant="double">Double</Divider>
      <Divider variant="double" align="start">Double start</Divider>
      <Divider variant="fill" align="start">Fill</Divider>
      <Divider variant="fill" align="end">Fill end</Divider>
    </View>
  ),
};

/**
 * `vertical` swaps the axis. A vertical divider needs a parent with a height —
 * it fills the cross axis, it does not invent one.
 */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 360, gap: 4 }}>
      <Divider />
      <Divider thickness={2} />
      <Divider thickness={4} color="tomato" />
      <Divider style={{ marginLeft: 40, width: 'auto', opacity: 0.3 }} />
    </View>
  ),
};
