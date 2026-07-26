/**
 * Bloom-original — drives a shared value toward a plain-JS target.
 *
 * WHY THIS IS IMPERATIVE, AND MUST STAY THAT WAY.
 *
 * The obvious shape is `useDerivedValue(() => withTiming(target))`, which is what
 * sonner-native does for both the stack offset and the stack scale. Returning an
 * animation from a mapper does not tick on WEB (`~/Oxy/AGENTS.md`, reanimated web
 * failure mode A): the value jumps to or freezes at a static frame, so the stack
 * lands on the right numbers without ever animating. The pattern that works on
 * every platform is to assign the animation from JS — `sv.value = withTiming(…)`
 * — and to let `useAnimatedStyle` only READ shared values.
 *
 * A `useAnimatedReaction` keyed on the target would also fire (without the
 * worklets plugin its inputs come from its own deps array, so keying it on a JS
 * value works where keying it on a shared value would not), but a layout effect
 * needs no reanimated machinery at all to be correct, so it is the smaller bet.
 * It runs before paint, so a target change never shows a stale frame first.
 * Precedent for the imperative drive: `bottom-sheet/BottomSheetBase.tsx`.
 *
 * By default the first render is seeded rather than animated: a row must appear
 * AT its position, not fly in from zero. Pass `from` when the FIRST render is
 * itself the animation — the value is then seeded at `from` and animated to
 * `target` on mount. That is how the enter animation is driven; see the
 * "Bloom owns the enter animation" note in `animations.ts`.
 */
import { useLayoutEffect, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  type EasingFunctionFactory,
  type SharedValue,
} from 'react-native-reanimated';

export function useAnimatedTarget(
  target: number,
  {
    duration,
    easing,
    from,
  }: {
    duration: number;
    easing: EasingFunctionFactory | ((value: number) => number);
    from?: number;
  },
): SharedValue<number> {
  const value = useSharedValue(from ?? target);
  const isSeeded = useRef(false);

  useLayoutEffect(() => {
    if (!isSeeded.current) {
      isSeeded.current = true;
      if (from === undefined) {
        return;
      }
    }
    value.value = withTiming(target, { duration, easing });
  }, [target, value, duration, easing, from]);

  return value;
}
