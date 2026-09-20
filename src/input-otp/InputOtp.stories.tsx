import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';

import { InputOtp } from './index';

const meta: Meta<typeof InputOtp> = {
  argTypes: {
    "length": { control: 'number' },
    "value": { control: 'text' },
    "defaultValue": { control: 'text' },
    "invalid": { control: 'boolean' },
    "isDisabled": { control: 'boolean' },
    "disabled": { control: 'boolean' },
    "groupEvery": { control: 'number' },
    "autoFocus": { control: 'boolean' }
  },
  title: 'Base/Input OTP',
  component: InputOtp,
};

export default meta;

type Story = StoryObj<typeof InputOtp>;

function Controlled() {
  const [code, setCode] = useState('');
  const [done, setDone] = useState<string | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <InputOtp value={code} onChange={setCode} onComplete={setDone} groupEvery={3} />
      <Text>{done ? `Complete: ${done}` : `Typed: ${code || '—'}`}</Text>
    </View>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Controlled />,
};

/** Every state: empty, filled, grouped, invalid, disabled. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, gap: 16, width: '100%', maxWidth: 400 }}>
      <InputOtp testID="otp-empty" />
      <InputOtp defaultValue="123456" />
      <InputOtp defaultValue="123" groupEvery={3} />
      <InputOtp defaultValue="12" invalid />
      <InputOtp defaultValue="12" isDisabled />
      <InputOtp length={4} defaultValue="4" />
    </View>
    );
  },
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { value: '', length: 6, groupEvery: 3, invalid: false, disabled: false },
  render: function PlaygroundOtp(args) { const [, updateArgs] = useArgs(); return <InputOtp {...args} onChange={(value) => updateArgs({ value })} />; },
};
