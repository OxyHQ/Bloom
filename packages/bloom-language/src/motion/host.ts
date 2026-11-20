import type { RefObject } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cubicBezier,
  linear,
  useAnimatedStyle,
  useSharedValue,
  type CSSAnimationKeyframes,
} from 'react-native-reanimated';
import { animateWithSpec } from '@oxy.so/bloom/motion';

import { MOTION, SCALE } from '../generated/spec.generated';
import type { KeyframesValue } from './keyframes';
import type { Play, Transform } from './play';
import type { Curve, Timing } from './tokens';

/**
 * Native motion: Reanimated 4's CSS engine. A state-driven change is a CSS
 * transition or a CSS animation on an `Animated` host, so it runs on the UI
 * thread with no worklet and no JS frame. The one shared value is press
 * feedback's, which a press retargets without a React render, read by one
 * mapper this file writes (every key, every run).
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ANIMATED = new Map<unknown, unknown>([
  [View, Animated.View],
  [Pressable, AnimatedPressable],
  [Text, Animated.Text],
]);

/** The animated twin of a language host, or `undefined` when it has none (a Bloom component). */
export function animatedHost(host: unknown): unknown {
  return ANIMATED.get(host);
}

/** The box a Bloom component (a Surface, an Avatar…) moves in when it carries motion. */
export const MotionWrapper: unknown = Animated.View;

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

/** Keyframes as Reanimated's CSS keyframes: one block per frame, its curve on the block. */
const rules = new WeakMap<KeyframesValue, CSSAnimationKeyframes>();
function keyframesRule(keyframes: KeyframesValue): CSSAnimationKeyframes {
  let rule = rules.get(keyframes);
  if (rule === undefined) {
    rule = {};
    for (const frame of keyframes.frames) {
      const block: Record<string, unknown> = {};
      if (frame.opacity !== undefined) block.opacity = frame.opacity;
      if (frame.transform.length > 0) block.transform = frame.transform;
      if (frame.curve !== undefined) block.animationTimingFunction = nativeCurve(frame.curve);
      rule[`${Math.round(frame.at * 10000) / 100}%`] = block;
    }
    rules.set(keyframes, rule);
  }
  return rule;
}

/**
 * What a box takes to play `play`: the CSS animation as style, and the end
 * callback as a prop. Native glass fades its own host (it has no backdrop
 * filter to flatten), so `glass` changes nothing here.
 */
export function usePlay(
  _ref: RefObject<unknown>,
  play: Play | undefined,
): { style: object | undefined; props: object | undefined } {
  if (play === undefined) return { style: undefined, props: undefined };
  return {
    style: {
      animationName: keyframesRule(play.keyframes),
      animationDuration: play.timing.duration,
      animationTimingFunction: nativeCurve(play.timing.curve),
      animationFillMode: play.fill,
    },
    props: play.onEnd ? { onCSSAnimationEnd: play.onEnd } : undefined,
  };
}

/**
 * Press feedback: a press retargets one shared value with the `press` motion
 * (Bloom's `animateWithSpec`), and one mapper reads it. The mapper lists the
 * value in its deps (trap B) and starts no animation (trap A).
 */
export function usePressScale(
  enabled: boolean,
  transform: Transform,
): { style: object; onPressIn: () => void; onPressOut: () => void } {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(
    () => ({ transform: [...transform, { scale: scale.value }] }),
    [scale, transform],
  );
  return {
    style,
    onPressIn: () => {
      if (enabled) animateWithSpec(scale, SCALE.pressed, MOTION.press);
    },
    onPressOut: () => {
      if (enabled) animateWithSpec(scale, SCALE.full, MOTION.press);
    },
  };
}

/** Whether a press-scale class exists (web only). */
export const PRESS_SCALE_CLASS: string | undefined = undefined;
