import React from 'react';
import {
  TextInput as NativeTextInput,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { styled } from 'react-native-css';
import { useFieldMembership } from '../field/membership';
import { useThemePaint } from '../theme/use-theme-paint';
import { TYPE_SCALE } from '../typography/scale';
import { IS_WEB } from '../styles/platform';
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
  multiline = true,
  numberOfLines = 1,
  scrollEnabled = false,
  style,
  ...props
}: PageHeaderTitleInputProps) {
  const colors = useThemePaint();
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
      multiline={multiline}
      numberOfLines={numberOfLines}
      scrollEnabled={scrollEnabled}
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
        // Native multiline inputs grow intrinsically. Web's default textarea
        // reserves two rows and then scrolls unless field sizing owns its height.
        multiline && { minHeight: TYPE_SCALE['title-1-bold'].lineHeight, textAlignVertical: 'top' },
        IS_WEB && multiline
          ? ({ fieldSizing: 'content', resize: 'none', overflow: 'hidden' } as TextStyle & {
              fieldSizing: 'content';
              resize: 'none';
            })
          : undefined,
        style,
      ]}
    />
  );
}
