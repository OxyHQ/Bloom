import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
} from './index';

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
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="Pick a fruit" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

function UncontrolledSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="No fruit selected" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
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
