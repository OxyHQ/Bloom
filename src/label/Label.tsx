import React, { memo, useMemo } from 'react';
import { Platform } from 'react-native';

import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography';
import {
  TEXT_FIELD_LEADING_GAP,
  TEXT_FIELD_STACK_GAP,
  useTextFieldPalette,
} from '../text-field/shared';
import type { LabelProps } from './types';

/**
 * The field `Label` (`base/input/label.tsx`): `text-body-medium` in
 * `text-primary`, a `text-error-primary` asterisk 2px after it, 4px above the
 * control (the field's `gap-1`) — the same label `TextFieldLabel` draws, so a
 * `Field` and a `TextField` stack identically.
 *
 *   xs   body-2-medium    13/18
 *   sm   body-medium      14/20   (default)
 *   md   headline-medium  16/22
 */
const SIZE_VARIANT: Record<NonNullable<LabelProps['size']>, TypeScaleVariant> = {
  xs: 'body-2-medium',
  sm: 'body-medium',
  md: 'headline-medium',
};

const IS_WEB = Platform.OS === 'web';

const LabelComponent = function Label({
  children,
  nativeID,
  htmlFor,
  required = false,
  disabled = false,
  size = 'sm',
  style,
  testID,
}: LabelProps) {
  const palette = useTextFieldPalette();

  const webProps: Record<string, unknown> =
    IS_WEB ? { htmlFor: htmlFor ?? nativeID } : {};

  return (
    <Text
      {...webProps}
      variant={SIZE_VARIANT[size]}
      nativeID={nativeID}
      testID={testID}
      style={[
        {
          marginBottom: TEXT_FIELD_STACK_GAP,
          color: disabled ? palette.placeholder : palette.text,
        },
        style,
      ]}>
      {children}
      {required ? (
        <Text
          variant={SIZE_VARIANT[size]}
          accessibilityLabel="required"
          // `gap-0.5`: an inline margin on web; a nested native
          // `Text` ignores margins, so a thin space stands in for it there.
          style={[{ color: palette.error }, IS_WEB ? { marginLeft: TEXT_FIELD_LEADING_GAP } : null]}>
          {IS_WEB ? '*' : ' *'}
        </Text>
      ) : null}
    </Text>
  );
};

export const Label = memo(LabelComponent);
Label.displayName = 'Label';
