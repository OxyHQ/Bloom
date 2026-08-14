import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './index';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

/** Controlled: `checked` + `onCheckedChange` are both required. */
export const Basic: Story = {
  render: function BasicStory() {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        checked={checked}
        onCheckedChange={setChecked}
        label="Email me about new sign-ins"
        testID="checkbox-basic"
      />
    );
  },
};

/** A description turns the row into a two-line control; the whole row is the hit target. */
export const WithDescription: Story = {
  render: function DescriptionStory() {
    const [checked, setChecked] = useState(true);
    return (
      <View style={{ width: 380 }}>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          label="Share usage data"
          description="Crash reports and performance timings. Never message content."
        />
      </View>
    );
  },
};

/**
 * `indeterminate` is the parent-of-a-partial-selection state. It is a VISUAL
 * state on top of `checked` — the control still reports `checked` to the caller,
 * so the parent decides what pressing it means.
 */
export const Indeterminate: Story = {
  render: function IndeterminateStory() {
    const [items, setItems] = useState([true, false, true]);
    const all = items.every(Boolean);
    const none = items.every((v) => !v);
    return (
      <View style={{ gap: 8, width: 380 }}>
        <Checkbox
          checked={all}
          indeterminate={!all && !none}
          onCheckedChange={(next) => setItems(items.map(() => next))}
          label="All notifications"
        />
        <View style={{ paddingLeft: 28, gap: 8 }}>
          {items.map((v, i) => (
            <Checkbox
              key={i}
              checked={v}
              onCheckedChange={(next) =>
                setItems(items.map((old, j) => (i === j ? next : old)))
              }
              label={['Mentions', 'Replies', 'Follows'][i]}
            />
          ))}
        </View>
      </View>
    );
  },
};

/** Sizes and the disabled state. */
export const SizesAndDisabled: Story = {
  render: function SizesStory() {
    const [checked, setChecked] = useState(true);
    return (
      <View style={{ gap: 12 }}>
        <Checkbox checked={checked} onCheckedChange={setChecked} size="small" label="Small" />
        <Checkbox checked={checked} onCheckedChange={setChecked} size="medium" label="Medium" />
        <Checkbox checked={checked} onCheckedChange={setChecked} size="large" label="Large" />
        <Checkbox checked onCheckedChange={() => {}} disabled label="Disabled, checked" />
        <Checkbox checked={false} onCheckedChange={() => {}} disabled label="Disabled, unchecked" />
      </View>
    );
  },
};
