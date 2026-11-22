import {
  defineKeyframes as defineBloomKeyframes,
  EASING,
  type Keyframe,
  type KeyframesValue,
  type MotionSpec,
  motionDurationMs,
  motionProgressAt,
} from '@oxy.so/bloom/motion';

import { resolveSpace, type PaddingToken } from '../tokens';
import { type MotionToken, resolveMotion } from './tokens';

/** What a track moves: a distance (`x`, `y`, px or a space token), a scale factor, degrees, an opacity. */
export type TrackProperty = 'x' | 'y' | 'scale' | 'rotate' | 'opacity';

/**
 * One step of a track (SwiftUI's `KeyframeTrack` keyframe): the value it moves
 * to, with `motion` (a token, its curve and its length; a spring keeps its
 * physics) or in `ms` (linear, or the motion stretched to it).
 */
export interface TrackStep {
  readonly to: number | PaddingToken;
  readonly motion?: MotionToken;
  readonly ms?: number;
}

/** Independent timelines per property: what `defineKeyframes({ y: [...], scale: [...] })` takes. */
export type Tracks = Partial<Record<TrackProperty, readonly TrackStep[]>>;

const FRAME_KEY: Record<TrackProperty, keyof Keyframe> = {
  x: 'translateX',
  y: 'translateY',
  scale: 'scale',
  rotate: 'rotate',
  opacity: 'opacity',
};
/** Where each property rests when nothing moves it. */
export const REST: Readonly<Record<TrackProperty, number>> = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
};
/** Samples per step: Bloom's keyframes are timed, so a step's curve is drawn through this many points. */
const SAMPLES = 8;
const LINEAR: MotionSpec = { duration: 0, easing: EASING.linear };

interface Step {
  readonly start: number;
  readonly length: number;
  readonly from: number;
  readonly to: number;
  /** Progress at `ms` into the step, 0 to 1. */
  readonly progress: (ms: number) => number;
}

const value = (to: number | PaddingToken) => (typeof to === 'number' ? to : resolveSpace(to));

function stepsOf(steps: readonly TrackStep[], from: number): Step[] {
  const out: Step[] = [];
  let start = 0;
  let last = from;
  for (const step of steps) {
    const spec = step.motion === undefined ? undefined : resolveMotion(step.motion);
    const natural = spec === undefined ? 0 : motionDurationMs(spec);
    const length = step.ms ?? natural;
    const stretch = length === 0 ? 1 : natural / length;
    const progress =
      spec === undefined
        ? (ms: number) => (length === 0 ? 1 : ms / length)
        : (ms: number) => motionProgressAt(spec, ms * stretch);
    const to = value(step.to);
    out.push({ start, length, from: last, to, progress });
    start += length;
    last = to;
  }
  return out;
}

function valueAt(steps: readonly Step[], from: number, ms: number): number {
  let current = from;
  for (const step of steps) {
    if (ms <= step.start) return current;
    if (ms < step.start + step.length) {
      return step.from + (step.to - step.from) * step.progress(ms - step.start);
    }
    current = step.to;
  }
  return current;
}

/**
 * Tracks as Bloom's keyframes: each property's timeline from `from` (its rest
 * when not given), sampled at its steps' boundaries and `SAMPLES` points
 * inside each, so a step's own curve (a spring included) is kept, played
 * linearly between the samples over the longest track's length. No JavaScript
 * runs per frame: the engine plays CSS keyframes.
 */
export function tracksKeyframes(
  tracks: Tracks,
  from: Partial<Record<TrackProperty, number>> = {},
): KeyframesValue {
  const timelines = (Object.keys(tracks) as TrackProperty[]).map((property) => {
    const start = from[property] ?? REST[property];
    return { property, start, steps: stepsOf(tracks[property] ?? [], start) };
  });
  const times = new Set<number>([0]);
  let total = 0;
  for (const { steps } of timelines) {
    for (const step of steps) {
      for (let k = 0; k <= SAMPLES; k++) times.add(step.start + (step.length * k) / SAMPLES);
      total = Math.max(total, step.start + step.length);
    }
  }
  times.add(total);
  const frames: Keyframe[] = [...times]
    .sort((a, b) => a - b)
    .map((ms) => {
      const frame: Record<string, number> = { at: total === 0 ? 0 : ms / total };
      for (const { property, start, steps } of timelines)
        frame[FRAME_KEY[property]] = valueAt(steps, start, ms);
      return frame as unknown as Keyframe;
    });
  if (frames.length === 1) frames.push({ ...(frames[0] as Keyframe), at: 1 });
  return defineBloomKeyframes(frames, { ...LINEAR, duration: total });
}
