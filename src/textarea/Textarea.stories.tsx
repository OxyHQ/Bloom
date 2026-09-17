import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';

import { Textarea } from './index';

const meta: Meta<typeof Textarea> = {
  title: 'Base/Textarea',
  component: Textarea,
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Basic: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <Textarea label="Bio" hint="Markdown ok" placeholder="Tell us about yourself" />
    </View>
  ),
};

function Controlled() {
  const [value, setValue] = useState('');
  return (
    <Textarea
      label="Prompt"
      placeholder="Grows up to six lines"
      value={value}
      onChangeText={setValue}
      autoResize
      rows={1}
      maxRows={6}
      showCount
      maxLength={280}
    />
  );
}

export const AutoResize: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <Controlled />
    </View>
  ),
};

/** Every size and state: rest, small, counter, invalid, disabled. */
export const Matrix: Story = {
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, width: 320, gap: 16, padding: 40, boxSizing: 'content-box' } as never}>
      <Textarea label="Bio" hint="Markdown ok" placeholder="Tell us" />
      <Textarea label="Small" size="small" placeholder="Small" rows={2} />
      <Textarea label="Count" placeholder="Count" showCount maxLength={280} defaultValue="Hello" />
      <Textarea label="Invalid" placeholder="Invalid" isInvalid hint="Too short" showCount />
      <Textarea label="Disabled" placeholder="Disabled" disabled />
    </View>
    );
  },
};
