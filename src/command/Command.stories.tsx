import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Command } from './index';
import type { CommandItem } from './types';
import { Button } from '../button';
import { Person_Stroke2_Corner0_Rounded as PersonIcon } from '../icons/Person';
import { SettingsGear2_Stroke2_Corner0_Rounded as GearIcon } from '../icons/SettingsGear2';

const meta: Meta = {
  title: 'Overlays/Command',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const items: CommandItem[] = [
      {
        id: 'profile',
        label: 'Go to profile',
        icon: PersonIcon,
        group: 'Navigation',
        shortcut: 'G P',
        onSelect: () => {},
      },
      {
        id: 'settings',
        label: 'Open settings',
        icon: GearIcon,
        group: 'Navigation',
        onSelect: () => {},
      },
      {
        id: 'new-app',
        label: 'Create application',
        description: 'Register a new OAuth client',
        group: 'Actions',
        keywords: ['oauth', 'client'],
        onSelect: () => {},
      },
      {
        id: 'signout',
        label: 'Sign out',
        group: 'Actions',
        onSelect: () => {},
      },
    ];
    return (
      <View style={{ padding: 40 }}>
        <Button onPress={() => setOpen(true)}>Open command palette (⌘K)</Button>
        <Command visible={open} onClose={() => setOpen(false)} items={items} />
      </View>
    );
  },
};
