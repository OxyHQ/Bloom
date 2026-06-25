import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { atoms as a, tokens } from '../styles';
import type { ConnectionDotsProps } from './types';

export interface ConnectionDotsBaseProps
  extends Pick<
    ConnectionDotsProps,
    'left' | 'right' | 'accessibilityLabel' | 'className' | 'style'
  > {
  /** The platform-specific animated dots row (built by the native/web fork). */
  dots: React.ReactNode;
}

/**
 * Shared layout + accessibility chrome for {@link ConnectionDots}:
 *
 *   leftSlot · (animated ellipsis dots) · rightSlot
 *
 * The dots themselves are supplied by the platform fork (`ConnectionDots.tsx`
 * native / `ConnectionDots.web.tsx` web) because the shimmer animation impl
 * differs (Reanimated vs CSS). This base owns the row layout, the slot wrappers,
 * and the single accessibility label that stands in for the decorative dots.
 */
export function ConnectionDotsBase({
  left,
  right,
  dots,
  accessibilityLabel = 'Connecting',
  className,
  style,
}: ConnectionDotsBaseProps) {
  const rowStyle: StyleProp<ViewStyle> = [
    a.flex_row,
    a.align_center,
    a.justify_center,
    { gap: tokens.space.md },
    style,
  ];

  return (
    <View
      {...(className ? ({ className } as Record<string, string>) : {})}
      style={rowStyle}>
      <View style={[a.align_center, a.justify_center]}>{left}</View>

      {/* The dots are decorative; the whole cluster carries ONE a11y label
          (e.g. "Connecting") so screen readers announce the link relationship
          without reading each dot. The left/right slots keep their own a11y. */}
      <View
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        aria-label={accessibilityLabel}
        style={[a.flex_row, a.align_center, { gap: tokens.space.xs }]}>
        {dots}
      </View>

      <View style={[a.align_center, a.justify_center]}>{right}</View>
    </View>
  );
}
