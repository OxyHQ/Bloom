import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PromptInput } from './PromptInput';

const meta: Meta<typeof PromptInput> = {
  title: 'Components/PromptInput',
  component: PromptInput,
};

export default meta;

type Story = StoryObj<typeof PromptInput>;

function BasicPrompt() {
  const [value, setValue] = useState('');
  return (
    <View style={{ width: 480 }}>
      <PromptInput
        value={value}
        onValueChange={setValue}
        placeholder="Ask anything"
        onSubmit={() => {
          // submitted
          setValue('');
        }}
      />
    </View>
  );
}

function LoadingPrompt() {
  const [value, setValue] = useState('Generating response...');
  return (
    <View style={{ width: 480 }}>
      <PromptInput
        value={value}
        onValueChange={setValue}
        placeholder="Ask anything"
        isLoading
        onSubmit={() => {}}
        onStop={() => {}}
      />
    </View>
  );
}

function DisabledPrompt() {
  return (
    <View style={{ width: 480 }}>
      <PromptInput
        value=""
        placeholder="Disabled"
        disabled
        onSubmit={() => {}}
      />
    </View>
  );
}

export const Basic: Story = {
  render: () => <BasicPrompt />,
};

export const Loading: Story = {
  render: () => <LoadingPrompt />,
};

export const Disabled: Story = {
  render: () => <DisabledPrompt />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <BasicPrompt />
      <LoadingPrompt />
      <DisabledPrompt />
    </View>
  ),
};
