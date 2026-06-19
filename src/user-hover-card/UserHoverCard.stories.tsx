import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserHoverCard } from './UserHoverCard';

const SAMPLE_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

function DemoFollowButton() {
  return (
    <Pressable
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#1A73E8',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
        Follow
      </Text>
    </Pressable>
  );
}

const meta: Meta<typeof UserHoverCard> = {
  title: 'Components/UserHoverCard',
  component: UserHoverCard,
  argTypes: {
    verified: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof UserHoverCard>;

export const Basic: Story = {
  args: {
    avatar: SAMPLE_AVATAR,
    displayName: 'Nate Isern',
    username: 'nate',
    bio: 'Building the Oxy ecosystem. Designer, engineer, and occasional rose grower.',
    stats: [
      { label: 'Following', value: '312' },
      { label: 'Followers', value: '4.8K' },
    ],
    verified: true,
  },
};

export const WithAction: Story = {
  args: {
    avatar: SAMPLE_AVATAR,
    displayName: 'Ada Lovelace',
    username: 'ada',
    bio: 'Mathematician. Wrote the first algorithm intended for a machine.',
    stats: [
      { label: 'Following', value: '12' },
      { label: 'Followers', value: '1.2M' },
    ],
    verified: true,
    action: <DemoFollowButton />,
  },
  name: 'With action slot',
};

export const NoAction: Story = {
  args: {
    avatar: null,
    displayName: 'Grace Hopper',
    username: 'grace',
    bio: 'Computer scientist and US Navy rear admiral.',
    stats: [
      { label: 'Following', value: '88' },
      { label: 'Followers', value: '900K' },
    ],
  },
  name: 'No action slot',
};

export const Minimal: Story = {
  args: {
    displayName: 'Anonymous',
  },
  name: 'Minimal (name only)',
};

export const Pressable_: Story = {
  render: (args) => (
    <View style={{ gap: 8 }}>
      <UserHoverCard
        {...args}
        avatar={SAMPLE_AVATAR}
        displayName="Linus Torvalds"
        username="linus"
        bio="Creator of Linux and Git."
        stats={[
          { label: 'Following', value: '3' },
          { label: 'Followers', value: '2.1M' },
        ]}
        action={<DemoFollowButton />}
        onPressProfile={() => {
          // eslint-disable-next-line no-alert
          if (typeof window !== 'undefined') window.alert('open profile');
        }}
      />
      <Text>Click the identity area to open the profile.</Text>
    </View>
  ),
  name: 'Pressable identity',
};
