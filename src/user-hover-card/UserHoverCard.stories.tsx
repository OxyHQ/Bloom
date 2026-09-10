import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityHeatmap } from '../activity-heatmap';
import { UserHoverCard } from './UserHoverCard';

const SAMPLE_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

/**
 * 119 days of deterministic activity — the shape the `footer` slot exists for,
 * and deliberately the WIDEST case rather than a comfortable one: 119 days
 * spans EIGHTEEN columns once the leading partial week is counted, which at
 * `cellSize={11} gap={3}` is 249px. That is the content that used to miss the
 * card's inner width by a single pixel, which is why the inner width is now a
 * published number (`USER_HOVER_CARD_CONTENT_WIDTH`, 256) that this story is
 * sized against and a test measures.
 */
const ACTIVITY_DAYS = 119;
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

/**
 * Both slots at once, with a PRESSABLE badge — deliberately the hazardous shape
 * rather than the recommended one. A marker beside a handle is usually inert,
 * but nothing stops a consumer wiring it to an explainer, and it sits INSIDE the
 * identity area, so this is where the two presses can be seen not to collide:
 * pressing the badge writes "badge", never "profile", on both platforms.
 *
 * The `stopPropagation` below is belt-and-braces, not a requirement — measured
 * in Chrome with it removed, the profile still did not fire, because
 * react-native-web implements React Native's responder system. What a pressable
 * badge DOES cost is a `<button>` inside a `<button>`, which is invalid HTML;
 * `docs/user-hover-card.mdx` recommends an inert marker for that reason.
 */
function BothSlotsStory() {
  const [pressed, setPressed] = React.useState('nothing pressed yet');
  return (
    <View style={{ gap: 8 }}>
      <UserHoverCard
        avatar={SAMPLE_AVATAR}
        displayName="Oxy Announcements"
        username="announcements"
        bio="Product news, one post at a time."
        stats={[
          { label: 'Following', value: '4' },
          { label: 'Followers', value: '92.1K' },
        ]}
        verified
        action={<DemoFollowButton />}
        onPressProfile={() => setPressed('profile')}
        badge={
          <Pressable
            testID="badge-slot"
            accessibilityRole="button"
            accessibilityLabel="What is a channel?"
            onPress={(event) => {
              event.stopPropagation();
              setPressed('badge');
            }}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 999,
              backgroundColor: '#E8EAED',
            }}
          >
            <Text style={{ fontSize: 11, color: '#3C4043' }}>channel</Text>
          </Pressable>
        }
        footer={
          <View style={{ gap: 4 }} testID="footer-slot">
            <Text style={{ fontSize: 13, opacity: 0.6 }}>Activity</Text>
            <ActivityHeatmap
              data={ACTIVITY}
              endDate={ACTIVITY_END}
              numDays={ACTIVITY_DAYS}
              cellSize={11}
              gap={3}
              testID="footer-heatmap"
            />
          </View>
        }
      />
      <Text testID="press-result">{pressed}</Text>
    </View>
  );
}

export const WithBadge: Story = {
  render: () => <BothSlotsStory />,
  name: 'With badge slot (pressable) + footer',
};

/** A long handle truncates so the marker keeps its place. */
export const BadgeWithLongHandle: Story = {
  args: {
    avatar: SAMPLE_AVATAR,
    displayName: 'A Very Long Display Name Indeed',
    username: 'an-extremely-long-handle-that-will-not-fit',
    bio: 'The handle yields; the marker does not.',
    badge: (
      <View
        style={{
          paddingHorizontal: 6,
          paddingVertical: 1,
          borderRadius: 999,
          backgroundColor: '#E8EAED',
        }}
      >
        <Text style={{ fontSize: 11, color: '#3C4043' }}>fediverse</Text>
      </View>
    ),
  },
  name: 'Badge with a long handle',
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
