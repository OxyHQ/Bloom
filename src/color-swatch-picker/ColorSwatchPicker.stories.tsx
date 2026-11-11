import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColorSwatchPicker } from './index';

const meta: Meta<typeof ColorSwatchPicker> = {
  id: 'base-color-swatch-picker',
  title: 'Components/Inputs/ColorSwatchPicker',
  component: ColorSwatchPicker,
};

export default meta;

type Story = StoryObj<typeof ColorSwatchPicker>;

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#ef4444',
];

export const BrandColor: Story = {
  parameters: { controls: { disable: true } },
  render: function BrandColorStory() {
    const [value, setValue] = useState<string>('#3b82f6');
    return (
      <ColorSwatchPicker
        label="Brand colour"
        value={value}
        onValueChange={setValue}
        colors={COLORS}
      />
    );
  },
};
