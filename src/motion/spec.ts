import {
  Easing,
  ReduceMotion,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { SurfaceTransition } from './types';

/**
 * A spring described the way it is perceived, as a measurement or a design
 * file states it: `response` is the period of the undamped oscillation in
 * seconds, `dampingRatio` is 1 for no overshoot and below 1 for a bounce.
 * Mass is 1, stiffness (2π/response)² and damping 4π·ratio/response.
 */
export interface SpringSpec {
  response: number;
  dampingRatio: number;
}

/** A spring or a duration and cubic-bezier curve, as plain data. */
export type MotionSpec = SpringSpec | SurfaceTransition;

export interface SpringPhysics {
  mass: 1;
  stiffness: number;
  damping: number;
}

const DEFAULT_DURATION = 300;
const DEFAULT_CURVE: readonly [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const SETTLE_TOLERANCE = 0.001;
const SETTLE_CAP_MS = 10_000;
const CSS_SAMPLES = 48;

export function isSpringSpec(spec: MotionSpec): spec is SpringSpec {
  return (spec as SpringSpec).response !== undefined;
}

function finiteSpring(spec: SpringSpec): SpringSpec {
  const response =
    Number.isFinite(spec.response) && spec.response > 0 ? spec.response : DEFAULT_DURATION / 1000;
  const dampingRatio =
    Number.isFinite(spec.dampingRatio) && spec.dampingRatio > 0 ? spec.dampingRatio : 1;
  return { response, dampingRatio };
}

function finiteTiming(spec: SurfaceTransition): {
  duration: number;
  easing: readonly [number, number, number, number];
} {
  const duration = Number.isFinite(spec.duration) ? Math.max(0, spec.duration) : DEFAULT_DURATION;
  const curve = spec.easing;
  const easing =
    curve && curve.length === 4 && curve.every(Number.isFinite) ? curve : DEFAULT_CURVE;
  return { duration, easing };
}

export function springPhysics(spec: SpringSpec): SpringPhysics {
  const { response, dampingRatio } = finiteSpring(spec);
  const omega = (2 * Math.PI) / response;
  return { mass: 1, stiffness: omega * omega, damping: 2 * dampingRatio * omega };
}

/**
 * Where a spring released at 0 toward 1 is after `seconds`, with an initial
 * `velocity` in travels per second. The closed form of the same oscillator
 * Reanimated integrates, so tests and CSS read the native motion exactly.
 */
export function springProgressAt(spec: SpringSpec, seconds: number, velocity = 0): number {
  'worklet';
  if (seconds <= 0) return 0;
  const response =
    Number.isFinite(spec.response) && spec.response > 0 ? spec.response : DEFAULT_DURATION / 1000;
  const zeta = Number.isFinite(spec.dampingRatio) && spec.dampingRatio > 0 ? spec.dampingRatio : 1;
  const omega = (2 * Math.PI) / response;
  const x0 = -1;
  const v0 = velocity;
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega * seconds);
    return (
      1 +
      envelope *
        (x0 * Math.cos(wd * seconds) + ((v0 + zeta * omega * x0) / wd) * Math.sin(wd * seconds))
    );
  }
  if (zeta === 1) {
    return 1 + Math.exp(-omega * seconds) * (x0 + (v0 + omega * x0) * seconds);
  }
  const root = omega * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * omega + root;
  const r2 = -zeta * omega - root;
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  const c1 = x0 - c2;
  return 1 + c1 * Math.exp(r1 * seconds) + c2 * Math.exp(r2 * seconds);
}

const settleCache = new Map<string, number>();

/** Milliseconds until the spring stays within `tolerance` of its travel. */
export function springSettleMs(spec: SpringSpec, tolerance = SETTLE_TOLERANCE): number {
  const { response, dampingRatio } = finiteSpring(spec);
  const key = `${response}:${dampingRatio}:${tolerance}`;
  const cached = settleCache.get(key);
  if (cached !== undefined) return cached;
  let last = 0;
  for (let ms = 1; ms <= SETTLE_CAP_MS; ms++) {
    if (Math.abs(springProgressAt({ response, dampingRatio }, ms / 1000) - 1) >= tolerance)
      last = ms;
    else if (ms - last > response * 1000) break;
  }
  const settled = Math.min(SETTLE_CAP_MS, last + 1);
  settleCache.set(key, settled);
  return settled;
}

