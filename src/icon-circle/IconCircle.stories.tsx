import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconCircle } from './index';
import { Text } from '../typography';
import { RiNotification3Line as BellIcon } from '../icons/remix/RiNotification3Line';
import { RiLockLine as LockIcon } from '../icons/remix/RiLockLine';
import { RiShieldLine as ShieldIcon } from '../icons/remix/RiShieldLine';

const meta: Meta<typeof IconCircle> = {
  argTypes: {
    "size": { control: 'select', options: ["xs","sm","md","lg","2xs","xl","2xl","3xl"] }
  },
  title: 'Base/Icon Circle',
  component: IconCircle,
};

export default meta;

type Story = StoryObj<typeof IconCircle>;

/**
 * An icon on a `primarySubtle` disc with the `primary` glyph on top. It is the
 * reference for how Bloom tints anything: the background and the foreground are
 * a resolved PAIR of tokens, never one token with alpha appended — which is the
 * mistake that produced a chip drawn at contrast 1.00.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <IconCircle icon={BellIcon} size="lg" />
      <IconCircle icon={LockIcon} size="xl" />
    </View>
  ),
};

/** Where it is normally used: the header of an empty state or a consent step. */
export const InAHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 320, alignItems: 'center', gap: 12 }}>
      <IconCircle icon={ShieldIcon} />
      <Text style={{ fontSize: 17, fontWeight: '600' }}>Nothing shared yet</Text>
      <Text style={{ textAlign: 'center' }}>
        This app has not asked for anything from your account.
      </Text>
    </View>
  ),
};

/**
 * `style` overrides the disc, `iconStyle` the glyph. Overriding only one of the
 * two is how a tinted disc ends up with an invisible icon, so change them
 * together or not at all.
 */
export const CustomTone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24 }}>
      <IconCircle
        icon={BellIcon}
        style={{ backgroundColor: 'rgb(255 237 213)' }}
        iconStyle={{ color: 'rgb(154 52 18)' }}
      />
      <IconCircle
        icon={LockIcon}
        style={{ backgroundColor: 'rgb(220 252 231)' }}
        iconStyle={{ color: 'rgb(22 101 52)' }}
      />
    </View>
  ),
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { icon: BellIcon, size: 'lg' },
};
