import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Slider } from './Slider';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Forms/Slider',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState(40);
    return (
      <View style={{ width: 320, gap: 8 }}>
        <Text>{`Value: ${value}`}</Text>
        <Slider
          value={value}
          onValueChange={setValue}
          min={0}
          max={100}
          accessibilityLabel="Volume"
        />
      </View>
    );
  },
};

export const Stepped: Story = {
  render: () => {
    const [value, setValue] = useState(2);
    return (
      <View style={{ width: 320, gap: 8 }}>
        <Text>{`Step 0–5: ${value}`}</Text>
        <Slider
          value={value}
          onValueChange={setValue}
          min={0}
          max={5}
          step={1}
          accessibilityLabel="Rating"
        />
      </View>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <Slider value={60} onValueChange={() => {}} disabled accessibilityLabel="Volume, unavailable" />
    </View>
  ),
};
