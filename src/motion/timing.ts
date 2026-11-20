import { isSpringSpec, springProgressAt, springSettleMs, type MotionSpec } from './spec';
import { EASING, type EasingName } from './tokens';

/**
 * A motion as both engines play it: a duration in milliseconds and one curve,
 * a cubic-bezier or, for a spring, `linear()` points sampled from its closed
 * form (overshoot included). Reanimated's CSS engine (native) and the browser
 * (web) take the same numbers, so a motion is one curve on every platform.
 */
export interface Timing {
  readonly duration: number;
  readonly curve: Curve;
}
export type Curve =
  | { readonly kind: 'bezier'; readonly points: readonly [number, number, number, number] }
  | { readonly kind: 'linear'; readonly points: readonly number[] };

const SPRING_SAMPLES = 48;
const timings = new WeakMap<MotionSpec, Timing>();

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
    const [x1, y1, x2, y2] = spec.easing ?? EASING.ease;
    timing = {
      duration: Math.max(0, spec.duration),
      curve: { kind: 'bezier', points: [x1, y1, x2, y2] },
    };
  }
  timings.set(spec, timing);
  return timing;
}

const named = new Map<EasingName, Curve>();
export function easingCurve(name: EasingName): Curve {
  let curve = named.get(name);
  if (curve === undefined) {
    const [x1, y1, x2, y2] = EASING[name];
    curve = { kind: 'bezier', points: [x1, y1, x2, y2] };
    named.set(name, curve);
  }
  return curve;
}

/** A curve as CSS writes it. */
export function cssCurve(curve: Curve): string {
  return curve.kind === 'bezier'
    ? `cubic-bezier(${curve.points.join(',')})`
    : `linear(${curve.points.join(',')})`;
}
