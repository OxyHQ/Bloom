import React from 'react';
import type { GestureResponderEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { Button } from '../button';
import type { TypeScaleVariant } from '../typography/scale';

/**
 * INTERNAL — the family's underlined text button: a price row's label, the
 * guests panel's "Close", the bar's dates.
 *
 * It is `Button variant="link"` with the READING tone and the underline at rest
 * (`linkTone="text"`, `underline="rest"`), which is exactly what it hand-rolled
 * before those two props existed: text-primary and underlined at rest,
 * text-secondary under a pointer or a press (colour only, no scale), a focus
 * ring on web. This wrapper survives only to keep the family's own spelling —
 * `variant` is the TYPE RAMP STEP here, not the button variant.
 *
 * Spreads unknown props onto the `Button` so it can be a `PopoverTrigger`'s
 * `asChild` child, which hands it `onPress`, `aria-expanded` and
 * `aria-haspopup` — all three of which `Button` forwards.
 */
export interface BookingLinkProps {
  children: string;
  onPress?: (event?: GestureResponderEvent) => void;
  variant?: TypeScaleVariant;
  /** Colour at rest. Default text-primary (and then the hover colour works). */
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
  return (
    <Button
      {...handle}
      variant="link"
      linkTone="text"
      underline="rest"
      size="small"
      textVariant={variant}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? children}
      style={[{ alignSelf: 'flex-start' }, style]}
      textStyle={color ? [{ color }, textStyle] : textStyle}
      numberOfLines={numberOfLines}
      testID={testID}
    >
      {children}
    </Button>
  );
}
