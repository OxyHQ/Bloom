import React, { memo, useMemo } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import { useInteractionState } from '../hooks/useInteractionState';
import {
  applyIconColor,
  resolveFrostedPalette,
  resolveFrostedSize,
} from './shared';
import type { FrostedIconButtonProps } from './types';

export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';

const RADIUS = 999;
const PRESS_SCALE = 0.94;
const DEFAULT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// BlurView intensity (0–100). A gentle frost so the chip reads over an image
// without smearing the content behind it. The `active` (solid) state has none.
const BLUR_INTENSITY = 24;

const FrostedIconButtonComponent: React.FC<FrostedIconButtonProps> = ({
  onPress,
  icon,
  children,
  active = false,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  accessibilityHint,
  style,
  className,
  testID,
  hitSlop,
}) => {
  const theme = useTheme();
  const geo = useMemo(() => resolveFrostedSize(size), [size]);
  const palette = useMemo(
    () => resolveFrostedPalette(theme.colors, theme.isDark),
    [theme.colors, theme.isDark],
  );

  const { scaleAnim, onPressIn: onScalePressIn, onPressOut: onScalePressOut } =
    usePressAnimation(disabled ? undefined : PRESS_SCALE);
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  const handlePressIn = disabled
    ? undefined
    : () => {
        onScalePressIn();
        onPressedIn();
      };
  const handlePressOut = disabled
    ? undefined
    : () => {
        onScalePressOut();
        onPressedOut();
      };

  const highlighted = pressed && !disabled;
  const surface = active
    ? palette.activeSurface
    : highlighted
      ? palette.surfaceHover
      : palette.surface;
  const ring = highlighted ? palette.ringHover : palette.ring;
  const iconColor = active ? palette.activeIcon : palette.icon;

  const containerStyle = useMemo((): ViewStyle => {
    return {
      width: geo.diameter,
      height: geo.diameter,
      borderRadius: RADIUS,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: ring,
      // Soft shadow lives on the (non-clipping) Pressable so it renders on iOS —
      // the blur/tint are clipped by an inner overflow:hidden layer instead.
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    };
  }, [geo.diameter, ring, palette.shadow]);

  const content = icon ?? children;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        {...(className ? ({ className } as Record<string, string>) : {})}
        style={[containerStyle, disabled && styles.disabled]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={hitSlop ?? DEFAULT_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected: active }}
        testID={testID}
      >
        {/* Clip layer: blur (frosted only) + translucent/solid tint, rounded. */}
        <View style={[StyleSheet.absoluteFill, styles.clip]}>
          {!active && (
            <BlurView
              intensity={BLUR_INTENSITY}
              tint={theme.isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: surface }]} />
        </View>
        {content != null && (
          <View
            style={{
              width: geo.iconBox,
              height: geo.iconBox,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {applyIconColor(content, iconColor)}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clip: {
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});

export const FrostedIconButton = memo(FrostedIconButtonComponent);
FrostedIconButton.displayName = 'FrostedIconButton';
