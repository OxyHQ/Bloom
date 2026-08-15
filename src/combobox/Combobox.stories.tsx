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
 * A disabled combobox must not OPEN. The trigger is an `asChild` slot, and
 * `TriggerSlot` composes the child's `onPress` with its own open handler — so a
 * guard living only in the child's callback does not stop the open. What stops
 * it then is the TYPE of element the caller passed, which is not a guard at
 * all: a real `Pressable` swallows the press, a plain `View` or a custom control
 * that forwards `onPress` does not. `cloneTrigger` therefore reads both the
 * family's `disabled` and the child's.
 *
 * THIS STORY DOES NOT GATE THAT, and the reason is worth knowing before
 * trusting it. Measured in real Chrome with trusted input: with the guard
 * removed, these two still stay closed, because react-native-web's own
 * `Pressable` swallows the press first. The instrument that CAN see the
 * regression is jest — its `Pressable` mock ignores `disabled`, so the composed
 * handler runs and `Combobox.test.tsx` goes red. The usual asymmetry is
 * inverted here: the mock is the sharper tool, and the browser agrees with a
 * broken build. Reachable in production only through a non-`Pressable` child.
 *
 * So what these two are for is the visual state — a disabled control still has
 * to read as disabled, with and without a selected value.
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
