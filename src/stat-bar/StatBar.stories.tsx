import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatBar } from './index';
import { BloomThemeProvider } from '../theme';
import { Star_Filled_Corner0_Rounded as StarIcon } from '../icons/Star';

function Demo() {
  return (
    <View style={{ gap: 28 }}>
      <StatBar
        variant="progress"
        label="TX count 24h"
        value={192}
        max={350}
        minLabel="32"
        maxLabel="350"
        icon={<StarIcon size="sm" style={{ color: '#F59E0B' }} />}
      />
      <StatBar
        variant="split"
        label="Net flow 24h"
        percent={62}
        leftValue="+$4,210"
        rightValue="-$2,560"
        leftColor="#10B981"
        rightColor="#EF4444"
      />
    </View>
  );
}

const meta: Meta<typeof StatBar> = {
  title: 'Data Display/StatBar',
  component: StatBar,
};

export default meta;

type Story = StoryObj<typeof StatBar>;

export const Light: Story = {
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24, width: 320 }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, width: 320, backgroundColor: '#000' }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};
