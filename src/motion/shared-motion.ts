import { Easing, runOnJS, withTiming, type SharedValue } from 'react-native-reanimated';

import type { MotionLike } from './keyframes';
import { animateWithSpec, type MotionSpec } from './spec';
import type { Curve, Timing } from './timing';
import { MOTION } from './tokens';

/**
 * How a motion plays on a Reanimated shared value: every native motion value's,
 * and a web motion value's over a shared value (`useMotionValueOf`). Callable
 * from a gesture's callbacks (a worklet).
 */

function easingOf(curve: Curve) {
  'worklet';
  if (curve.kind === 'bezier') {
    return Easing.bezier(curve.points[0], curve.points[1], curve.points[2], curve.points[3]);
  }
  const points = curve.points;
  return (fraction: number) => {
    'worklet';
    const at = Math.min(Math.max(fraction, 0), 1) * (points.length - 1);
    const index = Math.min(Math.floor(at), points.length - 2);
    const from = points[index] as number;
    return from + ((points[index + 1] as number) - from) * (at - index);
  };
}

/**
 * Eases `shared` to `target` from where it is: a spec's spring keeps its
 * physics and starts at `velocity`; a timing plays its curve. Reduced motion
 * lands at once. `onEnd` runs on the JS thread when it lands.
 */
export function animateShared(
  shared: SharedValue<number>,
  target: number,
  motion: MotionLike | Timing,
  reducedMotion: boolean,
  onEnd: (() => void) | undefined,
  velocity: number,
): void {
  'worklet';
  const settled = onEnd
    ? (finished: boolean | undefined) => {
        'worklet';
        if (finished) runOnJS(onEnd)();
      }
    : undefined;
  if (typeof motion === 'object' && 'curve' in motion) {
    if (reducedMotion) {
      shared.value = target;
      if (settled) settled(true);
      return;
    }
    shared.value = withTiming(
      target,
      { duration: motion.duration, easing: easingOf(motion.curve) },
      settled,
    );
    return;
  }
  const spec: MotionSpec = typeof motion === 'string' ? MOTION[motion] : motion;
  animateWithSpec(shared, target, spec, reducedMotion, settled, velocity);
}
