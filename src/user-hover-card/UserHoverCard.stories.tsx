import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityHeatmap } from '../activity-heatmap';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { UserHoverCard } from './UserHoverCard';
import type { UserHoverCardProps } from './types';

const SAMPLE_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
const SAMPLE_COVER =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=200&fit=crop';

/**
 * 112 days of deterministic activity — the shape the `footer` slot exists for,
 * and the reason it is 112: the card is 280px wide with a 1px border and 15px
 * padding, so the inner width is 248px, and 112 days spans at most 17 columns of
 * 11px cells at a 3px gap (235px). 119 days spans EIGHTEEN columns once the
 * leading partial week is counted — measured at 249px in Chrome, one pixel past
 * the padding, and the card does not clip.
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

const STATS = [
  { label: 'Following', value: '312' },
  { label: 'Followers', value: '4.8K' },
];

/**
 * Stand-in for the SDK's FollowButton, which is what a real app passes. Bloom's
 * own `Button`, small and pill-shaped: primary to follow, secondary once
 * following.
 */
function DemoFollowButton({ initial = false }: { initial?: boolean }) {
  const [following, setFollowing] = React.useState(initial);
  return (
    <Button
      size="small"
      variant={following ? 'secondary' : 'primary'}
      onPress={() => setFollowing((value) => !value)}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}

const meta: Meta<typeof UserHoverCard> = {
  title: 'Blocks/User Hover Card',
  component: UserHoverCard,
  argTypes: {
    verified: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof UserHoverCard>;

const BASE: UserHoverCardProps = {
  avatar: SAMPLE_AVATAR,
  displayName: 'Nate Isern',
  username: 'nate',
  bio: 'Building the Oxy ecosystem. Designer, engineer, and occasional rose grower.',
  stats: STATS,
  verified: true,
};

export const Basic: Story = {
  args: { ...BASE, action: <DemoFollowButton /> },
};

export const WithCover: Story = {
  args: { ...BASE, cover: SAMPLE_COVER, action: <DemoFollowButton /> },
  name: 'With cover',
};

export const Following: Story = {
  args: {
    ...BASE,
    avatar: null,
    displayName: 'Ada Lovelace',
    username: 'ada',
    bio: 'Mathematician. Wrote the first algorithm intended for a machine.',
    stats: [
      { label: 'Following', value: '12' },
      { label: 'Followers', value: '1.2M' },
    ],
    action: <DemoFollowButton initial />,
  },
  name: 'Following (initials avatar)',
};

export const NoBio: Story = {
  args: {
    ...BASE,
    bio: undefined,
    verified: false,
    displayName: 'Grace Hopper',
    username: 'grace',
    action: <DemoFollowButton />,
  },
  name: 'Without bio, not verified',
};

export const NoAction: Story = {
  args: { ...BASE, action: undefined },
  name: 'No action slot',
};

export const Minimal: Story = {
  args: { displayName: 'Anonymous' },
  name: 'Minimal (name only)',
};

export const Loading: Story = {
  args: { displayName: '', loading: true },
};

export const LoadingWithCover: Story = {
  args: { displayName: '', loading: true, cover: SAMPLE_COVER },
  name: 'Loading with cover',
};

/** Every state side by side, for a one-screenshot review. */
function MatrixGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <UserHoverCard {...BASE} action={<DemoFollowButton />} testID="card-basic" />
      <UserHoverCard {...BASE} cover={SAMPLE_COVER} action={<DemoFollowButton />} testID="card-cover" />
      <UserHoverCard
        {...BASE}
        avatar={null}
        displayName="Ada Lovelace"
        username="ada"
        bio={undefined}
        verified={false}
        action={<DemoFollowButton initial />}
        testID="card-following"
      />
      <UserHoverCard displayName="" loading testID="card-loading" />
      <UserHoverCard displayName="" loading cover={SAMPLE_COVER} testID="card-loading-cover" />
    </View>
  );
}

export const Matrix: Story = {
  render: () => <MatrixGrid />,
};

function DarkSurface({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ padding: 24, backgroundColor: theme.colors.background }}>{children}</View>
  );
}

export const Dark: Story = {
  render: (_args, context) => (
    <BloomThemeProvider
      mode="dark"
      colorPreset={context.globals.colorPreset as React.ComponentProps<typeof BloomThemeProvider>['colorPreset']}
    >
      <DarkSurface>
        <MatrixGrid />
      </DarkSurface>
    </BloomThemeProvider>
  ),
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
        {...BASE}
        bio="Building the Oxy ecosystem."
        action={<DemoFollowButton />}
        onPressProfile={() => setPressed('profile')}
        footer={
          <View style={{ gap: 4 }} testID="footer-slot">
            <Text variant="body-2-medium" style={{ opacity: 0.6 }}>
              Activity
            </Text>
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
        {...BASE}
        displayName="Linus Torvalds"
        username="linus"
        bio="Creator of Linux and Git."
        cover={SAMPLE_COVER}
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
