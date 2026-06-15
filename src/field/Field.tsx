import React, { memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Label } from '../label';
import { atoms as a } from '../styles';
import { fontSize, space } from '../styles/tokens';
import type { FieldProps } from './types';

/**
 * Standalone form-field wrapper: an optional `Label`, the control (passed as
 * `children`), and a description **or** error message below it. Composes
 * Bloom's `Label`. Unlike `TextField` — which bakes its label/error into the
 * input chrome — `Field` wraps any arbitrary control (a `Switch`, a
 * `SegmentedControl`, a custom picker, etc.).
 */
const FieldComponent = function Field({
  children,
  label,
  description,
  error,
  required = false,
  disabled = false,
  nativeID,
  style,
  testID,
}: FieldProps) {
  const theme = useTheme();
  const hasError = typeof error === 'string' && error.length > 0;
  const descriptionID = nativeID ? `${nativeID}-description` : undefined;
  const errorID = nativeID ? `${nativeID}-error` : undefined;

  return (
    <View style={[a.w_full, style]} testID={testID}>
      {label != null ? (
        <Label htmlFor={nativeID} required={required} disabled={disabled}>
          {label}
        </Label>
      ) : null}

      {children}

      {hasError ? (
        <Text
          nativeID={errorID}
          accessibilityRole="alert"
          style={[
            {
              fontSize: fontSize.sm,
              color: theme.colors.negative,
              marginTop: space.xs,
            },
          ]}>
          {error}
        </Text>
      ) : description != null ? (
        <Text
          nativeID={descriptionID}
          style={[
            {
              fontSize: fontSize.sm,
              color: disabled
                ? theme.colors.textTertiary
                : theme.colors.textSecondary,
              marginTop: space.xs,
            },
          ]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
};

export const Field = memo(FieldComponent);
Field.displayName = 'Field';
