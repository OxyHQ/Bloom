import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextField, TextFieldInput, TextFieldLabel } from './index';

const meta: Meta = {
  title: 'Components/TextField',
};

export default meta;

type Story = StoryObj;

function ControlledField({
  label,
  placeholder,
  initial = '',
  isInvalid,
  editable = true,
}: {
  label: string;
  placeholder?: string;
  initial?: string;
  isInvalid?: boolean;
  editable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 320 }}>
      <TextFieldLabel>{label}</TextFieldLabel>
      <TextField isInvalid={isInvalid}>
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
          editable={editable}
          isInvalid={isInvalid}
        />
      </TextField>
    </View>
  );
}

function FloatingField({
  label,
  initial = '',
  isInvalid,
  editable = true,
}: {
  label: string;
  initial?: string;
  isInvalid?: boolean;
  editable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 320 }}>
      <TextField isInvalid={isInvalid}>
        <TextFieldInput
          floatingLabel
          label={label}
          value={value}
          onChangeText={setValue}
          editable={editable}
          isInvalid={isInvalid}
        />
      </TextField>
    </View>
  );
}

export const Basic: Story = {
  render: () => (
    <ControlledField label="Username" placeholder="oxylander" />
  ),
};

export const WithValue: Story = {
  render: () => (
    <ControlledField label="Email" initial="nate@oxy.so" />
  ),
};

export const Error: Story = {
  render: () => (
    <ControlledField
      label="Email"
      initial="not-an-email"
      isInvalid
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <ControlledField
      label="Username"
      initial="oxylander"
      editable={false}
    />
  ),
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <ControlledField label="First name" placeholder="Ada" />
      <ControlledField label="Last name" placeholder="Lovelace" />
      <ControlledField
        label="Email"
        initial="invalid-email"
        isInvalid
      />
    </View>
  ),
};

export const FloatingLabel: Story = {
  render: () => <FloatingField label="Email" />,
};

export const FloatingLabelWithValue: Story = {
  render: () => <FloatingField label="Email" initial="nate@oxy.so" />,
};

export const FloatingLabelComposition: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <FloatingField label="Full name" />
      <FloatingField label="Email" initial="ada@oxy.so" />
      <FloatingField label="Email" initial="invalid-email" isInvalid />
    </View>
  ),
};
