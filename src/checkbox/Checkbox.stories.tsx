import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { Checkbox, CheckboxCard } from './index';

const meta: Meta<typeof Checkbox> = {
  title: 'Base/Checkbox',
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const noop = () => {};

/**
 * Every size against every state.
 * Hover (border / gradient lightens) needs a pointer; Tab onto a row for the
 * focus ring around the box.
 */
export const Matrix: Story = {
  render: function CheckboxMatrix() {
    const theme = useTheme();
    return (
    <View style={{ gap: 16, padding: 16, backgroundColor: theme.colors.background }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <Checkbox size={size} checked={false} onCheckedChange={noop} accessibilityLabel="Unchecked" />
          <Checkbox size={size} checked onCheckedChange={noop} accessibilityLabel="Checked" />
          <Checkbox size={size} checked={false} indeterminate onCheckedChange={noop} accessibilityLabel="Mixed" />
          <Checkbox size={size} checked={false} disabled onCheckedChange={noop} accessibilityLabel="Disabled" />
          <Checkbox size={size} checked disabled onCheckedChange={noop} accessibilityLabel="Disabled checked" />
          <Checkbox size={size} checked onCheckedChange={noop} label="Label text" />
          <Checkbox size={size} checked={false} disabled onCheckedChange={noop} label="Disabled" />
        </View>
      ))}
    </View>
    );
  },
};

/** Controlled: `checked` + `onCheckedChange` are both required. */
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
          label="Email me about new sign-ins"
        />
      </View>
    );
  },
};

/** A description turns the row into a two-line control; the whole row is the hit target. */
export const WithDescription: Story = {
  render: function DescribedCheckbox() {
    const [checked, setChecked] = useState(true);
    return (
      <View style={{ maxWidth: 360 }}>
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
 * The mixed state. `indeterminate` is the parent-of-a-partial-selection state,
 * VISUAL on top of `checked` — the control still reports `checked` to the
 * caller, so the parent decides what pressing it means. It announces as
 * `aria-checked="mixed"` and draws a rounded bar rather than a second glyph:
 * the icon set has no minus, and a rule is what the state means.
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
          label="All notifications"
        />
        <View style={{ paddingLeft: 24, gap: 8 }}>
          {items.map((checked, i) => (
            <Checkbox
              key={i}
              checked={checked}
              onCheckedChange={(next) =>
                setItems((current) => current.map((v, j) => (j === i ? next : v)))
              }
              label={['Mentions', 'Replies', 'Follows'][i]}
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
      <Checkbox checked={false} onCheckedChange={() => {}} disabled label="Disabled, unchecked" />
      <Checkbox checked onCheckedChange={() => {}} disabled label="Disabled, checked" />
    </View>
  ),
};

/**
 * No label — the case the touch target exists for. The box is 16dp; `hitSlop`
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

/**
 * `CheckboxCard`: title + description left, the box right, the whole
 * card toggles. Hover a card for the background; Tab onto one for the ring
 * around its box.
 */
export const Cards: Story = {
  render: function CheckboxCards() {
    const theme = useTheme();
    const [on, setOn] = useState({ digest: true, mentions: false, product: true });
    return (
      <View style={{ width: 400, gap: 8, padding: 16, backgroundColor: theme.colors.background }}>
        <CheckboxCard
          title="Weekly digest"
          description="A summary of activity every Monday."
          checked={on.digest}
          onCheckedChange={(v) => setOn((c) => ({ ...c, digest: v }))}
        />
        <CheckboxCard
          title="Mentions"
          description="When someone mentions you in a thread."
          checked={on.mentions}
          onCheckedChange={(v) => setOn((c) => ({ ...c, mentions: v }))}
        />
        <CheckboxCard
          title="Product updates"
          checked={on.product}
          onCheckedChange={(v) => setOn((c) => ({ ...c, product: v }))}
        />
        <CheckboxCard
          title="Billing alerts"
          description="Managed by your workspace admin."
          checked
          disabled
          onCheckedChange={noop}
        />
      </View>
    );
  },
};
