import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';

import { RiMailLine, RiQuestionLine } from '../icons/remix';
import {
  TextField,
  TextFieldHint,
  TextFieldIcon,
  TextFieldInput,
  TextFieldLabel,
  type TextFieldSize,
} from './index';

const meta: Meta = {
  title: 'Base/Input',
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

function MatrixField({
  label,
  placeholder,
  initial = '',
  size,
  isInvalid,
  disabled,
  hint,
  required,
  tooltip,
  icons,
}: {
  label: string;
  placeholder?: string;
  initial?: string;
  size?: TextFieldSize;
  isInvalid?: boolean;
  disabled?: boolean;
  hint?: string;
  required?: boolean;
  tooltip?: boolean;
  icons?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 280 }} testID={`field-${label}`}>
      <TextFieldLabel required={required} tooltip={tooltip}>
        {label}
      </TextFieldLabel>
      <TextField size={size} isInvalid={isInvalid} disabled={disabled}>
        {icons ? <TextFieldIcon icon={RiMailLine} /> : null}
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
        />
        {icons && !disabled ? <TextFieldIcon icon={RiQuestionLine} position="trailing" /> : null}
      </TextField>
      {hint ? <TextFieldHint isInvalid={isInvalid}>{hint}</TextFieldHint> : null}
    </View>
  );
}

/** Every size and state: rest, small, icons, value, invalid, disabled. */
export const Matrix: Story = {
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, gap: 16, padding: 40 }}>
      <MatrixField label="Email" placeholder="you@oxy.so" hint="We never share it." required tooltip />
      <MatrixField label="Small" placeholder="Small" size="small" />
      <MatrixField label="Icons" placeholder="Search" icons />
      <MatrixField label="Value" initial="nate@oxy.so" />
      <MatrixField label="Invalid" placeholder="Invalid" hint="Enter a valid email" isInvalid />
      <MatrixField label="Disabled" placeholder="Disabled" hint="Hint" disabled icons />
      <MatrixField label="Disabled value" initial="nate@oxy.so" disabled />
    </View>
    );
  },
};
