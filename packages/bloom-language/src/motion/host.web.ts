import { useLayoutEffect, type RefObject } from 'react';
import { View } from 'react-native';

import { PRESS_SCALE_CLASS as PRESS_CLASS } from '../generated/web-sheet.generated';
import type { KeyframesValue } from './keyframes';
import type { Play, Transform } from './play';
import { cssCurve, type Timing } from './tokens';

/**
 * Web motion: CSS and the Web Animations API, with no Reanimated. A
 * state-driven change is a CSS transition on the host's inline style; keyframes
 * (a transition's halves, `.keyframes()`, a matched geometry's move) are
 * `element.animate()`. The browser plays both on its compositor: no JS runs per
 * frame.
 */

/** The web hosts animate as they are. */
export function animatedHost(host: unknown): unknown {
  return host;
}

export const MotionWrapper: unknown = View;

const transitions = new WeakMap<Timing, object>();

export function transitionStyle(timing: Timing): object {
  let style = transitions.get(timing);
  if (style === undefined) {
    style = {
      transitionProperty: 'transform, opacity',
      transitionDuration: `${timing.duration}ms`,
      transitionTimingFunction: cssCurve(timing.curve),
    };
    transitions.set(timing, style);
  }
  return style;
}

function transformCss(parts: Transform): string {
  return parts
    .map((part) => {
      const [name, value] = Object.entries(part)[0] as [string, number | string];
      return name.startsWith('translate') ? `${name}(${value}px)` : `${name}(${value})`;
    })
    .join(' ');
}

type WebFrame = { offset: number; easing: string; opacity?: number; transform?: string };
interface WebFrames {
  box: WebFrame[];
  routed: WebFrame[];
  fade: WebFrame[];
}

/**
 * The frames as WAAPI keyframes: the box's (transform, and opacity unless it is
 * routed to glass), and the fade's. Each frame carries its stretch's curve, as
 * a CSS animation applies its timing function per stretch (Reanimated's CSS
 * engine does too); the animation as a whole runs linearly.
 */
const webFrames = new WeakMap<KeyframesValue, Map<string, WebFrames>>();
function framesOf(keyframes: KeyframesValue, curve: string): WebFrames {
  let byCurve = webFrames.get(keyframes);
  if (byCurve === undefined) {
    byCurve = new Map();
    webFrames.set(keyframes, byCurve);
  }
  let out = byCurve.get(curve);
  if (out === undefined) {
    const box: WebFrame[] = [];
    const routed: WebFrame[] = [];
    const fade: WebFrame[] = [];
    for (const frame of keyframes.frames) {
      const base: WebFrame = {
        offset: frame.at,
        easing: frame.curve === undefined ? curve : cssCurve(frame.curve),
      };
      const transform = frame.transform.length > 0 ? transformCss(frame.transform) : undefined;
      const moved = transform === undefined ? { ...base } : { ...base, transform };
      routed.push(moved);
      box.push(frame.opacity === undefined ? moved : { ...moved, opacity: frame.opacity });
      if (frame.opacity !== undefined) fade.push({ ...base, opacity: frame.opacity });
    }
    out = { box, routed, fade };
    byCurve.set(curve, out);
  }
  return out;
}

const GLASS_HOST = '.bloom-surface';

/**
 * Plays `play` on the box `ref` holds, before the frame paints. On glass the
 * fade never touches the box or anything above the material: the material's
 * own layers (its `::before` and `::after`) and each piece of content on it
 * fade instead, with the same frames, so the backdrop keeps blurring.
 */
export function usePlay(
  ref: RefObject<unknown>,
  play: Play | undefined,
): { style: object | undefined; props: object | undefined } {
  const id = play?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: one playing per id
  useLayoutEffect(() => {
    const box = ref.current as Element | null;
    if (play === undefined || typeof box?.animate !== 'function') return undefined;
    const curve = cssCurve(play.timing.curve);
    const { box: boxFrames, routed, fade } = framesOf(play.keyframes, curve);
    const options: KeyframeAnimationOptions = { duration: play.timing.duration, fill: play.fill };
    const animations: Animation[] = [];
    const glass = play.glass && play.keyframes.fades ? box.querySelector(GLASS_HOST) : null;
    if (glass !== null) {
      animations.push(box.animate(routed, options));
      for (const pseudoElement of ['::before', '::after']) {
        animations.push(glass.animate(fade, { ...options, pseudoElement }));
      }
      for (const piece of Array.from(glass.children)) animations.push(piece.animate(fade, options));
    } else {
      animations.push(box.animate(boxFrames, options));
    }
    const first = animations[0] as Animation;
    const onEnd = play.onEnd;
    if (onEnd) first.onfinish = () => onEnd();
    return () => {
      first.onfinish = null;
      // A removal holds its last frame until the list drops the box; anything else lets go.
      if (play.fill === 'none') for (const animation of animations) animation.cancel();
    };
  }, [id]);
  return { style: undefined, props: undefined };
}

/** Press feedback on the web is the generated class: a touch press, never a mouse, never reduced motion. */
export function usePressScale(
  _enabled: boolean,
  _transform: Transform,
): { style: undefined; onPressIn: undefined; onPressOut: undefined } {
  return { style: undefined, onPressIn: undefined, onPressOut: undefined };
}

export const PRESS_SCALE_CLASS: string | undefined = PRESS_CLASS;
