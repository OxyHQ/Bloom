import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Combobox } from './index';
import type { ComboboxOption } from './types';

const meta: Meta = {
  title: 'Forms/Combobox',
};

export default meta;

type Story = StoryObj;

const FRAMEWORKS: ComboboxOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue', description: 'The Progressive Framework' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'angular', label: 'Angular' },
  { value: 'qwik', label: 'Qwik', description: 'Resumable' },
];

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <View style={{ width: 320, padding: 40 }}>
        <Combobox
          options={FRAMEWORKS}
          value={value}
          onValueChange={setValue}
          placeholder="Pick a framework…"
          label="Framework"
        />
      </View>
    );
  },
};
