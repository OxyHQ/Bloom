import React from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { UserHoverCard } from '../user-hover-card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './index';

const meta: Meta = {
  title: 'Base/Hover Card',
};

export default meta;

type Story = StoryObj;

const AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
const COVER =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=200&fit=crop';

const PROFILE = {
  avatar: AVATAR,
  cover: COVER,
  displayName: 'Nate Isern',
  username: 'nate',
  bio: 'Building the Oxy ecosystem. Designer, engineer, and occasional rose grower.',
  stats: [
    { label: 'Following', value: '312' },
    { label: 'Followers', value: '4.8K' },
  ],
  verified: true,
};

function Mention({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => {}} accessibilityRole="link">
      <Text variant="body-medium" style={{ color: theme.colors.primary }}>
        {children}
      </Text>
    </Pressable>
  );
}

function FollowButton() {
  const [following, setFollowing] = React.useState(false);
  return (
    <Button
      size="small"
      variant={following ? 'secondary' : 'primary'}
      onPress={() => setFollowing((value) => !value)}>
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}

/**
 * The whole point of the family: the trigger decides WHEN (hover for 400ms, or
 * keyboard focus; long press on native) and the content decides WHERE (under the
 * trigger, flipped and clamped to the viewport). `UserHoverCard` inside it only
 * draws the person — the panel is its surface.
 */
export const UserProfile: Story = {
  name: 'User profile',
  render: () => (
    <View style={{ padding: 80, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text variant="body-regular">Posted by</Text>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Mention>@nate</Mention>
        </HoverCardTrigger>
        <HoverCardContent label="Nate Isern">
          <UserHoverCard {...PROFILE} action={<FollowButton />} onPressProfile={() => {}} />
        </HoverCardContent>
      </HoverCard>
    </View>
  ),
};

/** Any element can be the trigger — here an avatar, with the compact card. */
export const AvatarTrigger: Story = {
  name: 'Avatar trigger',
  render: () => (
    <View style={{ padding: 80 }}>
      <HoverCard>
        <HoverCardTrigger>
          <Avatar source={AVATAR} name="Nate Isern" size={40} />
        </HoverCardTrigger>
        <HoverCardContent label="Nate Isern" align="start">
          <UserHoverCard {...PROFILE} cover={undefined} action={<FollowButton />} />
        </HoverCardContent>
      </HoverCard>
    </View>
  ),
};

/**
 * Fetch on open. `onOpenChange` fires when the card is about to show, so the
 * profile is only requested for people someone actually hovers; the card's own
 * skeleton covers the wait.
 */
export const LoadOnOpen: Story = {
  name: 'Load on open',
  render: function LoadOnOpenStory() {
    const [loaded, setLoaded] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(() => () => {
      if (timer.current) clearTimeout(timer.current);
    }, []);
    const onOpenChange = (open: boolean) => {
      if (!open || loaded) return;
      timer.current = setTimeout(() => setLoaded(true), 900);
    };
    return (
      <View style={{ padding: 80, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text variant="body-regular">Reply from</Text>
        <HoverCard onOpenChange={onOpenChange}>
          <HoverCardTrigger asChild>
            <Mention>@nate</Mention>
          </HoverCardTrigger>
          <HoverCardContent label="Nate Isern">
            <UserHoverCard {...PROFILE} loading={!loaded} action={<FollowButton />} />
          </HoverCardContent>
        </HoverCard>
      </View>
    );
  },
};

/** Arbitrary content gets the padded surface. */
export const Prose: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Mention>What is Bloom?</Mention>
        </HoverCardTrigger>
        <HoverCardContent label="About Bloom" align="start">
          <View style={{ width: 256, gap: 6 }}>
            <Text variant="headline-medium">Bloom</Text>
            <Text variant="body-regular">
              The shared React Native and web component library every Oxy app is built with.
            </Text>
          </View>
        </HoverCardContent>
      </HoverCard>
    </View>
  ),
};

/** `side` is a preference: near the bottom of the viewport the card flips up. */
export const Placement: Story = {
  render: () => (
    <View style={{ padding: 80, flexDirection: 'row', gap: 32 }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <HoverCard key={side} openDelay={100}>
          <HoverCardTrigger asChild>
            <Mention>{side}</Mention>
          </HoverCardTrigger>
          <HoverCardContent label={side} side={side}>
            <Text variant="body-regular">Opens on the {side}</Text>
          </HoverCardContent>
        </HoverCard>
      ))}
    </View>
  ),
};
