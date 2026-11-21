import { animateMotionValue, useMotionValue, type MotionValue } from '@oxy.so/bloom/motion';

import type { MotionToken } from './tokens';

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
