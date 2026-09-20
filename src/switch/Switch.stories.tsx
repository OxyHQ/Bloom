import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Switch> = {
  title: 'Base/Switch',
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
  parameters: { controls: { disable: true } },
  render: function BasicStory() {
    const [on, setOn] = useState(false);
    return <Switch
        checked={on}
        onCheckedChange={setOn}
        accessibilityLabel="Airplane mode"
        testID="switch-basic"
      />;
  },
};

/** Both sizes. `sm` is for a dense settings row; `default` for a standalone control. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: function SizesStory() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(true);
    return (
      <View style={{ gap: 16, alignItems: 'flex-start' }}>
        <Switch checked={a} onCheckedChange={setA} accessibilityLabel="Default size" />
        <Switch checked={b} onCheckedChange={setB} size="sm" accessibilityLabel="Small size" />
      </View>
    );
  },
};

/** Disabled, in both positions — the state has to stay readable, not just inert. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      <Switch checked onCheckedChange={() => {}} disabled accessibilityLabel="On, unavailable" />
      <Switch checked={false} onCheckedChange={() => {}} disabled accessibilityLabel="Off, unavailable" />
    </View>
  ),
};

/**
 * In a row. The `Switch` carries no label of its own: it is the control, and the
 * row that owns it decides what the label says and how wide the hit target is.
 */
export const InARow: Story = {
  parameters: { controls: { disable: true } },
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
        <Switch
          checked={on}
          onCheckedChange={setOn}
          accessibilityLabel="Sync over cellular"
        />
      </View>
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof Switch> = {
  args: { checked: false, disabled: false, size: 'md', tone: 'accent', accessibilityLabel: 'Airplane mode' },
  parameters: { controls: { disable: false, include: ['checked', 'disabled', 'size', 'tone', 'accessibilityLabel'] } },
  argTypes: { checked: { control: 'boolean' }, disabled: { control: 'boolean' }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] }, tone: { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] }, accessibilityLabel: { control: 'text' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><Switch {...args} onCheckedChange={next => updateArgs({ checked: next })} /></View>;
  },
};
