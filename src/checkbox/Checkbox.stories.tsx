import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { Checkbox } from './index';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Basic: Story = {
  render: function BasicCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <View style={{ gap: 12 }}>
        <Text>checked: {String(checked)}</Text>
        <Checkbox
          testID="checkbox-basic"
          checked={checked}
          onCheckedChange={setChecked}
          label="Remember me"
        />
      </View>
    );
  },
};

export const WithDescription: Story = {
  render: function DescribedCheckbox() {
    const [checked, setChecked] = useState(true);
    return (
      <View style={{ maxWidth: 360 }}>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          label="Email notifications"
          description="Get a message when someone replies to you or mentions your handle."
        />
      </View>
    );
  },
};

export const Sizes: Story = {
  render: function SizedCheckboxes() {
    const [checked, setChecked] = useState(true);
    return (
      <View style={{ gap: 12 }}>
        <Checkbox checked={checked} onCheckedChange={setChecked} size="small" label="Small" />
        <Checkbox checked={checked} onCheckedChange={setChecked} size="medium" label="Medium" />
        <Checkbox checked={checked} onCheckedChange={setChecked} size="large" label="Large" />
      </View>
    );
  },
};

/**
 * The mixed state. It announces as `aria-checked="mixed"` and draws a rounded
 * bar rather than a second glyph — the icon set has no minus, and a rule is
 * what the state means.
 */
export const Indeterminate: Story = {
  render: function IndeterminateCheckbox() {
    const [items, setItems] = useState([true, false, true]);
    const allChecked = items.every(Boolean);
    const someChecked = items.some(Boolean);
    return (
      <View style={{ gap: 8 }}>
        <Checkbox
          checked={allChecked}
          indeterminate={!allChecked && someChecked}
          onCheckedChange={(next) => setItems(items.map(() => next))}
          label="Select all"
        />
        <View style={{ paddingLeft: 24, gap: 8 }}>
          {items.map((checked, i) => (
            <Checkbox
              key={i}
              checked={checked}
              onCheckedChange={(next) =>
                setItems((current) => current.map((v, j) => (j === i ? next : v)))
              }
              label={`Item ${i + 1}`}
            />
          ))}
        </View>
      </View>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Checkbox checked={false} onCheckedChange={() => {}} disabled label="Disabled" />
      <Checkbox checked onCheckedChange={() => {}} disabled label="Disabled and checked" />
    </View>
  ),
};

/**
 * No label — the case the touch target exists for. The box is 22dp; `hitSlop`
 * grows the pressable to 44dp without growing the drawing. Tab onto one in a
 * browser to see the `:focus-visible` ring.
 */
export const Bare: Story = {
  render: function BareCheckboxes() {
    const [checked, setChecked] = useState([false, true, false]);
    return (
      <View style={{ flexDirection: 'row', gap: 24 }}>
        {checked.map((value, i) => (
          <Checkbox
            key={i}
            testID={`checkbox-bare-${i}`}
            checked={value}
            onCheckedChange={(next) =>
              setChecked((current) => current.map((v, j) => (j === i ? next : v)))
            }
            accessibilityLabel={`Option ${i + 1}`}
          />
        ))}
      </View>
    );
  },
};
