import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';

import { InputOtp } from './index';

const meta: Meta<typeof InputOtp> = {
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
  render: () => <Controlled />,
};

/** Every state: empty, filled, grouped, invalid, disabled. */
export const Matrix: Story = {
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, gap: 16, padding: 40 }}>
      <InputOtp testID="otp-empty" />
      <InputOtp defaultValue="123456" />
      <InputOtp defaultValue="123" groupEvery={3} />
      <InputOtp defaultValue="12" isInvalid />
      <InputOtp defaultValue="12" isDisabled />
      <InputOtp length={4} defaultValue="4" />
    </View>
    );
  },
};
