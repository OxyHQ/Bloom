import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from './Field';
import { Switch } from '../switch';
import { TextFieldInput } from '../text-field';

const meta: Meta = {
  argTypes: {
    "error": { control: 'text' },
    "required": { control: 'boolean' },
    "disabled": { control: 'boolean' }
  },
  component: Field,
  title: 'Base/Field',
};

export default meta;

type Story = StoryObj;

export const WithInput: Story = {
  args: { label: 'Username', description: 'Choose a unique handle.', required: true, disabled: false, error: '' },
  parameters: { controls: { include: ["label","description","required","disabled","error"] } },
  render: (args) => {
    const [v, setV] = useState('');
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <Field {...args}>
          <TextFieldInput label="Username" value={v} onValueChange={setV} placeholder="ada" />
        </Field>
      </View>
    );
  },
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [v, setV] = useState('not-an-email');
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <Field label="Email" error="Enter a valid email address.">
          <TextFieldInput label="Email" value={v} onValueChange={setV} invalid />
        </Field>
      </View>
    );
  },
};

export const WrappingAControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <Field label="Notifications" description="Email me about account activity.">
          <Switch checked={on} onCheckedChange={setOn} accessibilityLabel="Notifications" />
        </Field>
      </View>
    );
  },
};
