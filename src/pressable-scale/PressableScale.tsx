import React, { forwardRef, type ComponentRef } from 'react';
import { Pressable, type View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { PressableScaleProps } from './types';
import type { RefComponent } from '../styles/native-refs';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { usePressScale } from '../motion/motion-host';
import { SCALE } from '../motion/tokens';

/**
 * A single animated pressable, built once at module scope so the animated node
 * identity is stable across renders. ONE node, as in `button/Button.tsx`, so the
 * transform, the visuals and `style` cannot land in different places.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NO_TRANSFORM: readonly Record<string, number>[] = [];

/**
 * A drop-in `Pressable` that eases to a smaller scale on press-in and back on
 * release, with Bloom's `press` motion. The scale is applied to the pressable
 * node itself, so a consumer's layout styles (a row, its padding) land on the
 * same node that animates.
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
  { targetScale = SCALE.pressed, style, onPressIn, onPressOut, ...rest },
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
      style={[press.style, style]}
      {...rest}
    />
  );
});

PressableScale.displayName = 'PressableScale';
