import { MOTION, type MotionSpec } from '@oxy.so/bloom/motion';

import type { ANCHOR, EASING, LOOPS, ROTATION } from '../generated/spec.generated';
import {
  ANCHOR as ANCHORS,
  DURATION,
  ROTATION as ROTATIONS,
  SCALE,
} from '../generated/spec.generated';
import type { DurationName, ScaleName } from '../tokens';

export type { DurationName, ScaleName };

/**
 * Motion as tokens: Bloom's motion table (`MOTION` in `@oxy.so/bloom/motion`)
 * by name, the names spec/language.json lists (spec.test holds the two equal),
 * or a motion an app declares with `defineTokens({ motion: { … } })`, which is
 * a Bloom `MotionSpec`.
 */
export type MotionName = keyof typeof MOTION;
export type MotionToken = MotionName | MotionSpec;
export type EasingName = keyof typeof EASING;
/** A rotation: `none`, `quarter`, `half`. */
export type RotationName = keyof typeof ROTATION;
/** The point a view scales and rotates about: `center`, `top`, `top-leading`… */
export type AnchorName = keyof typeof ANCHOR;
/** A loop (`.repeatForever()`): Tailwind's `spin` and `pulse`. */
export type LoopName = keyof typeof LOOPS;

export function resolveMotion(token: MotionToken): MotionSpec {
  return typeof token === 'string' ? MOTION[token] : token;
}

const specKeys = new WeakMap<MotionSpec, string>();
let nextSpec = 0;

/** A motion's identity in a modifier's key: its name, or one per declared spec. */
export function motionKey(token: MotionToken): string {
  if (typeof token === 'string') return token;
  let key = specKeys.get(token);
  if (key === undefined) {
    nextSpec += 1;
    key = `@motion${nextSpec}`;
    specKeys.set(token, key);
  }
  return key;
}

/** A scale factor: Bloom's named rungs (`pressed` 0.98, `dip`, `swell`, `full`) and the apps' exact ones (`'105'`). */
export function resolveScale(token: ScaleName): number {
  return SCALE[token];
}

export function resolveRotation(token: RotationName): number {
  return ROTATIONS[token];
}

/** An anchor as a transform-origin (`'top left'`). */
export function resolveAnchor(token: AnchorName): string {
  return ANCHORS[token];
}

/** A delay in milliseconds: Bloom's durations (`fast` 150…) and Tailwind's other delays (`'75'`…). */
export function resolveDelay(token: DurationName): number {
  return DURATION[token];
}
