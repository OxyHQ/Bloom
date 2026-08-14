import React, { forwardRef } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SUPPORTS_PRESS_SCALE } from '../styles/pointer';

/** Press-in / press-out timing, in ms. */
const DURATION = 100;

/**
 * A single animated `Pressable`, built once at module scope so the animated
 * node identity is stable across renders.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Scale applied while pressed. Defaults to `0.98`. */
  targetScale?: number;
  /** Style applied to the pressable itself — the node that scales. */
  style?: StyleProp<ViewStyle>;
}

/**
 * A drop-in {@link Pressable} that springs to a smaller scale on press-in and
 * back on release. The scale is applied to the pressable node itself, so a
 * consumer's `className` / layout styles (e.g. `flex-row items-center`) land on
 * the same node that animates.
 *
 * The touch target scales with the content — acceptable at the default ~0.98
 * (the earlier two-node touch-target-preservation was dropped for simplicity).
 * Honours the OS "reduce motion" setting and disables the effect on non-touch
 * web pointers.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale({ targetScale = 0.98, style, onPressIn, onPressOut, ...rest }, ref) {
    const reducedMotion = useReducedMotion();
    const animate = SUPPORTS_PRESS_SCALE && !reducedMotion;

    const scale = useSharedValue(1);

    // `scale` MUST be in the deps array: on web without the worklets Babel
    // plugin, useAnimatedStyle does not auto-track shared-value reads and would
    // freeze at frame 1. Native (plugin present) auto-tracks and ignores the dep.
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }), [scale]);

    return (
      <AnimatedPressable
        ref={ref}
        accessibilityRole="button"
        onPressIn={(e) => {
          onPressIn?.(e);
          if (!animate) return;
          cancelAnimation(scale);
          scale.value = withTiming(targetScale, { duration: DURATION });
        }}
        onPressOut={(e) => {
          onPressOut?.(e);
          if (!animate) return;
          cancelAnimation(scale);
          scale.value = withTiming(1, { duration: DURATION });
        }}
        style={[animate ? animatedStyle : null, style]}
        {...rest}
      />
    );
  },
);

PressableScale.displayName = 'PressableScale';
