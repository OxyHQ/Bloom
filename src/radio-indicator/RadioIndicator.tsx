import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { ACCENT_TABLE, BUTTON_SHADOW, colorRamp, resolveButtonRamps } from '../button/shared';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import type { WebCssStyle } from '../styles/web-view-style';
import type { RadioIndicatorProps } from './types';

/**
 * `RadioDot`. Geometry is fixed at 16px and scales with `size`; colours are
 * Bloom's theme through the accent recipe (`button/shared.ts`).
 *
 *   size 16 (md)   inner dot 6, border 1
 *   size 14 (sm)   inner dot 5, border 0.875
 *
 *   unselected   surface fill, neutral-300 border (dark: neutral-800 fill,
 *                neutral-700 border), shadow-xs
 *   selected     accent-500 → accent-600 gradient, inset accent-500 edge and a
 *                white/25% top highlight, light inner dot
 *
 * Select and deselect animate: the two surfaces are stacked layers
 * cross-fading over 200ms (a gradient cannot transition directly), and the
 * inner dot scales and fades with them.
 */

/** `size-4` — the `md` dot. */
const DEFAULT_SIZE = 16;

/** `transition-opacity duration-200 ease`. */
const TRANSITION_MS = 200;

const IS_WEB = Platform.OS === 'web';

/**
 * CSS `ease` — `cubic-bezier(0.25, 0.1, 0.25, 1)` — solved for `x` by Newton's
 * method. Written out rather than `Easing.bezier` so the curve is exactly the
 * web one on every platform.
 */
function cssEase(t: number): number {
  const x1 = 0.25;
  const y1 = 0.1;
  const x2 = 0.25;
  const y2 = 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * u + bx) * u + cx) * u - t;
    const dx = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(x) < 1e-5 || dx === 0) break;
    u -= x / dx;
  }
  return ((ay * u + by) * u + cy) * u;
}

function gradientStyle(top: string, bottom: string): WebCssStyle {
  const image = `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

const RadioIndicatorComponent: React.FC<RadioIndicatorProps> = ({
  selected,
  size = DEFAULT_SIZE,
  selectedColor,
  borderColor,
  style,
  testID,
}) => {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: TRANSITION_MS,
      easing: cssEase,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start();
  }, [selected, progress]);

  const paint = useMemo(() => {
    const { accent, neutral: n } = resolveButtonRamps(theme);
    const ramp = selectedColor ? colorRamp(selectedColor, ACCENT_TABLE) : accent;
    const dark = theme.isDark;
    // The hairlines are 1px at 16 and 0.875px at 14: they scale.
    const unit = size / DEFAULT_SIZE;
    return {
      surface: dark ? n[800] : theme.colors.card,
      border: borderColor ?? (dark ? n[700] : n[300]),
      borderWidth: unit,
      shadow: BUTTON_SHADOW[dark ? 'dark' : 'light'],
      top: ramp[500],
      bottom: ramp[600],
      selectedShadow: `inset 0 0 0 ${unit}px ${ramp[500]}, inset 0 ${2 * unit}px 0 0 rgba(255, 255, 255, 0.25)`,
      // The dot sits on the accent. On the theme primary it takes the preset's
      // readable foreground (white on blue, dark on yellow); a caller colour
      // falls back to white, since Bloom cannot know its contrast.
      dot: selectedColor == null ? theme.colors.primaryForeground : '#FFFFFF',
    };
  }, [theme, selectedColor, borderColor, size]);

  // `size-1.5` in a `size-4` and `size-[5px]` in a `size-3.5`.
  const dotSize = Math.round(size * 0.375);
  const radius = size / 2;

  return (
    <View
      testID={testID}
      style={[{ width: size, height: size, borderRadius: radius, flexShrink: 0 }, style]}
    >
      {/* Default surface. */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: paint.borderWidth,
            borderColor: paint.border,
            backgroundColor: paint.surface,
            boxShadow: paint.shadow,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      />
      {/* Selected gradient surface. */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            boxShadow: paint.selectedShadow,
            opacity: progress,
          },
          gradientStyle(paint.top, paint.bottom),
        ]}
      />
      {/* Inner dot, absolutely centred — flex centring of a fractional size
          can land on a subpixel. No drop shadow: a downward shadow reads as
          the dot sitting below centre. */}
      <Animated.View
        style={{
          position: 'absolute',
          top: (size - dotSize) / 2,
          left: (size - dotSize) / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: paint.dot,
          opacity: progress,
          transform: [{ scale: progress }],
        }}
      />
    </View>
  );
};

export const RadioIndicator = memo(RadioIndicatorComponent);
RadioIndicator.displayName = 'RadioIndicator';
