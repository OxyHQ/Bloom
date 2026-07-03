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

export interface PressableScaleProps
  extends Omit<PressableProps, 'children' | 'style'> {
  /** Scale applied while pressed. Defaults to `0.98`. */
  targetScale?: number;
  /** Style for the outer, full-size touch target (stays put while pressing). */
  style?: StyleProp<ViewStyle>;
  /** Style for the inner content wrapper that actually scales. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A drop-in {@link Pressable} whose content springs to a smaller scale on
 * press-in and back on release. The outer pressable stays full size (so the
 * touch target never shrinks) while an inner wrapper scales.
 *
 * Honours the OS "reduce motion" setting and disables the effect on non-touch
 * web pointers.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale(
    {
      targetScale = 0.98,
      style,
      contentContainerStyle,
      children,
      onPressIn,
      onPressOut,
      ...rest
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const animate = SCALE_SUPPORTED && !reducedMotion;

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Pressable
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
        style={style}
        {...rest}
      >
        <Animated.View style={[animate ? animatedStyle : null, contentContainerStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  },
);

PressableScale.displayName = 'PressableScale';
