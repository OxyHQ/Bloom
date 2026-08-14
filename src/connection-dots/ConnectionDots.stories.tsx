import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConnectionDots } from './index';
import { IconCircle } from '../icon-circle';
import { Person_Stroke2_Corner0_Rounded as PersonIcon } from '../icons/Person';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '../icons/Lock';

const meta: Meta<typeof ConnectionDots> = {
  title: 'Data Display/ConnectionDots',
  component: ConnectionDots,
};

export default meta;

type Story = StoryObj<typeof ConnectionDots>;

export const Basic: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <ConnectionDots
        left={<IconCircle icon={PersonIcon} size="lg" />}
        right={<IconCircle icon={LockIcon} size="lg" />}
        accessibilityLabel="Connecting your account"
      />
    </View>
  ),
};

export const ManyDots: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <ConnectionDots
        left={<IconCircle icon={PersonIcon} size="lg" />}
        right={<IconCircle icon={LockIcon} size="lg" />}
        dotCount={10}
        dotSize={5}
      />
    </View>
  ),
};

export const ReducedMotion: Story = {
  render: () => (
    <View style={{ padding: 24 }}>
      <ConnectionDots
        left={<IconCircle icon={PersonIcon} size="lg" />}
        right={<IconCircle icon={LockIcon} size="lg" />}
        reducedMotion
      />
    </View>
  ),
};
