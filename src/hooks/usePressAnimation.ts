import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { animation } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { SUPPORTS_PRESS_SCALE } from '../styles/pointer';

/**
 * Hook that provides press-scale animation feedback.
 *
 * Returns an `Animated.Value` for the scale transform and press-in/press-out
 * handlers that spring the value between 1 and the target scale.
 *
 * THE TWO SUPPRESSION RULES LIVE HERE, not at the call sites, because this is
 * the mechanism every press-scaling family shares (`Button`, `Fab`, `Chip`,
 * `Tabs`, `Checkbox`, `FrostedIconButton`). They used to live only in
 * `PressableScale`, the mechanism with a dozen consumers rather than five — so
 * every button in the ecosystem animated straight through a user's "reduce
 * motion" setting while `PressableScale` honoured it:
 *
 * - **Reduce motion.** An OS accessibility setting, so it is a subscription and
 *   is read per-component rather than resolved once at module load.
 * - **Pointer type.** The affordance exists because a finger COVERS what it
 *   presses; under a mouse the same scale reads as jitter. Suppressed on
 *   non-touch web, native always animates.
 *
 * When either rule suppresses it, `enabled` is false and the handlers are inert
 * — `scaleAnim` stays parked at 1, so a caller can keep passing it into a
 * transform unconditionally and simply gets no movement.
 *
 * KNOWN DEFECT, pinned by `__tests__/usePressAnimation.test.tsx`: `pressScale`
 * carries a default, and a JS default parameter fires on an explicit `undefined`
 * — so the `undefined`-disables path four call sites pass for their disabled
 * state resolves to 0.97 and never disables anything. It is unreachable today
 * (each of those call sites also withholds its press handlers when disabled) and
 * closing it moves the exported signature, so it belongs to a breaking batch.
 *
 * @param pressScale - Scale value when pressed (e.g. 0.97).
 */
export function usePressAnimation(pressScale: number | undefined = 0.97) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const enabled = pressScale !== undefined && SUPPORTS_PRESS_SCALE && !reducedMotion;

  const onPressIn = useCallback(() => {
    if (pressScale === undefined || !enabled) return;
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      ...animation.spring.snappy,
    }).start();
  }, [scaleAnim, enabled, pressScale]);

  const onPressOut = useCallback(() => {
    if (!enabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      ...animation.spring.gentle,
    }).start();
  }, [scaleAnim, enabled]);

  return { scaleAnim, onPressIn, onPressOut, enabled } as const;
}
