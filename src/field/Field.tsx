import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Label } from '../label';
import { atoms as a } from '../styles';
import { TEXT_FIELD_STACK_GAP, resolveTextFieldPalette } from '../text-field/shared';
import type { FieldProps } from './types';

/**
 * The field stack — `Label`, the control, `HintText` — around ANY control.
 *
 * Standalone form-field wrapper: an optional `Label`, the control (passed as
 * `children`), and a description **or** error message below it. Composes
 * Bloom's `Label`. Unlike `TextField` — which bakes its label/error into the
 * input chrome — `Field` wraps any arbitrary control (a `Switch`, a
 * `SegmentedControl`, a custom picker, etc.).
 */
/** `HintText`: 4px under the control (`gap-1`) plus its own 1px `pt-px`. */
const hintStyle = { marginTop: TEXT_FIELD_STACK_GAP, paddingTop: 1 } as const;

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
  const palette = useMemo(() => resolveTextFieldPalette(theme), [theme]);
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
          variant="caption-1-medium"
          nativeID={errorID}
          accessibilityRole="alert"
          style={[hintStyle, { color: palette.error }]}>
          {error}
        </Text>
      ) : description != null ? (
        <Text
          variant="caption-1-medium"
          nativeID={descriptionID}
          style={[hintStyle, { color: disabled ? palette.placeholder : palette.hint }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
};

export const Field = memo(FieldComponent);
Field.displayName = 'Field';