function bezierAxis(a: number, b: number, t: number) {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

/** The progress a CSS `cubic-bezier()` gives at a fraction of its duration. */
export function cubicBezierProgressAt(
  curve: readonly [number, number, number, number],
  fraction: number,
): number {
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  const [x1, y1, x2, y2] = curve;
  let low = 0;
  let high = 1;
  let t = fraction;
  for (let step = 0; step < 40; step++) {
    const x = bezierAxis(x1, x2, t);
    if (Math.abs(x - fraction) < 1e-7) break;
    if (x < fraction) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return bezierAxis(y1, y2, t);
}

/** Progress of any spec at `ms` after it started, for tests and measurement. */
export function motionProgressAt(spec: MotionSpec, ms: number): number {
  if (isSpringSpec(spec)) return springProgressAt(spec, ms / 1000);
  const { duration, easing } = finiteTiming(spec);
  return duration === 0 ? 1 : cubicBezierProgressAt(easing, ms / duration);
}

/** Total length of a spec in milliseconds: a spring's settle time or the duration. */
export function motionDurationMs(spec: MotionSpec): number {
  return isSpringSpec(spec) ? springSettleMs(spec) : finiteTiming(spec).duration;
}

export interface MotionCss {
  /** `transition-duration` value. */
  duration: string;
  /** `transition-timing-function` value: `linear(…)` for a spring. */
  easing: string;
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * The same motion as a CSS transition, so the web compositor runs it without
 * a frame of JavaScript. A spring becomes a `linear()` curve sampled from its
 * closed form over its settle time (overshoot included); a timing keeps its
 * cubic-bezier. Reduced motion is a zero duration.
 */
export function motionCss(spec: MotionSpec, reducedMotion = false): MotionCss {
  if (!isSpringSpec(spec)) {
    const { duration, easing } = finiteTiming(spec);
    return {
      duration: `${reducedMotion ? 0 : duration}ms`,
      easing: `cubic-bezier(${easing.join(',')})`,
    };
  }
  const total = springSettleMs(spec);
  const points: string[] = ['0'];
  for (let index = 1; index < CSS_SAMPLES; index++)
    points.push(`${round(springProgressAt(spec, (total * index) / CSS_SAMPLES / 1000))}`);
  points.push('1');
  return { duration: `${reducedMotion ? 0 : total}ms`, easing: `linear(${points.join(',')})` };
}

/**
 * Retarget a shared value with a spec, from where it is now. A spring keeps
 * its physics (and its overshoot); reduced motion lands at once.
 */
export function animateWithSpec(
  value: SharedValue<number>,
  target: number,
  spec: MotionSpec,
  reducedMotion = false,
  onSettled?: (finished: boolean | undefined) => void,
): void {
  'worklet';
  if (reducedMotion) {
    value.value = target;
    if (onSettled) onSettled(true);
    return;
  }
  if ((spec as SpringSpec).response !== undefined) {
    const spring = spec as SpringSpec;
    const response =
      Number.isFinite(spring.response) && spring.response > 0
        ? spring.response
        : DEFAULT_DURATION / 1000;
    const zeta =
      Number.isFinite(spring.dampingRatio) && spring.dampingRatio > 0 ? spring.dampingRatio : 1;
    const omega = (2 * Math.PI) / response;
    value.value = withSpring(
      target,
      {
        mass: 1,
        stiffness: omega * omega,
        damping: 2 * zeta * omega,
        reduceMotion: ReduceMotion.System,
      },
      onSettled,
    );
    return;
  }
  const timing = spec as SurfaceTransition;
  const duration = Number.isFinite(timing.duration)
    ? Math.max(0, timing.duration)
    : DEFAULT_DURATION;
  const curve =
    timing.easing && timing.easing.length === 4 && timing.easing.every(Number.isFinite)
      ? timing.easing
      : DEFAULT_CURVE;
  value.value = withTiming(
    target,
    {
      duration,
      easing: Easing.bezier(curve[0], curve[1], curve[2], curve[3]),
      reduceMotion: ReduceMotion.System,
    },
    onSettled,
  );
}
