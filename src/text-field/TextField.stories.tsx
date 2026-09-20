import { useArgs } from 'storybook/preview-api';
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
  component: TextFieldInput,
};

export default meta;

type Story = StoryObj;

function ControlledField({
  label,
  placeholder,
  initial = '',
  invalid,
  editable = true,
}: {
  label: string;
  placeholder?: string;
  initial?: string;
  invalid?: boolean;
  editable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 320, maxWidth: '100%' }}>
      <TextFieldLabel>{label}</TextFieldLabel>
      <TextField invalid={invalid}>
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onValueChange={setValue}
          editable={editable}
          invalid={invalid}
        />
      </TextField>
    </View>
  );
}

function FloatingField({
  label,
  initial = '',
  invalid,
  editable = true,
}: {
  label: string;
  initial?: string;
  invalid?: boolean;
  editable?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 320, maxWidth: '100%' }}>
      <TextField invalid={invalid}>
        <TextFieldInput
          floatingLabel
          label={label}
          value={value}
          onValueChange={setValue}
          editable={editable}
          invalid={invalid}
        />
      </TextField>
    </View>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ControlledField label="Username" placeholder="oxylander" />
  ),
};

export const WithValue: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ControlledField label="Email" initial="nate@oxy.so" />
  ),
};

export const Error: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ControlledField
      label="Email"
      initial="not-an-email"
      invalid
    />
  ),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ControlledField
      label="Username"
      initial="oxylander"
      editable={false}
    />
  ),
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 16 }}>
      <ControlledField label="First name" placeholder="Ada" />
      <ControlledField label="Last name" placeholder="Lovelace" />
      <ControlledField
        label="Email"
        initial="invalid-email"
        invalid
      />
    </View>
  ),
};

export const FloatingLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => <FloatingField label="Email" />,
};

export const FloatingLabelWithValue: Story = {
  parameters: { controls: { disable: true } },
  render: () => <FloatingField label="Email" initial="nate@oxy.so" />,
};

export const FloatingLabelComposition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 16 }}>
      <FloatingField label="Full name" />
      <FloatingField label="Email" initial="ada@oxy.so" />
      <FloatingField label="Email" initial="invalid-email" invalid />
    </View>
  ),
};

function MatrixField({
  label,
  placeholder,
  initial = '',
  size,
  invalid,
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
  invalid?: boolean;
  disabled?: boolean;
  hint?: string;
  required?: boolean;
  tooltip?: boolean;
  icons?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View style={{ width: 280, maxWidth: '100%' }} testID={`field-${label}`}>
      <TextFieldLabel required={required} tooltip={tooltip}>
        {label}
      </TextFieldLabel>
      <TextField size={size} invalid={invalid} disabled={disabled}>
        {icons ? <TextFieldIcon icon={RiMailLine} /> : null}
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onValueChange={setValue}
        />
        {icons && !disabled ? <TextFieldIcon icon={RiQuestionLine} position="trailing" /> : null}
      </TextField>
      {hint ? <TextFieldHint invalid={invalid}>{hint}</TextFieldHint> : null}
    </View>
  );
}

/** Every size and state: rest, small, icons, value, invalid, disabled. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: function MatrixStory() {
    return (
    <View style={{ backgroundColor: useTheme().colors.background, gap: 16, padding: 40 }}>
      <MatrixField label="Email" placeholder="you@oxy.so" hint="We never share it." required tooltip />
      <MatrixField label="Small" placeholder="Small" size="sm" />
      <MatrixField label="Icons" placeholder="Search" icons />
      <MatrixField label="Value" initial="nate@oxy.so" />
      <MatrixField label="Invalid" placeholder="Invalid" hint="Enter a valid email" invalid />
      <MatrixField label="Disabled" placeholder="Disabled" hint="Hint" disabled icons />
      <MatrixField label="Disabled value" initial="nate@oxy.so" disabled />
    </View>
    );
  },
};

export const Playground: StoryObj<typeof TextFieldInput> = {
  args: { label: 'Email address', placeholder: 'you@example.com', value: '', size: 'md', invalid: false, disabled: false, floatingLabel: false },
  parameters: { controls: { disable: false, include: ['label', 'placeholder', 'value', 'size', 'invalid', 'disabled', 'floatingLabel'] } },
  argTypes: { label: { control: 'text' }, placeholder: { control: 'text' }, value: { control: 'text' }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] }, invalid: { control: 'boolean' }, disabled: { control: 'boolean' }, floatingLabel: { control: 'boolean' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><TextFieldInput {...args} onValueChange={value => updateArgs({ value })} /></View>;
  },
};
