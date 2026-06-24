import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from './Field';
import { Switch } from '../switch';
import { TextFieldInput } from '../text-field';

const meta: Meta = {
  title: 'Forms/Field',
};

export default meta;

type Story = StoryObj;

export const WithInput: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ width: 360 }}>
        <Field label="Username" description="Choose a unique handle." required>
          <TextFieldInput label="Username" value={v} onChangeText={setV} placeholder="ada" />
        </Field>
      </View>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [v, setV] = useState('not-an-email');
    return (
      <View style={{ width: 360 }}>
        <Field label="Email" error="Enter a valid email address.">
          <TextFieldInput label="Email" value={v} onChangeText={setV} isInvalid />
        </Field>
      </View>
    );
  },
};

export const WrappingAControl: Story = {
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <View style={{ width: 360 }}>
        <Field label="Notifications" description="Email me about account activity.">
          <Switch value={on} onValueChange={setOn} />
        </Field>
      </View>
    );
  },
};
