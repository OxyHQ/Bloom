import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Item } from './Item';
import { Badge } from '../badge';
import { Person_Stroke2_Corner0_Rounded as PersonIcon } from '../icons/Person';

const meta: Meta<typeof Item> = {
  title: 'Navigation/Item',
  component: Item,
};

export default meta;

type Story = StoryObj<typeof Item>;

export const Basic: Story = {
  args: { title: 'Profile', subtitle: 'Manage your account details' },
};

export const Pressable: Story = {
  render: () => (
    <View style={{ width: 360 }}>
      <Item
        title="Account"
        subtitle="Email, password, sessions"
        leading={<PersonIcon size="md" />}
        trailing={<Badge content={3} color="primary" />}
        onPress={() => {}}
      />
    </View>
  ),
};

export const Density: Story = {
  render: () => (
    <View style={{ width: 360, gap: 4 }}>
      <Item title="Comfortable" subtitle="default density" />
      <Item title="Compact" density="compact" />
    </View>
  ),
};
