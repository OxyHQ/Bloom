import { useArgs } from 'storybook/preview-api';
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 320, maxWidth: '100%' }}>
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
      onValueChange={setValue}
      autoResize
      rows={1}
      maxRows={6}
      showCount
      maxLength={280}
    />
  );
}

export const AutoResize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 320, maxWidth: '100%' }}>
      <Controlled />
    </View>
  ),
};

/** Every size and state: rest, small, counter, invalid, disabled. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, width: 352, maxWidth: '100%', gap: 16, padding: 16 }}>
      <Textarea label="Bio" hint="Markdown ok" placeholder="Tell us" />
      <Textarea label="Small" size="sm" placeholder="Small" rows={2} />
      <Textarea label="Count" placeholder="Count" showCount maxLength={280} defaultValue="Hello" />
      <Textarea label="Invalid" placeholder="Invalid" invalid hint="Too short" showCount />
      <Textarea label="Disabled" placeholder="Disabled" disabled />
    </View>
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof Textarea> = {
  args: { label: 'Bio', placeholder: 'Tell us about yourself', value: '', rows: 3, disabled: false, invalid: false, showCount: true, maxLength: 280, size: 'md' },
  parameters: { controls: { disable: false, include: ['label', 'placeholder', 'value', 'rows', 'disabled', 'invalid', 'showCount', 'maxLength', 'size'] } },
  argTypes: { label: { control: 'text' }, placeholder: { control: 'text' }, value: { control: 'text' }, rows: { control: 'number' }, disabled: { control: 'boolean' }, invalid: { control: 'boolean' }, showCount: { control: 'boolean' }, maxLength: { control: 'number' }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><Textarea {...args} onValueChange={next => updateArgs({ value: next })} /></View>;
  },
};
