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
  title: 'Data Display/AvatarGroup',
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

/**
 * Row layout: avatars placed adjacent with a positive gap and no separator
 * ring — the "top tokens" / adjacent-icons strip. Still collapses to `+N`.
 */
export const RowLayout: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <AvatarGroup layout="row" items={WITH_PHOTOS} size={28} max={4} />
      <AvatarGroup layout="row" items={WITH_PHOTOS} size={36} max={5} spacing={10} />
    </View>
  ),
  name: 'Row layout',
};

// A larger pool of initials-only members to show the cluster densely packed.
const MANY: AvatarGroupItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: `c${i}`,
  displayName: String.fromCharCode(65 + (i % 26)),
  username: `user${i}`,
}));

/**
 * Cluster layout: a compact iMessage-style "magnetic bubble cluster" of
 * NEAR-EQUAL-size avatars packed densely into a round box (`size` = box
 * diameter). A modestly larger primary sits in front; the rest are only slightly
 * smaller and nestle against it with a small uniform gap, filling the round box
 * edge-to-edge. `showInitials` renders a colored letter for avatar-less members
 * so the packing reads clearly. Shown at counts 3, 4, 5, 6, 8, 12, and 20.
 */
export const ClusterLayout: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
      {[3, 4, 5, 6, 8, 12, 20].map((count) => (
        <View key={count} style={{ alignItems: 'center', gap: 8 }}>
          <AvatarGroup
            layout="cluster"
            items={MANY.slice(0, count)}
            size={120}
            showInitials
          />
          <Text>{count}</Text>
        </View>
      ))}
    </View>
  ),
  name: 'Cluster layout',
};

/**
 * Cluster with photos at the common collaborative-post sizes (2 = "front +
 * behind", then 3 and 4).
 */
export const ClusterWithPhotos: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      {[2, 3, 4].map((count) => (
        <AvatarGroup
          key={count}
          layout="cluster"
          items={WITH_PHOTOS.slice(0, count)}
          size={64}
          showInitials
        />
      ))}
    </View>
  ),
  name: 'Cluster with photos',
};

/**
 * Cluster overflow: 25 members with `max={20}` shows 19 avatars + a trailing
 * "+N" bubble as the last (smallest) cluster member.
 */
export const ClusterOverflow: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <AvatarGroup layout="cluster" items={MANY} size={140} max={20} showInitials />
      <Text>25 members, max 20 → cap + &quot;+N&quot;</Text>
    </View>
  ),
  name: 'Cluster overflow',
};
