import React, { forwardRef } from 'react';
import { type View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SUPPORTS_PRESS_SCALE } from '../styles/pointer';
import { StyledPressable } from '../styles/styled-primitives';
import type { PressableScaleProps } from './types';

/** Press-in / press-out timing, in ms. */
const DURATION = 100;

/**
 * A single animated pressable, built once at module scope so the animated node
 * identity is stable across renders.
 *
 * Built from `StyledPressable`, not a bare `Pressable`: `className` is not a
 * prop react-native understands, so wrapping the raw primitive left the class
 * with no `styled()` to reach and it resolved to nothing at all — while this
 * component's own doc comment claimed a consumer's class landed on the
 * animating node. `button/Button.tsx` is the reference for the shape: ONE node,
 * so transform, visuals, `style` and `className` cannot land in different
 * places.
 */
const AnimatedPressable = Animated.createAnimatedComponent(StyledPressable);

/**
 * A drop-in `Pressable` that springs to a smaller scale on press-in and back on
 * release. The scale is applied to the pressable node itself, so a consumer's
 * `className` / layout styles (e.g. `flex-row items-center`) land on the same
 * node that animates.
 *
 * The touch target scales with the content — acceptable at the default ~0.98
 * (the earlier two-node touch-target-preservation was dropped for simplicity).
 * Honours the OS "reduce motion" setting and disables the effect on non-touch
 * web pointers.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale(
    { targetScale = 0.98, className, style, onPressIn, onPressOut, ...rest },
    ref,
  ) {
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
        className={className}
        style={[animate ? animatedStyle : null, style]}
        {...rest}
      />
    );
  },
);

PressableScale.displayName = 'PressableScale';
