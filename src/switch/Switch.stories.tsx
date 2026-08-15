import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Switch> = {
  title: 'Forms/Switch',
  component: Switch,
};

export default meta;

type Story = StoryObj<typeof Switch>;

/**
 * A switch applies its change IMMEDIATELY — that is the difference from a
 * checkbox, which is normally read on submit. If the change needs confirming,
 * the control is wrong, not the copy.
 */
export const Basic: Story = {
  render: function BasicStory() {
    const [on, setOn] = useState(false);
    return <Switch value={on} onValueChange={setOn} testID="switch-basic" />;
  },
};

/** Both sizes. `sm` is for a dense settings row; `default` for a standalone control. */
export const Sizes: Story = {
  render: function SizesStory() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(true);
    return (
      <View style={{ gap: 16, alignItems: 'flex-start' }}>
        <Switch value={a} onValueChange={setA} />
        <Switch value={b} onValueChange={setB} size="sm" />
      </View>
    );
  },
};

/** Disabled, in both positions — the state has to stay readable, not just inert. */
export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      <Switch value onValueChange={() => {}} disabled />
      <Switch value={false} onValueChange={() => {}} disabled />
    </View>
  ),
};

/**
 * In a row. The `Switch` carries no label of its own: it is the control, and the
 * row that owns it decides what the label says and how wide the hit target is.
 */
export const InARow: Story = {
  render: function RowStory() {
    const [on, setOn] = useState(true);
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 320,
        }}
      >
        <Text>Sync over cellular</Text>
        <Switch value={on} onValueChange={setOn} />
      </View>
    );
  },
};
