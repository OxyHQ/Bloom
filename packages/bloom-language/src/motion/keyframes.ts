import { defineKeyframes as defineBloomKeyframes, type KeyframesValue } from '@oxy.so/bloom/motion';

import { LOOPS } from '../generated/spec.generated';
import { resolveSpace, type PaddingToken } from '../tokens';
import type { EasingName, LoopName, MotionToken } from './tokens';

export type { KeyframesValue };

/**
 * A frame of keyframes, as Bloom's motion engine takes it, with distances as
 * space tokens too: what a CSS `@keyframes` block is. A frame's `easing`
 * curves the stretch from it to the next; without one the stretch takes the
 * motion's curve.
 */
export interface Frame {
  readonly at: number;
  readonly opacity?: number;
  readonly scale?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly translateX?: number | PaddingToken;
  readonly translateY?: number | PaddingToken;
  readonly rotate?: number;
  readonly easing?: EasingName;
}

const px = (value: number | PaddingToken | undefined) =>
  value === undefined || typeof value === 'number' ? value : resolveSpace(value);

/**
 * Keyframes, played by `motion` (a token) or else by the `.animation()` in
 * scope. Values are Bloom-internal numbers (a scale factor, an opacity,
 * degrees) or, for distances, space tokens, as `defineTokens` allows.
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
 */
export function defineKeyframes(frames: readonly Frame[], motion?: MotionToken): KeyframesValue {
  return defineBloomKeyframes(
    frames.map((frame) => ({
      ...frame,
      translateX: px(frame.translateX),
      translateY: px(frame.translateY),
    })),
    motion,
  );
}

const loops = new Map<LoopName, KeyframesValue>();

/** A loop token's keyframes (the spec's `loops`), played by the motion of its name: built once. */
export function loopKeyframes(name: LoopName): KeyframesValue {
  let value = loops.get(name);
  if (value === undefined) {
    const loop = LOOPS[name];
    value = defineKeyframes(loop.frames, loop.motion);
    loops.set(name, value);
  }
  return value;
}
