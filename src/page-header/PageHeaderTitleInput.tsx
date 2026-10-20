import React from 'react';
import {
  TextInput as NativeTextInput,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { styled } from 'react-native-css';
import { useFieldMembership } from '../field/membership';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography/scale';
import type { PageHeaderTitleInputProps } from './types';

const TextInput: React.ComponentType<TextInputProps> = styled(
  NativeTextInput as (props: { style?: StyleProp<TextStyle> }) => React.ReactNode,
  { className: 'style' },
);

export function PageHeaderTitleInput({
  label,
  accessibilityLabel,
  nativeID,
  editable = true,
  disabled = false,
  style,
  ...props
}: PageHeaderTitleInputProps) {
  const { colors } = useTheme();
  const field = useFieldMembership({
    label,
    accessibilityLabel,
    nativeID,
    disabled: disabled || !editable,
    describedBy: props['aria-describedby'],
  });
  return (
    <TextInput
      {...props}
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-required={field.required || undefined}
      editable={!field.disabled}
      placeholderTextColor={colors.textSecondary}
      underlineColorAndroid="transparent"
      style={[
        TYPE_SCALE['title-1-bold'],
        { color: colors.text, minWidth: 0, padding: 0, borderWidth: 0 },
        style,
      ]}
    />
  );
}
