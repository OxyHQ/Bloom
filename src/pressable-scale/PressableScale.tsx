import React, { forwardRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { StyledPressable } from '../styles/styled-primitives';
import type { PressableScaleProps } from './types';
import type { RefComponent } from '../styles/native-refs';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { usePressScale } from '../motion/motion-host';
import { SCALE } from '../motion/tokens';

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

const NO_TRANSFORM: readonly Record<string, number>[] = [];

/**
 * A drop-in `Pressable` that eases to a smaller scale on press-in and back on
 * release, with Bloom's `press` motion. The scale is applied to the pressable
 * node itself, so a consumer's `className` / layout styles (e.g.
 * `flex-row items-center`) land on the same node that animates.
 *
 * Bloom's motion engine plays it: on native a press retargets one shared
 * value read by one mapper (no React render); on the web it is a class whose
 * `:active` rule scales a touch press in CSS (no JS, no Reanimated). The touch
 * target scales with the content — acceptable at the default 0.98. Honours the
 * OS "reduce motion" setting and stays still for a mouse on the web.
 */
export const PressableScale: RefComponent<PressableScaleProps> = forwardRef<
  ComponentRef<typeof View>,
  PressableScaleProps
>(function PressableScale(
  { targetScale = SCALE.pressed, className, style, onPressIn, onPressOut, ...rest },
  ref,
) {
  const reducedMotion = usePrefersReducedMotion();
  const press = usePressScale(!reducedMotion, NO_TRANSFORM, targetScale);

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      onPressIn={(e) => {
        onPressIn?.(e);
        press.onPressIn?.();
      }}
      onPressOut={(e) => {
        onPressOut?.(e);
        press.onPressOut?.();
      }}
      className={className}
      style={[press.style, style]}
      {...rest}
    />
  );
});

PressableScale.displayName = 'PressableScale';
