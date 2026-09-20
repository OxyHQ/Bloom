import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Item } from './Item';
import { Badge } from '../badge';
import { RiUserLine as PersonIcon } from '../icons/remix/RiUserLine';

const meta: Meta<typeof Item> = {
  argTypes: {
    "disabled": { control: 'boolean' },
    "destructive": { control: 'boolean' },
    "selected": { control: 'boolean' },
    "active": { control: 'boolean' },
    "density": { control: 'select', options: ["comfortable","compact"] },
    "role": { control: 'select', options: ["checkbox","menuitem","radio","option","listitem"] },
    "expanded": { control: 'boolean' }
  },
  title: 'Base/Item',
  component: Item,
};

export default meta;

type Story = StoryObj<typeof Item>;

export const Basic: Story = {
  args: { title: 'Profile', subtitle: 'Manage your account details' },
};

export const Pressable: Story = {
  args: { title: "Account", subtitle: "Email, password, sessions" },
  parameters: { controls: { include: ["title","subtitle","disabled","destructive","selected","active","density","role","expanded"] } },
  render: (args) => (
    <View style={{ maxWidth: '100%', width: 360 }}>
      <Item {...args}


        leading={<PersonIcon size="md" />}
        trailing={<Badge content={3} tone="accent" />}
        onPress={() => {}}
      />
    </View>
  ),
};

export const Density: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 360, gap: 4 }}>
      <Item title="Comfortable" subtitle="default density" />
      <Item title="Compact" density="compact" />
    </View>
  ),
};
