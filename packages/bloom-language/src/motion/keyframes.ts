import type { SpaceToken } from '../tokens';
import { resolveSpace } from '../tokens';
import {
  easingCurve,
  resolveMotion,
  timingOf,
  type Curve,
  type EasingName,
  type MotionToken,
  type Timing,
} from './tokens';

/**
 * Keyframes as data: an ordered list of frames, each the animatable values at
 * one point of the motion (`at`, 0 to 1), and the motion that plays them.
 *
 * ```ts
 * const pop = defineKeyframes([
 *   { at: 0, scale: 1, easing: 'inOutQuad' },
 *   { at: 0.1, scale: 0.7 },
 *   { at: 0.4, scale: 1.2 },
 *   { at: 1, scale: 1 },
 * ], 'pop');
 * Icon(LikeFillIcon).keyframes(pop, pressed);
 * ```
 *
 * A frame is what a CSS `@keyframes` block is, and both engines take exactly
 * that: Reanimated's CSS animations (native) and the Web Animations API (web).
 * A frame's `easing` curves the stretch from it to the next one; without one
 * the stretch takes the motion's own curve. Values are Bloom-internal numbers,
 * as `defineTokens` allows (a scale factor, an opacity, a distance in px or a
 * space token, degrees).
 */
export interface Frame {
  readonly at: number;
  readonly opacity?: number;
  readonly scale?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly translateX?: number | SpaceToken;
  readonly translateY?: number | SpaceToken;
  readonly rotate?: number;
  readonly easing?: EasingName;
}

/** A frame as the engines take it: every value a number, every curve resolved. */
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

let nextKeyframes = 0;

export class KeyframesValue {
  readonly key: string;
  readonly frames: readonly ResolvedFrame[];
  readonly fades: boolean;

  constructor(
    readonly source: readonly Frame[],
    readonly motion: MotionToken | undefined,
  ) {
    this.frames = resolveFrames(source);
    this.fades = this.frames.some((frame) => frame.opacity !== undefined);
    nextKeyframes += 1;
    this.key = `kf${nextKeyframes}`;
    Object.freeze(this);
  }

  /** The timing that plays these frames: their own motion, else the one in scope. */
  timing(scope: MotionToken | undefined): Timing | undefined {
    const motion = this.motion ?? scope;
    return motion === undefined ? undefined : timingOf(resolveMotion(motion));
  }

  /** The same frames played by another motion (SwiftUI's `transition.animation(_:)`). */
  animation(motion: MotionToken): KeyframesValue {
    return new KeyframesValue(this.source, motion);
  }

  /** Both sets of values in one set of frames; the two must stop at the same points. */
  merged(other: KeyframesValue): KeyframesValue {
    const left = this.source;
    const right = other.source;
    if (left.length !== right.length || left.some((frame, i) => frame.at !== right[i]?.at)) {
      throw new Error('Bloom language: combined keyframes must stop at the same points');
    }
    return new KeyframesValue(
      left.map((frame, i) => ({ ...frame, ...right[i] })),
      this.motion ?? other.motion,
    );
  }
}

/** Declares keyframes, played by `motion` or else by the `.animation()` in scope. */
export function defineKeyframes(frames: readonly Frame[], motion?: MotionToken): KeyframesValue {
  return new KeyframesValue(frames, motion);
}

function px(value: number | SpaceToken): number {
  return typeof value === 'number' ? value : resolveSpace(value);
}

function resolveFrames(frames: readonly Frame[]): ResolvedFrame[] {
  if (frames.length < 2 || frames[0]?.at !== 0 || frames[frames.length - 1]?.at !== 1) {
    throw new Error('Bloom language: keyframes run from at: 0 to at: 1');
  }
  return frames.map((frame) => {
    const transform: TransformPart[] = [];
    if (frame.translateX !== undefined) transform.push({ translateX: px(frame.translateX) });
    if (frame.translateY !== undefined) transform.push({ translateY: px(frame.translateY) });
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
