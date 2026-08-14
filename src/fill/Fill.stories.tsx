import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Fill } from './index';
import { Text } from '../typography';
import { useTheme } from '../theme';

const meta: Meta<typeof Fill> = {
  title: 'Layout/Fill',
  component: Fill,
};

export default meta;

type Story = StoryObj<typeof Fill>;

/**
 * `Fill` is `position: absolute` pinned to all four edges — the one-word name
 * for the four-line style object that used to be written inline everywhere a
 * gradient, a scrim or a press layer had to cover its parent exactly.
 *
 * It takes its size from the nearest positioned ancestor, so the parent needs a
 * height. A `Fill` in a zero-height parent is invisible, not broken.
 */
export const Scrim: Story = {
  render: () => {
    return (
      <View style={{ width: 320, height: 180, borderRadius: 12, overflow: 'hidden' }}>
        <View style={{ flex: 1, backgroundColor: 'steelblue' }} />
        <Fill style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <Fill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
            Over the top
          </Text>
        </Fill>
      </View>
    );
  },
};

/** Two fills stack in source order — the later one paints above. */
export const Stacked: Story = {
  render: function StackedStory() {
    const { colors } = useTheme();
    return (
      <View
        style={{
          width: 320,
          height: 140,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Fill style={{ backgroundColor: 'rgba(255,0,0,0.25)' }} />
        <Fill style={{ backgroundColor: 'rgba(0,0,255,0.25)', left: '50%' }} />
      </View>
    );
  },
};
