import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd } from './Kbd';
import { Text } from '../typography';

const meta: Meta<typeof Kbd> = {
  title: 'Base/Kbd',
  component: Kbd,
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Single: Story = {
  args: { children: 'K' },
};

export const Combo: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Kbd size="sm">Esc</Kbd>
      <Kbd size="md">Enter</Kbd>
    </View>
  ),
};

/** A quick-search hint: the shortcut beside a muted label. */
export const SearchHint: Story = {
  render: () => (
    <View testID="kbd-matrix" style={{ padding: 24, gap: 12, alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="body-regular">Search</Text>
        <Kbd>⌘K</Kbd>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Kbd>Ctrl</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Kbd size="sm">Esc</Kbd>
        <Kbd size="sm">⌘</Kbd>
      </View>
    </View>
  ),
};
