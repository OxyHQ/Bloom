import type { MotionSpec } from './spec';
import { easingCurve, timingOf, type Curve, type Timing } from './timing';
import { MOTION, type EasingName, type MotionName } from './tokens';

/** A motion by name (`'pop'`) or as a spec. */
export type MotionLike = MotionSpec | MotionName;

function specOf(motion: MotionLike | undefined): MotionSpec | undefined {
  return typeof motion === 'string' ? MOTION[motion] : motion;
}

/**
 * Keyframes as data: frames, each the animatable values at one point of the
 * motion (`at`, 0 to 1), and the motion that plays them. A frame is what a
 * CSS `@keyframes` block is, and both engines take exactly that: Reanimated's
 * CSS animations (native) and the Web Animations API (web). A frame's
 * `easing` curves the stretch from it to the next; without one the stretch
 * takes the motion's own curve, as a CSS animation applies its timing
 * function per stretch.
 *
 * ```ts
 * const pop = defineKeyframes([
 *   { at: 0, scale: 1, easing: 'inOutQuad' },
 *   { at: 0.1, scale: 0.7 },
 *   { at: 0.4, scale: 1.2 },
 *   { at: 1, scale: 1 },
 * ], MOTION.pop);
 * ```
 */
export interface Keyframe {
  readonly at: number;
  readonly opacity?: number;
  readonly scale?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  /** px */
  readonly translateX?: number;
  /** px */
  readonly translateY?: number;
  /** degrees */
  readonly rotate?: number;
  readonly easing?: EasingName;
}

/** A frame as the engines take it. */
export interface ResolvedFrame {
  readonly at: number;
  readonly opacity: number | undefined;
  readonly transform: readonly TransformPart[];
  readonly curve: Curve | undefined;
}

/** The transform parts, always in this order: translate, rotate, scale. */
export type TransformPart =
  | { readonly translateX: number }
  | { readonly translateY: number }
  | { readonly rotate: string }
  | { readonly scale: number }
  | { readonly scaleX: number }
  | { readonly scaleY: number };

export class KeyframesValue {
  readonly frames: readonly ResolvedFrame[];
  /** Whether any frame sets opacity: what a material host routes to its own layers. */
  readonly fades: boolean;

  readonly motion: MotionSpec | undefined;

  constructor(
    readonly source: readonly Keyframe[],
    motion: MotionLike | undefined,
  ) {
    this.motion = specOf(motion);
    this.frames = resolveFrames(source);
    this.fades = this.frames.some((frame) => frame.opacity !== undefined);
    Object.freeze(this);
  }

  /** The timing that plays these frames: their own motion, else the one given. */
  timing(fallback?: MotionLike): Timing | undefined {
    const motion = this.motion ?? specOf(fallback);
    return motion === undefined ? undefined : timingOf(motion);
  }

  /** The same frames played by another motion. */
  animation(motion: MotionLike): KeyframesValue {
    return new KeyframesValue(this.source, motion);
  }

  /** Both sets of values in one set of frames; the two must stop at the same points. */
  merged(other: KeyframesValue): KeyframesValue {
    const left = this.source;
    const right = other.source;
    if (left.length !== right.length || left.some((frame, i) => frame.at !== right[i]?.at)) {
      throw new Error('Bloom motion: combined keyframes must stop at the same points');
    }
    return new KeyframesValue(
      left.map((frame, i) => ({ ...frame, ...right[i] })),
      this.motion ?? other.motion,
    );
  }
}

/** Declares keyframes, played by `motion` or else by the motion the player gives. */
export function defineKeyframes(frames: readonly Keyframe[], motion?: MotionLike): KeyframesValue {
  return new KeyframesValue(frames, motion);
}

function resolveFrames(frames: readonly Keyframe[]): ResolvedFrame[] {
  if (frames.length < 2 || frames[0]?.at !== 0 || frames[frames.length - 1]?.at !== 1) {
    throw new Error('Bloom motion: keyframes run from at: 0 to at: 1');
  }
  return frames.map((frame) => {
    const transform: TransformPart[] = [];
    if (frame.translateX !== undefined) transform.push({ translateX: frame.translateX });
    if (frame.translateY !== undefined) transform.push({ translateY: frame.translateY });
    if (frame.rotate !== undefined) transform.push({ rotate: `${frame.rotate}deg` });
    if (frame.scale !== undefined) transform.push({ scale: frame.scale });
    if (frame.scaleX !== undefined) transform.push({ scaleX: frame.scaleX });
    if (frame.scaleY !== undefined) transform.push({ scaleY: frame.scaleY });
    return Object.freeze({
      at: frame.at,
      opacity: frame.opacity,
      transform: Object.freeze(transform),
      curve: frame.easing === undefined ? undefined : easingCurve(frame.easing),
    });
  });
}

const rolls = new Map<number, { incoming: KeyframesValue; outgoing: KeyframesValue }>();

/**
 * A text rolling by `travel` px (negative rolls down): the new text rises in
 * from below and fades in while the old one leaves upward and fades out.
 * `RollingText` plays it, and the Bloom language's `.contentTransition('roll')`.
 */
export function rollKeyframes(travel: number): {
  incoming: KeyframesValue;
  outgoing: KeyframesValue;
} {
  let roll = rolls.get(travel);
  if (roll === undefined) {
    roll = {
      incoming: defineKeyframes([
        { at: 0, opacity: 0, translateY: travel },
        { at: 1, opacity: 1, translateY: 0 },
      ]),
      outgoing: defineKeyframes([
        { at: 0, opacity: 1, translateY: 0 },
        { at: 1, opacity: 0, translateY: -travel },
      ]),
    };
    rolls.set(travel, roll);
  }
  return roll;
}
