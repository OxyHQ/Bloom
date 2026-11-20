import { defineKeyframes, type Keyframe, type KeyframesValue, type MotionLike } from './keyframes';

/**
 * How a view arrives and leaves, as SwiftUI's `AnyTransition`: each half is
 * keyframes, so a transition plays on the same engine as any keyframes. The
 * insertion plays when the view mounts; the removal while a `Presence` keeps
 * the view after it left.
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

  /** Both halves played by `motion`. */
  animation(motion: MotionLike): TransitionValue {
    return new TransitionValue(this.insert.animation(motion), this.remove.animation(motion));
  }

  get fades(): boolean {
    return this.insert.fades || this.remove.fades;
  }
}

type Values = Omit<Keyframe, 'at' | 'easing'>;

/** From `away` to `rest` on the way in, and back on the way out. */
function between(rest: Values, away: Values): TransitionValue {
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
export const opacityTransition: TransitionValue = between({ opacity: 1 }, { opacity: 0 });

/** Grows from, and shrinks to, `factor`. */
export function scaleTransition(factor: number): TransitionValue {
  return between({ scale: 1 }, { scale: factor });
}

/**
 * Slides in from, and out to, an edge, by `distance` px. Leading and trailing
 * are physical left and right: a transform never mirrors.
 */
export function moveTransition(
  edge: 'top' | 'bottom' | 'leading' | 'trailing',
  distance: number,
): TransitionValue {
  const axis = edge === 'top' || edge === 'bottom' ? 'translateY' : 'translateX';
  const sign = edge === 'top' || edge === 'leading' ? -1 : 1;
  return between({ [axis]: 0 }, { [axis]: sign * distance });
}

/** One transition (or keyframes) to arrive, another to leave. */
export function asymmetricTransition(
  insert: TransitionValue | KeyframesValue,
  remove: TransitionValue | KeyframesValue,
): TransitionValue {
  return new TransitionValue(
    insert instanceof TransitionValue ? insert.insert : insert,
    remove instanceof TransitionValue ? remove.remove : remove,
  );
}
