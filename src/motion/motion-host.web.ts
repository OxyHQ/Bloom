import { useLayoutEffect, type ComponentType, type RefObject } from 'react';
import { View } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { surfacePresenceTargets } from '../surface/use-surface-presence';
import { materialHostSelector } from '../surface/web-material';
import type { KeyframesValue } from './keyframes';
import type { Play, Transform } from './play';
import { cssCurve, timingOf, type Timing } from './timing';
import { MOTION, SCALE } from './tokens';

/**
 * Web motion: CSS and the Web Animations API, with no Reanimated. A
 * state-driven change is a CSS transition on the host's inline style;
 * keyframes are `element.animate()`. The browser plays both on its compositor:
 * no JS runs per frame.
 */

export function animatedHost(host: unknown): unknown {
  return host;
}

export const MotionWrapper = View as unknown as ComponentType<Record<string, unknown>>;

const transitions = [new WeakMap<Timing, object>(), new WeakMap<Timing, object>()] as const;

/**
 * A box's changes of transform and opacity, played by `timing`; with
 * `colors`, of its fill, border, outline and text colour too (a glyph paints
 * `currentColor`, so it follows the colour).
 */
export function transitionStyle(timing: Timing, colors = false): object {
  const cache = transitions[colors ? 1 : 0];
  let style = cache.get(timing);
  if (style === undefined) {
    style = {
      transitionProperty: colors
        ? 'transform, opacity, color, background-color, border-color, outline-color'
        : 'transform, opacity',
      transitionDuration: `${timing.duration}ms`,
      transitionTimingFunction: cssCurve(timing.curve),
      ...(timing.delay === undefined ? null : { transitionDelay: `${timing.delay}ms` }),
    };
    cache.set(timing, style);
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
  /** The box's frames: transform, and opacity unless it is routed to a material. */
  box: WebFrame[];
  moved: WebFrame[];
  fade: WebFrame[];
}

/**
 * The frames as WAAPI keyframes. Each carries its stretch's curve, as a CSS
 * animation applies its timing function per stretch (Reanimated's CSS engine
 * does too); the animation as a whole then runs linearly.
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
    const moved: WebFrame[] = [];
    const fade: WebFrame[] = [];
    for (const frame of keyframes.frames) {
      const base: WebFrame = {
        offset: frame.at,
        easing: frame.curve === undefined ? curve : cssCurve(frame.curve),
      };
      const transform = frame.transform.length > 0 ? transformCss(frame.transform) : undefined;
      const move = transform === undefined ? { ...base } : { ...base, transform };
      moved.push(move);
      box.push(frame.opacity === undefined ? move : { ...move, opacity: frame.opacity });
      if (frame.opacity !== undefined) fade.push({ ...base, opacity: frame.opacity });
    }
    out = { box, moved, fade };
    byCurve.set(curve, out);
  }
  return out;
}

/**
 * Plays `play` on the box `ref` holds, before the frame paints. When the box
 * holds a material host and the frames fade, nothing above a material fades:
 * the box only moves, each material host fades its own layers (`::before`,
 * `::after`), and each piece of content that holds no material fades by
 * itself (`surfacePresenceTargets`), all with the same frames.
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
    const { box: boxFrames, moved, fade } = framesOf(play.keyframes, curve);
    const options: KeyframeAnimationOptions = { duration: play.timing.duration, fill: play.fill };
    if (play.timing.delay !== undefined) options.delay = play.timing.delay;
    if (play.repeat) options.iterations = Number.POSITIVE_INFINITY;
    const material = play.material && play.keyframes.fades ? materialHostSelector() : '';
    const hosts = material
      ? [box, ...Array.from(box.querySelectorAll(material))].filter((e) => e.matches(material))
      : [];
    const animations: Animation[] = [];
    if (hosts.length > 0) {
      animations.push(box.animate(moved, options));
      for (const host of hosts) {
        for (const pseudoElement of ['::before', '::after']) {
          animations.push(host.animate(fade, { ...options, pseudoElement }));
        }
      }
      for (const piece of surfacePresenceTargets(box, material)) {
        if (!hosts.includes(piece)) animations.push(piece.animate(fade, options));
      }
    } else {
      animations.push(box.animate(boxFrames, options));
    }
    const first = animations[0] as Animation;
    const onEnd = play.onEnd;
    if (onEnd) first.onfinish = () => onEnd();
    return () => {
      first.onfinish = null;
      // A removal holds its last frame until its Presence drops the box; anything else lets go.
      if (play.fill !== 'forwards') for (const animation of animations) animation.cancel();
    };
  }, [id]);
  return { style: undefined, props: undefined };
}

/** The press-scale class: a touch press scales the host to `--bloom-press-scale`, never a mouse or reduced motion. */
export const PRESS_SCALE_CLASS = 'bloom-press-scale';
const PRESS_SCALE_STYLE = { $$css: true, bloomPressScale: PRESS_SCALE_CLASS } as const;

const PRESS = timingOf(MOTION.press);
const PRESS_SCALE_CSS = `@media (pointer: coarse) and (prefers-reduced-motion: no-preference) {
.${PRESS_SCALE_CLASS} { transition: scale ${PRESS.duration}ms ${cssCurve(PRESS.curve)}; }
.${PRESS_SCALE_CLASS}:active { scale: var(--bloom-press-scale, ${SCALE.pressed}); }
}`;

/**
 * Press feedback on the web: the class above, adopted once. The CSS `scale`
 * property composes with any transform the host has. The pressed scale reaches
 * the rule as `--bloom-press-scale`.
 */
export function usePressScale(
  _enabled: boolean,
  _transform: Transform,
  pressed: number,
): { style: object; onPressIn: undefined; onPressOut: undefined } {
  adoptStyleSheet(PRESS_SCALE_CLASS, PRESS_SCALE_CSS);
  return {
    style:
      pressed === SCALE.pressed
        ? PRESS_SCALE_STYLE
        : [PRESS_SCALE_STYLE, { '--bloom-press-scale': pressed }],
    onPressIn: undefined,
    onPressOut: undefined,
  };
}

/** Web removals play while a `Presence` keeps the view (`MotionView`'s `exit`), not on unmount. */
export function exitingOf(_keyframes: KeyframesValue, _timing: Timing): unknown {
  return undefined;
}
