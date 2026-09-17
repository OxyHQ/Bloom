import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RangeSlider, Slider } from './Slider';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  title: 'Base/Slider',
};

export default meta;

type Story = StoryObj;

/**
 * Every state side by side: labelled with the value bubble, bare, disabled.
 * Hover the track (rail darkens) or the thumb (border darkens); drag to see
 * the accent border and lifted bubble; Tab onto a thumb for the focus ring.
 */
export const Matrix: Story = {
  render: function SliderMatrix() {
    const theme = useTheme();
    const [a, setA] = useState(40);
    const [b, setB] = useState(60);
    const [r, setR] = useState<[number, number]>([20, 70]);
    return (
      <View style={{ width: 352, gap: 16, padding: 16, backgroundColor: theme.colors.background }}>
        <Slider label="Volume" value={a} onValueChange={setA} />
        <Slider value={b} onValueChange={setB} showTooltip={false} accessibilityLabel="Brightness" />
        <Slider value={30} onValueChange={() => {}} disabled showTooltip={false} accessibilityLabel="Locked" />
        <Slider
          value={a}
          onValueChange={setA}
          formatValue={(v) => `${v}%`}
          accessibilityLabel="Opacity"
        />
        <RangeSlider value={r} onValueChange={setR} accessibilityLabel="Price" />
      </View>
    );
  },
};

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

/** A range slider: two thumbs that cannot pass each other, one bubble each. */
export const Range: Story = {
  render: function RangeStory() {
    const [value, setValue] = useState<[number, number]>([200, 800]);
    return (
      <View style={{ width: 320 }}>
        <RangeSlider
          label="Price"
          value={value}
          onValueChange={setValue}
          min={0}
          max={1000}
          step={10}
          formatValue={(v) => `$${v}`}
        />
      </View>
    );
  },
};
