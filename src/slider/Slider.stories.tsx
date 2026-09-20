import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RangeSlider, Slider } from './Slider';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  component: Slider,
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
  parameters: { controls: { disable: true } },
  render: function SliderMatrix() {
    const theme = useTheme();
    const [a, setA] = useState(40);
    const [b, setB] = useState(60);
    const [r, setR] = useState<[number, number]>([20, 70]);
    return (
      <View style={{ width: 352, maxWidth: '100%', gap: 16, padding: 16, backgroundColor: theme.colors.background }}>
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
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState(40);
    return (
      <View style={{ width: 320, maxWidth: '100%', gap: 8 }}>
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
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState(2);
    return (
      <View style={{ width: 320, maxWidth: '100%', gap: 8 }}>
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 320, maxWidth: '100%' }}>
      <Slider value={60} onValueChange={() => {}} disabled accessibilityLabel="Volume, unavailable" />
    </View>
  ),
};

/** A range slider: two thumbs that cannot pass each other, one bubble each. */
export const Range: Story = {
  parameters: { controls: { disable: true } },
  render: function RangeStory() {
    const [value, setValue] = useState<[number, number]>([200, 800]);
    return (
      <View style={{ width: 320, maxWidth: '100%' }}>
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

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof Slider> = {
  args: { label: 'Volume', value: 40, min: 0, max: 100, step: 1, disabled: false, showTooltip: true, size: 'md', tone: 'accent' },
  parameters: { controls: { disable: false, include: ['label', 'value', 'min', 'max', 'step', 'disabled', 'showTooltip', 'size', 'tone'] } },
  argTypes: { label: { control: 'text' }, value: { control: 'number' }, min: { control: 'number' }, max: { control: 'number' }, step: { control: 'number' }, disabled: { control: 'boolean' }, showTooltip: { control: 'boolean' }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] }, tone: { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><Slider {...args} onValueChange={next => updateArgs({ value: next })} /></View>;
  },
};
