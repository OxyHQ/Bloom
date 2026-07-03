import React, { forwardRef } from 'react';
import {
  Platform,
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

/** Press-in / press-out timing, in ms. */
const DURATION = 100;

/**
 * True on touch-capable web browsers (coarse pointer). The press-scale
 * affordance only makes sense where a finger obscures the element — with a
 * mouse it reads as jitter — so it is disabled on non-touch web, matching the
 * native / web-touch behaviour.
 */
const IS_WEB_TOUCH_DEVICE =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

const SCALE_SUPPORTED = Platform.OS !== 'web' || IS_WEB_TOUCH_DEVICE;

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
    const animate = SCALE_SUPPORTED && !reducedMotion;

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

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
