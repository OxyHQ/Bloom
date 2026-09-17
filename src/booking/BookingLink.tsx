import React, { useEffect, useMemo } from 'react';
import { Pressable, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { BOOKING_STYLE_ID, BOOKING_WEB_CSS, resolveBookingPalette } from './shared';

/**
 * INTERNAL — the family's underlined text button: a price row's label, the
 * guests panel's "Close", the bar's dates. Underlined at rest, text-secondary
 * under a pointer or a press (colour only, no scale), a focus ring on web.
 *
 * Spreads unknown props onto the `Pressable` so it can be a `PopoverTrigger`'s
 * `asChild` child, which hands it `onPress`, `aria-expanded` and
 * `aria-haspopup`.
 */
export interface BookingLinkProps {
  children: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: TypeScaleVariant;
  /** Colour at rest. Default text-primary. */
  color?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  numberOfLines?: number;
  [handleProp: string]: unknown;
}

export function BookingLink({
  children,
  onPress,
  variant = 'body-regular',
  color,
  accessibilityLabel,
  disabled,
  style,
  textStyle,
  testID,
  numberOfLines,
  ...handle
}: BookingLinkProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  useEffect(() => {
    adoptStyleSheet(BOOKING_STYLE_ID, BOOKING_WEB_CSS);
  }, []);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const ring: WebCssStyle = {
    borderRadius: 4,
    alignSelf: 'flex-start',
    '--bloom-booking-ring': palette.ring,
  };

  return (
    <Pressable
      {...handle}
      {...webDataSet({ bloomBookingFocus: '' })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: disabled === true }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[ring, style]}
    >
      <Text
        variant={variant}
        numberOfLines={numberOfLines}
        style={[
          {
            color: hovered || pressed ? palette.textSecondary : (color ?? palette.text),
            textDecorationLine: 'underline',
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
