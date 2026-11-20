import {
  isSpringSpec,
  springProgressAt,
  springSettleMs,
  type MotionSpec,
} from '@oxy.so/bloom/motion';

import { EASING, MOTION, ROTATION, SCALE } from '../generated/spec.generated';
import type { AppToken } from '../tokens';

/**
 * Motion as tokens. A motion is a Bloom `MotionSpec` by name: a duration and
 * curve, or a spring in SwiftUI's own terms. The names and values are the
 * spec's (`motion` in spec/language.json), each the motion a Bloom owner
 * already plays; an app names its own with `defineTokens({ motion: { … } })`.
 */
export type MotionName = keyof typeof MOTION;
export type MotionToken = MotionName | AppToken<'motion'>;
export type EasingName = keyof typeof EASING;
/** How much a view is scaled: `pressed` (0.98), `dip` (0.7), `swell` (1.2), `full` (1). */
export type ScaleName = keyof typeof SCALE;
/** A rotation, in quarter turns' names: `none`, `quarter`, `half`. */
export type RotationName = keyof typeof ROTATION;

export function resolveMotion(token: MotionToken): MotionSpec {
  return typeof token === 'string' ? (MOTION[token] as MotionSpec) : token.value;
}

export function motionKey(token: MotionToken): string {
  return typeof token === 'string' ? token : token.key;
}

/**
 * A motion as both engines take it: a duration in milliseconds and one curve,
 * either a cubic-bezier or, for a spring, the `linear()` points Bloom's
 * `motionCss` samples from the spring's closed form (overshoot included).
 * Reanimated's CSS engine (native) and the browser (web) play the same
 * numbers, so a motion is one curve on every platform.
 */
export interface Timing {
  readonly duration: number;
  readonly curve: Curve;
}
export type Curve =
  | { readonly kind: 'bezier'; readonly points: readonly [number, number, number, number] }
  | { readonly kind: 'linear'; readonly points: readonly number[] };

const SPRING_SAMPLES = 48;
const timings = new Map<MotionSpec, Timing>();

export function timingOf(spec: MotionSpec): Timing {
  let timing = timings.get(spec);
  if (timing !== undefined) return timing;
  if (isSpringSpec(spec)) {
    const duration = springSettleMs(spec);
    const points: number[] = [0];
    for (let index = 1; index < SPRING_SAMPLES; index++) {
      const progress = springProgressAt(spec, (duration * index) / SPRING_SAMPLES / 1000);
      points.push(Math.round(progress * 10000) / 10000);
    }
    points.push(1);
    timing = { duration, curve: { kind: 'linear', points } };
  } else {
    const easing = spec.easing ?? EASING.ease;
    timing = {
      duration: Math.max(0, spec.duration),
      curve: { kind: 'bezier', points: [easing[0], easing[1], easing[2], easing[3]] },
    };
  }
  timings.set(spec, timing);
  return timing;
}

export function easingCurve(name: EasingName): Curve {
  const [x1, y1, x2, y2] = EASING[name];
  return { kind: 'bezier', points: [x1, y1, x2, y2] };
}

/** A curve as CSS writes it (web, and the web half of a test). */
export function cssCurve(curve: Curve): string {
  return curve.kind === 'bezier'
    ? `cubic-bezier(${curve.points.join(',')})`
    : `linear(${curve.points.join(',')})`;
}

export function resolveScale(token: ScaleName): number {
  return SCALE[token];
}

export function resolveRotation(token: RotationName): number {
  return ROTATION[token];
}
