import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Select from './index';

const meta: Meta = {
  title: 'Components/Select',
};

export default meta;

type Story = StoryObj;

type Option = { value: string; label: string };

const FRUITS: Option[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
  { value: 'elderberry', label: 'Elderberry' },
];

function BasicSelect() {
  const [value, setValue] = useState<string>('apple');
  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger label="Pick a fruit">
        <Select.ValueText placeholder="Pick a fruit" />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <Select.Item value={item.value} label={item.label}>
            <Select.ItemIndicator />
            <Select.ItemText>{item.label}</Select.ItemText>
          </Select.Item>
        )}
      />
    </Select.Root>
  );
}

function UncontrolledSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger label="Pick a fruit">
        <Select.ValueText placeholder="No fruit selected" />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <Select.Item value={item.value} label={item.label}>
            <Select.ItemIndicator />
            <Select.ItemText>{item.label}</Select.ItemText>
          </Select.Item>
        )}
      />
    </Select.Root>
  );
}

export const Basic: Story = {
  render: () => <BasicSelect />,
};

export const WithPlaceholder: Story = {
  render: () => <UncontrolledSelect />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <BasicSelect />
      <UncontrolledSelect />
    </View>
  ),
};
