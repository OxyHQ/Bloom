import React from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AvatarGroup } from './AvatarGroup';
import type { AvatarGroupItem } from './types';

const ITEMS: AvatarGroupItem[] = [
  { id: '1', displayName: 'Ada Lovelace', username: 'ada' },
  { id: '2', displayName: 'Grace Hopper', username: 'grace' },
  { id: '3', displayName: 'Alan Turing', username: 'alan' },
  { id: '4', displayName: 'Linus Torvalds', username: 'linus' },
  { id: '5', displayName: 'Margaret Hamilton', username: 'margaret' },
  { id: '6', displayName: 'Katherine Johnson', username: 'katherine' },
  { id: '7', displayName: 'Dennis Ritchie', username: 'dennis' },
];

const WITH_PHOTOS: AvatarGroupItem[] = [
  {
    id: '1',
    displayName: 'Nate Isern',
    username: 'nate',
    uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    displayName: 'Jordan Lee',
    username: 'jordan',
    uri: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    displayName: 'Sam Rivera',
    username: 'sam',
    uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  },
  { id: '4', displayName: 'Priya Patel', username: 'priya' },
  { id: '5', displayName: 'Chris Doe', username: 'chris' },
];

const meta: Meta<typeof AvatarGroup> = {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
  argTypes: {
    size: { control: { type: 'number', min: 16, max: 96, step: 4 } },
    max: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    overlap: { control: { type: 'number', min: 0, max: 48, step: 1 } },
    hoverCard: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarGroup>;

/** Header / starter-pack use-case: purely presentational, no interaction. */
export const Presentational: Story = {
  args: { items: ITEMS, size: 32, max: 5 },
};

export const WithPhotos: Story = {
  args: { items: WITH_PHOTOS, size: 40, max: 5 },
  name: 'With photos',
};

/** Overflow chip showing `+N` derived from `total`. */
export const WithTotal: Story = {
  args: { items: ITEMS, size: 36, max: 4, total: 128 },
  name: 'With explicit total',
};

/** Each avatar is pressable — the consumer navigates to the profile. */
export const Pressable: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <AvatarGroup
        {...args}
        items={ITEMS}
        size={40}
        max={5}
        onPressItem={(item) => {
          // eslint-disable-next-line no-alert
          if (typeof window !== 'undefined') window.alert(`@${item.username}`);
        }}
      />
      <Text>Tap an avatar to fire onPressItem.</Text>
    </View>
  ),
};

/** Web-only: hovering an avatar reveals the UserHoverCard. */
export const HoverCard: Story = {
  render: (args) => (
    <View style={{ gap: 12, minHeight: 240 }}>
      <AvatarGroup
        {...args}
        items={WITH_PHOTOS}
        size={44}
        max={5}
        hoverCard
        onPressItem={(item) => {
          // eslint-disable-next-line no-alert
          if (typeof window !== 'undefined') window.alert(`@${item.username}`);
        }}
        renderItemAction={(item) => (
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: '#1A73E8',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
              Follow
            </Text>
          </View>
        )}
      />
      <Text>Hover an avatar (web) to see the card with an injected action.</Text>
    </View>
  ),
  name: 'Hover card (web)',
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <AvatarGroup items={ITEMS} size={24} max={5} />
      <AvatarGroup items={ITEMS} size={32} max={5} />
      <AvatarGroup items={ITEMS} size={48} max={5} />
      <AvatarGroup items={ITEMS} size={64} max={5} />
    </View>
  ),
};
