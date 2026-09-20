import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatBar } from './index';
import { BloomThemeProvider } from '../theme';
import { RiStarFill as StarIcon } from '../icons/remix/RiStarFill';

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
  title: 'Charts/Stat Bar',
  component: StatBar,
};

export default meta;

type Story = StoryObj<typeof StatBar>;

export const Light: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24, width: 320, maxWidth: '100%' }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

export const Dark: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, width: 320, maxWidth: '100%', backgroundColor: '#000' }}>
        <Demo />
      </View>
    </BloomThemeProvider>
  ),
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof StatBar> = {
  args: { variant: 'progress', label: 'Storage used', value: 60, max: 100 },
  parameters: { controls: { disable: false, include: ['label', 'value', 'max'] } },
  argTypes: { label: { control: 'text' }, value: { control: 'number' }, max: { control: 'number' } },
  render: function Playground(args) {

    return <View style={{ width: 440, maxWidth: '100%' }}><StatBar {...args} /></View>;
  },
};
