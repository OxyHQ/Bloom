import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Popover, PopoverTrigger, PopoverContent } from './index';
import { Button } from '../button';
import { Item } from '../item';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/Popover',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <Popover>
        <PopoverTrigger label="Open popover">
          {({ props }) => (
            <Button {...props} onPress={props.onPress}>
              Open popover
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent label="Account actions" placement="bottom-start">
          <View style={{ minWidth: 200 }}>
            <Item title="Edit profile" density="compact" onPress={() => {}} />
            <Item title="Settings" density="compact" onPress={() => {}} />
            <Item title="Sign out" density="compact" destructive onPress={() => {}} />
          </View>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

export const RichContent: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <Popover>
        <PopoverTrigger label="Details">
          {({ props }) => (
            <Button {...props} variant="secondary" onPress={props.onPress}>
              Details
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent label="Details" placement="bottom" maxWidth={280}>
          <View style={{ padding: 12, gap: 6 }}>
            <Text style={{ fontWeight: '600' }}>Storage</Text>
            <Text>4.2 GB of 10 GB used.</Text>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  ),
};
