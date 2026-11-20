import type { Edge, PaddingToken } from '../tokens';
import { resolveSpace } from '../tokens';
import { defineKeyframes, type Frame, type KeyframesValue } from './keyframes';
import type { MotionToken, ScaleName } from './tokens';
import { resolveScale } from './tokens';

/**
 * How a view arrives and leaves, as SwiftUI's `AnyTransition`: `opacity`,
 * `scale(s)`, `move(edge, distance)`, combined with `.combined(…)`, given
 * different halves with `asymmetric(insert, remove)`, and given its own motion
 * with `.animation(motion)`. Each half is keyframes, so a transition plays on
 * the same engine as `.keyframes()` (Reanimated's CSS animations on native, the
 * Web Animations API on the web); a half can also be keyframes of the app's own
 * (`asymmetric(move('top', 'xl').combined(opacity), leave)`).
 *
 * The insertion plays when the view mounts. The removal plays when the view
 * leaves a list (`items.map(…)`) it is keyed in by `.id()`: the list keeps it
 * until the removal ends.
 */
export class TransitionValue {
  constructor(
    readonly insert: KeyframesValue,
    readonly remove: KeyframesValue,
  ) {
    Object.freeze(this);
  }

  /** Both transitions at once. */
  combined(other: TransitionValue): TransitionValue {
    return new TransitionValue(this.insert.merged(other.insert), this.remove.merged(other.remove));
  }

  /** Both halves played by `motion` instead of the `.animation()` in scope. */
  animation(motion: MotionToken): TransitionValue {
    return new TransitionValue(this.insert.animation(motion), this.remove.animation(motion));
  }

  /** Whether either half changes opacity (what glass routes through its presence). */
  get fades(): boolean {
    return this.insert.fades || this.remove.fades;
  }
}

/** From the rest values to `away` and back: insertion runs away → rest, removal rest → away. */
function symmetric(rest: Omit<Frame, 'at'>, away: Omit<Frame, 'at'>): TransitionValue {
  return new TransitionValue(
    defineKeyframes([
      { at: 0, ...away },
      { at: 1, ...rest },
    ]),
    defineKeyframes([
      { at: 0, ...rest },
      { at: 1, ...away },
    ]),
  );
}

/** Fades in and out. */
export const opacity: TransitionValue = symmetric({ opacity: 1 }, { opacity: 0 });

/** Grows from, and shrinks to, a scale token (`scale('dip')`). */
export function scale(from: ScaleName): TransitionValue {
  return symmetric({ scale: 1 }, { scale: resolveScale(from) });
}

const EDGE_AXIS: Partial<Record<Edge, readonly ['translateX' | 'translateY', 1 | -1]>> = {
  top: ['translateY', -1],
  bottom: ['translateY', 1],
  leading: ['translateX', -1],
  trailing: ['translateX', 1],
};

/**
 * Slides in from, and out to, an edge, by `distance` (a space token or an app
 * token): `move('top', 'xl')` arrives from 20 px above. Leading and trailing are
 * physical left and right (a transform never mirrors).
 */
export function move(
  edge: 'top' | 'bottom' | 'leading' | 'trailing',
  distance: PaddingToken,
): TransitionValue {
  const [axis, sign] = EDGE_AXIS[edge] as readonly ['translateX' | 'translateY', 1 | -1];
  return symmetric({ [axis]: 0 }, { [axis]: sign * resolveSpace(distance) });
}

/** One transition to arrive and another (or keyframes of the app's own) to leave. */
export function asymmetric(
  insert: TransitionValue | KeyframesValue,
  remove: TransitionValue | KeyframesValue,
): TransitionValue {
  return new TransitionValue(
    insert instanceof TransitionValue ? insert.insert : insert,
    remove instanceof TransitionValue ? remove.remove : remove,
  );
}
