import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './Avatar';
import { Verified_Stroke2_Corner2_Rounded } from '../icons/Verified';

const meta: Meta<typeof Avatar> = {
  title: 'Data Display/Avatar',
  component: Avatar,
  argTypes: {
    size: {
      control: { type: 'number', min: 16, max: 256, step: 4 },
    },
    shape: {
      control: 'select',
      options: ['circle', 'squircle'],
    },
    verified: { control: 'boolean' },
    live: { control: 'boolean' },
    hideLiveBadge: { control: 'boolean' },
    ring: { control: 'object' },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

const SAMPLE_URI =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

// Sample Instagram-stories-style gradient, defined locally in the story only —
// Bloom ships no such palette (it stays brand-neutral). Consumers supply their
// own ring colors via the `ring` prop.
const STORY_GRADIENT = ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'];
// Muted gray used by IG for an already-seen story.
const SEEN_GRAY = '#C7C7CC';

export const Basic: Story = {
  args: { size: 64, name: 'Nate Isern' },
};

export const FromUri: Story = {
  args: { size: 64, uri: SAMPLE_URI },
  name: 'From URI',
};

export const Initials: Story = {
  args: { size: 64, name: 'Ada Lovelace' },
};

export const Squircle: Story = {
  args: { size: 64, name: 'Ada Lovelace', shape: 'squircle' },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Avatar size={24} name="Ada" />
      <Avatar size={32} name="Ada" />
      <Avatar size={40} name="Ada" />
      <Avatar size={56} name="Ada" />
      <Avatar size={80} name="Ada" />
      <Avatar size={120} name="Ada" />
    </View>
  ),
};

export const Composition: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Avatar size={48} name="Ada Lovelace" />
      <Avatar size={48} name="Grace Hopper" />
      <Avatar size={48} name="Alan Turing" />
      <Avatar size={48} name="Linus Torvalds" />
      <Avatar size={48} name="Margaret Hamilton" />
    </View>
  ),
};

export const LiveCircle: Story = {
  args: { size: 72, uri: SAMPLE_URI, live: true },
  name: 'Live (circle)',
};

export const LiveSquircle: Story = {
  args: { size: 72, uri: SAMPLE_URI, live: true, shape: 'squircle' },
  name: 'Live (squircle)',
};

export const LiveSmall: Story = {
  // size <= 32 → tiny badge variant
  args: { size: 28, uri: SAMPLE_URI, live: true },
  name: 'Live (small · tiny badge)',
};

export const LiveRingOnly: Story = {
  args: { size: 72, uri: SAMPLE_URI, live: true, hideLiveBadge: true },
  name: 'Live + hideLiveBadge (ring only)',
};

export const LiveVerified: Story = {
  args: {
    size: 72,
    uri: SAMPLE_URI,
    live: true,
    verified: true,
    verifiedIcon: (
      <Verified_Stroke2_Corner2_Rounded size="lg" fill="#1D9BF0" />
    ),
  },
  name: 'Live + verified',
};

export const LiveGallery: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
      <Avatar size={24} uri={SAMPLE_URI} live />
      <Avatar size={32} uri={SAMPLE_URI} live />
      <Avatar size={48} uri={SAMPLE_URI} live />
      <Avatar size={72} uri={SAMPLE_URI} live />
      <Avatar size={72} uri={SAMPLE_URI} live shape="squircle" />
      <Avatar size={72} uri={SAMPLE_URI} live liveLabel="EN VIVO" />
    </View>
  ),
  name: 'Live (gallery)',
};

export const GradientRing: Story = {
  args: {
    size: 72,
    uri: SAMPLE_URI,
    ring: { colors: STORY_GRADIENT, width: 3, gap: 3 },
  },
  name: 'Gradient ring (stories)',
};

export const SeenVsUnseen: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
      {/* Unseen → gradient ring. */}
      <Avatar
        size={72}
        uri={SAMPLE_URI}
        ring={{ colors: STORY_GRADIENT, width: 3, gap: 3 }}
      />
      {/* Seen → muted solid gray ring. */}
      <Avatar
        size={72}
        uri={SAMPLE_URI}
        ring={{ colors: SEEN_GRAY, width: 3, gap: 3 }}
      />
    </View>
  ),
  name: 'Seen vs unseen',
};

export const RingWithGap: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      {/* gap 0 → overlays the edge, footprint unchanged. */}
      <Avatar size={72} uri={SAMPLE_URI} ring={{ colors: STORY_GRADIENT, width: 3, gap: 0 }} />
      {/* gap 4 → sits outside the avatar, footprint grows. */}
      <Avatar size={72} uri={SAMPLE_URI} ring={{ colors: STORY_GRADIENT, width: 3, gap: 4 }} />
      {/* gap 8 → wider clearance. */}
      <Avatar size={72} uri={SAMPLE_URI} ring={{ colors: STORY_GRADIENT, width: 4, gap: 8 }} />
    </View>
  ),
  name: 'Ring with gap',
};

export const RingSquircle: Story = {
  args: {
    size: 72,
    uri: SAMPLE_URI,
    shape: 'squircle',
    ring: { colors: STORY_GRADIENT, width: 3, gap: 3 },
  },
  name: 'Gradient ring (squircle)',
};

export const SolidRing: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
      <Avatar size={72} uri={SAMPLE_URI} ring={{ colors: '#1A73E8', width: 3 }} />
      <Avatar size={72} uri={SAMPLE_URI} shape="squircle" ring={{ colors: '#1A73E8', width: 3 }} />
      <Avatar size={72} uri={SAMPLE_URI} ring={{ colors: '#1A73E8', width: 3, gap: 4 }} />
    </View>
  ),
  name: 'Solid ring',
};

export const GradientDirections: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
      <Avatar
        size={72}
        uri={SAMPLE_URI}
        ring={{ colors: STORY_GRADIENT, width: 3, gap: 3, gradientDirection: 'diagonal' }}
      />
      <Avatar
        size={72}
        uri={SAMPLE_URI}
        ring={{ colors: STORY_GRADIENT, width: 3, gap: 3, gradientDirection: 'horizontal' }}
      />
      <Avatar
        size={72}
        uri={SAMPLE_URI}
        ring={{ colors: STORY_GRADIENT, width: 3, gap: 3, gradientDirection: 'vertical' }}
      />
    </View>
  ),
  name: 'Gradient directions',
};
