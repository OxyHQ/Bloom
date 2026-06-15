import React, { memo } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { atoms as a } from '../styles';
import { fontSize } from '../styles/tokens';
import type { LabelProps } from './types';

const SIZE_FONT = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  md: fontSize.md,
} as const;

/**
 * Themed form label. A thin wrapper over Bloom's `Text` that applies the
 * label typography (medium weight, secondary color) and optionally renders a
 * required marker. On web it forwards `htmlFor` so a click focuses the
 * associated control.
 */
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
  const theme = useTheme();

  const webProps: Record<string, unknown> =
    Platform.OS === 'web' ? { htmlFor: htmlFor ?? nativeID } : {};

  return (
    <Text
      {...webProps}
      nativeID={nativeID}
      testID={testID}
      style={[
        a.font_medium,
        a.mb_sm,
        {
          fontSize: SIZE_FONT[size],
          color: disabled ? theme.colors.textTertiary : theme.colors.textSecondary,
        },
        style,
      ]}>
      {children}
      {required ? (
        <Text
          accessibilityLabel="required"
          style={{ color: theme.colors.negative }}>
          {' *'}
        </Text>
      ) : null}
    </Text>
  );
};

export const Label = memo(LabelComponent);
Label.displayName = 'Label';
