import {
  asymmetricTransition,
  moveTransition,
  opacityTransition,
  scaleTransition,
  TransitionValue,
  type KeyframesValue,
} from '@oxy.so/bloom/motion';

import { resolveSpace, type PaddingToken } from '../tokens';
import { resolveScale, type ScaleName } from './tokens';

export { TransitionValue };

/**
 * How a view arrives and leaves, as SwiftUI's `AnyTransition`, on Bloom's
 * motion engine: `opacity`, `scale(s)`, `move(edge, distance)`, combined with
 * `.combined(…)`, given different halves with `asymmetric(insert, remove)`,
 * and given their own motion with `.animation(motion)`. The insertion plays
 * when the view mounts; the removal when it leaves a list (`items.map(…)`) it
 * is keyed in by `.id()`, which keeps it until the removal ends.
 */
export const opacity: TransitionValue = opacityTransition;

/** Grows from, and shrinks to, a scale token (`scale('dip')`). */
export function scale(from: ScaleName): TransitionValue {
  return scaleTransition(resolveScale(from));
}

/**
 * Slides in from, and out to, an edge, by a space token (`move('top', 'xl')`
 * arrives from 20 px above). Leading and trailing are physical left and right:
 * a transform never mirrors.
 */
export function move(
  edge: 'top' | 'bottom' | 'leading' | 'trailing',
  distance: PaddingToken,
): TransitionValue {
  return moveTransition(edge, resolveSpace(distance));
}

/** One transition to arrive and another (or keyframes of the app's own) to leave. */
export function asymmetric(
  insert: TransitionValue | KeyframesValue,
  remove: TransitionValue | KeyframesValue,
): TransitionValue {
  return asymmetricTransition(insert, remove);
}
