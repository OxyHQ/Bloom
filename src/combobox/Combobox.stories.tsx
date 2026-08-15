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
          testID="combobox-basic"
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

/**
 * A disabled combobox must not OPEN, and that is worth a story because the way
 * it fails is invisible from the markup: the panel lives behind the trigger, so
 * a broken `disabled` looks identical at rest and only diverges once something
 * presses it.
 *
 * The trigger is an `asChild` slot, which is what makes this delicate. Bloom's
 * `TriggerSlot` composes the child's `onPress` with its own open handler, so if
 * the guard lived only in the child's callback the open would still happen —
 * and whether anything stopped it would depend on the TYPE of element passed
 * in: a real `Pressable` swallows the press, a plain `View` does not. The guard
 * therefore reads both the family's `disabled` and the child's.
 *
 * Press both of these in a browser. Neither may open a panel.
 */
export const Disabled: Story = {
  render: () => (
    <View style={{ width: 320, padding: 40, gap: 16 }}>
      <Combobox
        testID="combobox-disabled"
        options={FRAMEWORKS}
        value={null}
        onValueChange={() => {}}
        placeholder="Pick a framework…"
        label="Framework"
        disabled
      />
      <Combobox
        testID="combobox-disabled-selected"
        options={FRAMEWORKS}
        value="svelte"
        onValueChange={() => {}}
        placeholder="Pick a framework…"
        label="Framework"
        disabled
      />
    </View>
  ),
};
