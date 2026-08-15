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
 * the mechanism all SEVEN press-scaling families share (`Button`, `Fab`, `Chip`,
 * `Tabs`, `Checkbox`, `Radio`, `FrostedIconButton`). They used to live only in
 * `PressableScale`, the mechanism with a dozen consumers rather than seven — so
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
 * `pressScale` is REQUIRED and takes `undefined` to mean "no press animation" —
 * which is how `Button`, `Fab`, `FrostedIconButton` and `Checkbox` express their
 * disabled state. It used to carry a `= 0.97` default, and a JS default
 * parameter fires on an EXPLICIT `undefined`, so that documented escape hatch
 * resolved to 0.97 and disabled nothing. Latent rather than live — each of those
 * call sites also withholds its press handlers when disabled, so the hook was
 * never driven — but the default is gone rather than papered over, and every
 * caller already passes an argument. Do not reintroduce it: a default and an
 * `undefined`-means-off parameter cannot coexist.
 *
 * HOW FAR it shrinks is not this module's decision and is not a per-caller one
 * either: every family passes `animation.pressScale`, the single token in
 * `styles/tokens.ts`. It lives there rather than here because the raw-DOM web
 * forks read the same number and must not import react-native to get it.
 *
 * @param pressScale - Scale value when pressed (`animation.pressScale`), or
 *   `undefined` for none.
 */
export function usePressAnimation(pressScale: number | undefined) {
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
