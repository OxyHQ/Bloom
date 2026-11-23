import type { KeyframesValue } from '@oxy.so/bloom/motion';

import { OPACITY } from '../generated/spec.generated';
import type { Modifier } from '../node';
import { type OpacityName, type PaddingToken, resolveSpace } from '../tokens';
import {
  type MotionToken,
  motionKey,
  type RotationName,
  resolveRotation,
  resolveScale,
  type ScaleName,
} from './tokens';
import { REST, type TrackProperty, type Tracks, tracksKeyframes } from './tracks';
import { SEE } from '../docs';

/** A phase's geometry and opacity, as numbers. */
export type Pose = Partial<Record<TrackProperty, number>>;

const PHASED: ReadonlySet<string> = new Set(['offset', 'scale', 'rotation', 'opacity']);

/**
 * The pose a phase's modifiers give: its offset, scale, rotation and opacity,
 * each a token. A phase changes geometry and opacity only (the engine plays
 * them); anything else is left out, said once in development.
 */
export function poseOf(modifiers: readonly Modifier[]): Pose {
  const pose: Pose = {};
  for (const modifier of modifiers) {
    if (!PHASED.has(modifier.kind)) {
      if (process.env.NODE_ENV !== 'production')
        console.warn(
          `[Bloom language] a phase changes geometry and opacity only: .${modifier.kind}() is left out. See ${SEE.animation}`,
        );
      continue;
    }
    switch (modifier.kind) {
      case 'offset': {
        const { x, y } = modifier.value;
        if (x !== undefined) pose.x = resolveSpace(x as PaddingToken);
        if (y !== undefined) pose.y = resolveSpace(y as PaddingToken);
        break;
      }
      case 'scale':
        pose.scale = resolveScale(modifier.value as ScaleName);
        break;
      case 'rotation':
        pose.rotate = resolveRotation(modifier.value as RotationName);
        break;
      case 'opacity':
        pose.opacity = OPACITY[modifier.value as OpacityName];
        break;
    }
  }
  return pose;
}

const cache = new Map<string, KeyframesValue>();

/**
 * SwiftUI's `phaseAnimator` as keyframes: from the first phase's pose through
 * each next one and back to the first, each step with the motion of the phase
 * it moves to. Built once per poses and motions.
 */
export function phaseKeyframes(
  poses: readonly Pose[],
  motions: readonly MotionToken[],
): KeyframesValue {
  const key = JSON.stringify(poses) + motions.map(motionKey).join('|');
  let keyframes = cache.get(key);
  if (keyframes !== undefined) return keyframes;
  const properties = new Set<TrackProperty>();
  for (const pose of poses)
    for (const property of Object.keys(pose)) properties.add(property as TrackProperty);
  const first = poses[0] ?? {};
  const order = [...poses.keys()].slice(1).concat(0);
  const tracks: Tracks = {};
  for (const property of properties) {
    tracks[property] = order.map((index) => ({
      to: poses[index]?.[property] ?? REST[property],
      motion: motions[index],
    }));
  }
  keyframes = tracksKeyframes(tracks, first);
  cache.set(key, keyframes);
  return keyframes;
}
