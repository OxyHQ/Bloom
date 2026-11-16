import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Command } from './index';
import type { CommandItem } from './types';
import { Button } from '../button';
import { Text } from '../typography';
import { RiUserLine as PersonIcon } from '../icons/remix/RiUserLine';
import { RiSettings3Line as GearIcon } from '../icons/remix/RiSettings3Line';

const meta: Meta = {
  argTypes: {
    visible: { control: 'boolean' },
    placeholder: { control: 'text' },
    emptyText: { control: 'text' },
    query: { control: 'text' },
    maxListHeight: { control: 'number' },
  },
  component: Command,
  parameters: { controls: { disable: true } },
  id: 'base-command',
  title: 'Components/Overlays/Command',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const items: CommandItem[] = [
      {
        id: 'profile',
        label: 'Go to profile',
        icon: PersonIcon,
        group: 'Navigation',
        shortcut: 'G P',
        onSelect: () => setSelected('Profile'),
      },
      {
        id: 'settings',
        label: 'Open settings',
        icon: GearIcon,
        group: 'Navigation',
        onSelect: () => setSelected('Settings'),
      },
      {
        id: 'new-app',
        label: 'Create application',
        description: 'Register a new OAuth client',
        group: 'Actions',
        keywords: ['oauth', 'client'],
        onSelect: () => setSelected('New application'),
      },
      {
        id: 'signout',
        label: 'Sign out',
        group: 'Actions',
        onSelect: () => setSelected('Signed out'),
      },
    ];
    return (
      <View style={{ padding: 24, gap: 16 }}>
        <Button onPress={() => setOpen(true)}>Open command palette</Button>
        {selected ? <Text accessibilityRole="text">Selected: {selected}</Text> : null}
        <Command open={open} onOpenChange={() => setOpen(false)} items={items} />
      </View>
    );
  },
};
