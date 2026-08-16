import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityHeatmap } from '../activity-heatmap';
import { UserHoverCard } from './UserHoverCard';

const SAMPLE_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

/**
 * 112 days of deterministic activity — the shape the `footer` slot exists for,
 * and the reason it is 112: the card is 280px wide with `space.lg` padding, so
 * the inner width is 248px, and 112 days spans at most 17 columns of 11px cells
 * at a 3px gap (235px). 119 days spans EIGHTEEN columns once the leading partial
 * week is counted — measured at 249px in Chrome, one pixel past the padding,
 * and the card does not clip.
 */
const ACTIVITY_DAYS = 112;
const ACTIVITY_END = '2026-08-14';
const ACTIVITY = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 14) - (ACTIVITY_DAYS - 1 - i) * 86400000);
  return {
    date: day.toISOString().slice(0, 10),
    // A fixed pseudo-random pattern, so the story renders identically every run.
    count: (i * 7919) % 13 > 8 ? (i * 7919) % 13 : 0,
  };
});

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
  title: 'Data Display/UserHoverCard',
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

/**
 * The `footer` slot carrying a real chart — the case the slot was added for
 * (Mention renders a contribution graph under the bio). The heatmap's own cells
 * are pressable, which is the part worth looking at: the slot is a SIBLING of
 * the identity area, so a press on a day lands on the day, not on
 * `onPressProfile`.
 */
function FooterSlotStory() {
  const [pressed, setPressed] = React.useState('nothing pressed yet');
  return (
    <View style={{ gap: 8 }}>
      <UserHoverCard
        avatar={SAMPLE_AVATAR}
        displayName="Nate Isern"
        username="nate"
        bio="Building the Oxy ecosystem."
        stats={[
          { label: 'Following', value: '312' },
          { label: 'Followers', value: '4.8K' },
        ]}
        verified
        action={<DemoFollowButton />}
        onPressProfile={() => setPressed('profile')}
        footer={
          <View style={{ gap: 4 }} testID="footer-slot">
            <Text style={{ fontSize: 13, opacity: 0.6 }}>Activity</Text>
            <ActivityHeatmap
              data={ACTIVITY}
              endDate={ACTIVITY_END}
              numDays={ACTIVITY_DAYS}
              cellSize={11}
              gap={3}
              onPressDay={(day) => setPressed(`day ${day.date}`)}
              testID="footer-heatmap"
            />
          </View>
        }
      />
      <Text testID="press-result">{pressed}</Text>
    </View>
  );
}

export const WithFooter: Story = {
  render: () => <FooterSlotStory />,
  name: 'With footer slot (chart)',
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
