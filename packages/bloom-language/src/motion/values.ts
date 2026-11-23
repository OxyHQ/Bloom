import { useMemo, useRef } from 'react';
import {
  animateMotionValue,
  useDerivedMotionValue,
  useMotionValue,
  type MotionValue,
} from '@oxy.so/bloom/motion';

import type { MotionToken } from './tokens';
import { SEE } from '../docs';

/**
 * Bloom's motion values, as the language binds them: a number a gesture
 * drives (`.drag()`) and a view follows (`.offset({ y })`, `.scale(s)`,
 * `.rotation(r)`). Native: a Reanimated shared value; web: the views restyle
 * directly. Apps never write a worklet.
 */
export { useMotionValue };
export type { MotionValue };

/**
 * Moves `value` to `target` with a motion token or spec, from where it is: a
 * spring keeps its physics.
 * `onEnd` runs when it lands.
 */
export function animate(
  value: MotionValue,
  target: number,
  motion: MotionToken,
  onEnd?: () => void,
): void {
  animateMotionValue(value, target, motion, false, onEnd);
}

/** The same list while its numbers are the same, so what is made from it is made once. */
function useSameNumbers(list: readonly number[]): readonly number[] {
  const last = useRef(list);
  const same =
    last.current.length === list.length && last.current.every((n, i) => Object.is(n, list[i]));
  if (!same) last.current = list;
  return last.current;
}

/** Where `value` falls on `input` (ascending), carried to `output`; held at the ends. */
function across(value: number, input: readonly number[], output: readonly number[]): number {
  'worklet';
  const last = input.length - 1;
  if (value <= (input[0] as number)) return output[0] as number;
  if (value >= (input[last] as number)) return output[last] as number;
  let i = 1;
  while (value > (input[i] as number)) i++;
  const from = input[i - 1] as number;
  const to = input[i] as number;
  const share = to === from ? 1 : (value - from) / (to - from);
  const low = output[i - 1] as number;
  return low + ((output[i] as number) - low) * share;
}

/**
 * A `MotionValue` that follows `value` through a range: where `value` falls
 * on `input` (ascending), the mapped value falls on `output`, piece by piece
 * and held at the ends (`useMappedValue(y, [0, 300], [1, 0.9])` shrinks a
 * sheet as it is dragged down). Bind it like any value (`.scale(s)`,
 * `.offset({ y })`); nothing writes it, so it is never a gesture's value.
 * Native: it is worked out on the UI thread in the frame its input moves, with
 * no JS per frame. Web: it is written with its input, and eases with the
 * input's own animation.
 */
export function useMappedValue(
  value: MotionValue,
  input: readonly number[],
  output: readonly number[],
): MotionValue {
  if (input.length < 2 || input.length !== output.length) {
    throw new Error(
      `bloom-language: useMappedValue takes two ranges of the same length, at least 2. See ${SEE.animation}`,
    );
  }
  const from = useSameNumbers(input);
  const to = useSameNumbers(output);
  const derive = useMemo(
    () => (current: number) => {
      'worklet';
      return across(current, from, to);
    },
    [from, to],
  );
  return useDerivedMotionValue([value], derive);
}
