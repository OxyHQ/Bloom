import type { ComponentType, RefObject } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  css,
  cubicBezier,
  linear,
  useAnimatedStyle,
  useSharedValue,
  type CSSKeyframesRule,
} from 'react-native-reanimated';

import type { KeyframesValue } from './keyframes';
import type { Play, Transform } from './play';
import { animateWithSpec } from './spec';
import type { Curve, Timing } from './timing';
import { MOTION } from './tokens';

/**
 * Native motion: Reanimated 4's CSS engine. A state-driven change is a CSS
 * transition or a CSS animation on an `Animated` host, played on the UI thread
 * with no worklet and no JS frame. The one shared value is press feedback's,
 * which a press retargets without a React render, read by the one mapper
 * this file writes (every key, every run).
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ANIMATED = new Map<unknown, unknown>([
  [View, Animated.View],
  [Pressable, AnimatedPressable],
  [Text, Animated.Text],
]);

/** The animated twin of a host (`View`, `Text`, `Pressable`), or `undefined`. */
export function animatedHost(host: unknown): unknown {
  return ANIMATED.get(host);
}

/** The box a component that cannot take motion itself moves in. */
export const MotionWrapper = Animated.View as unknown as ComponentType<Record<string, unknown>>;

const curves = new WeakMap<Curve, unknown>();
function nativeCurve(curve: Curve): unknown {
  let out = curves.get(curve);
  if (out === undefined) {
    out =
      curve.kind === 'bezier'
        ? cubicBezier(curve.points[0], curve.points[1], curve.points[2], curve.points[3])
        : linear(...curve.points);
    curves.set(curve, out);
  }
  return out;
}

const transitions = new WeakMap<Timing, object>();

/** A box's changes of transform and opacity, played by `timing`. */
export function transitionStyle(timing: Timing): object {
  let style = transitions.get(timing);
  if (style === undefined) {
    style = {
      transitionProperty: ['transform', 'opacity'],
      transitionDuration: timing.duration,
      transitionTimingFunction: nativeCurve(timing.curve),
    };
    transitions.set(timing, style);
  }
  return style;
}

/**
 * Each keyframes value as two registered rules (`css.keyframes`) with the same
 * frames: Reanimated restarts an animation when its rule changes, so a playing
 * takes the rule its id's parity names, and the next playing always restarts,
 * even while the last one runs. A registered rule is never re-serialized.
 */
const rules = new WeakMap<KeyframesValue, readonly [CSSKeyframesRule, CSSKeyframesRule]>();
function rulesOf(keyframes: KeyframesValue): readonly [CSSKeyframesRule, CSSKeyframesRule] {
  let pair = rules.get(keyframes);
  if (pair === undefined) {
    const blocks: Record<string, Record<string, unknown>> = {};
    for (const frame of keyframes.frames) {
      const block: Record<string, unknown> = {};
      if (frame.opacity !== undefined) block.opacity = frame.opacity;
      if (frame.transform.length > 0) block.transform = frame.transform;
      if (frame.curve !== undefined) block.animationTimingFunction = nativeCurve(frame.curve);
      blocks[`${Math.round(frame.at * 10000) / 100}%`] = block;
    }
    pair = [css.keyframes(blocks), css.keyframes(blocks)];
    rules.set(keyframes, pair);
  }
  return pair;
}

/**
 * What a box takes to play `play`: the CSS animation as style, and its end as a
 * prop. Native fades a material host itself (there is no backdrop filter
 * to flatten), so `material` changes nothing here.
 */
export function usePlay(
  _ref: RefObject<unknown>,
  play: Play | undefined,
): { style: object | undefined; props: object | undefined } {
  if (play === undefined) return { style: undefined, props: undefined };
  return {
    style: {
      animationName: rulesOf(play.keyframes)[Math.abs(play.id) % 2],
      animationDuration: play.timing.duration,
      animationTimingFunction: nativeCurve(play.timing.curve),
      animationFillMode: play.fill,
    },
    props: play.onEnd ? { onCSSAnimationEnd: play.onEnd } : undefined,
  };
}

/**
 * Press feedback: a press retargets one shared value with the `press` motion,
 * and one mapper reads it, with the box's resting transform before it. The
 * mapper lists the value in its deps (trap B) and starts no animation (trap A).
 */
export function usePressScale(
  enabled: boolean,
  transform: Transform,
  pressed: number,
): {
  style: object | undefined;
  onPressIn: (() => void) | undefined;
  onPressOut: (() => void) | undefined;
} {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(
    () => ({ transform: [...transform, { scale: scale.value }] }),
    [scale, transform],
  );
  return {
    style,
    onPressIn: () => {
      if (enabled) animateWithSpec(scale, pressed, MOTION.press);
    },
    onPressOut: () => {
      if (enabled) animateWithSpec(scale, 1, MOTION.press);
    },
  };
}

const exits = new WeakMap<KeyframesValue, Map<Timing, unknown>>();

/**
 * A removal on native: the frames as a Reanimated layout `Keyframe`, which
 * Reanimated plays on a native snapshot of the view after it unmounts, so the
 * view is gone at once and no JS runs for its exit (a `MotionView`'s `exit`).
 * A frame's curve covers the stretch after it, so it is the easing that
 * reaches the next keyframe. A spring's curve has no layout-animation form;
 * its stretches run linearly.
 */
export function exitingOf(keyframes: KeyframesValue, timing: Timing): unknown {
  let byTiming = exits.get(keyframes);
  if (byTiming === undefined) {
    byTiming = new Map();
    exits.set(keyframes, byTiming);
  }
  let exiting = byTiming.get(timing);
  if (exiting === undefined) {
    const easing = (curve: Curve) =>
      curve.kind === 'bezier'
        ? Easing.bezier(curve.points[0], curve.points[1], curve.points[2], curve.points[3])
        : Easing.linear;
    // A Keyframe rewrites the definitions it is given, so each one gets its own.
    const definitions: Record<number, Record<string, unknown>> = {};
    keyframes.frames.forEach((frame, i) => {
      const block: Record<string, unknown> = {};
      if (frame.opacity !== undefined) block.opacity = frame.opacity;
      if (frame.transform.length > 0)
        block.transform = frame.transform.map((part) => ({ ...part }));
      const before = keyframes.frames[i - 1];
      if (before !== undefined) block.easing = easing(before.curve ?? timing.curve);
      definitions[Math.round(frame.at * 100)] = block;
    });
    exiting = new Keyframe(definitions as never).duration(timing.duration);
    byTiming.set(timing, exiting);
  }
  return exiting;
}
