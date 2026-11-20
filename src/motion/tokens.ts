import type { MotionSpec } from './spec';

/**
 * Bloom's motion, by name: the one table every Bloom animation reads its
 * timing from, and the one the Bloom language's `motion` tokens mirror
 * (its spec.test holds them equal).
 *
 * Curves are cubic-beziers. `inOutQuad` is the cubic form of Reanimated's
 * default `withTiming` curve (`Easing.inOut(Easing.quad)`).
 */
export const EASING = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeOut: [0, 0, 0.58, 1],
  inOutQuad: [0.455, 0.03, 0.515, 0.955],
  outQuart: [0.165, 0.84, 0.44, 1],
  outExpo: [0.16, 1, 0.3, 1],
  backOut: [0.34, 1.2, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingName = keyof typeof EASING;

/**
 * - `press`: press feedback (`PressableScale`).
 * - `present`, `dismiss`: `MOTION_RECIPES`' timings.
 * - `fade`, `slide`, `thumb`: the tab indicator's appearance, the underline's slide and the
 *   pill thumb's (a spring-like settle).
 * - `pop`, `roll`: the engagement bar's glyph pop and count roll.
 * - `enter`, `exit`, `restack`: the toast.
 * - `select`, `expand`: springs in SwiftUI's terms (`response`, `dampingRatio`).
 */
export const MOTION = {
  press: { duration: 100, easing: EASING.inOutQuad },
  select: { response: 0.42, dampingRatio: 0.82 },
  expand: { response: 0.38, dampingRatio: 1 },
  present: { duration: 220, easing: EASING.inOutQuad },
  dismiss: { duration: 150, easing: EASING.inOutQuad },
  fade: { duration: 160, easing: EASING.inOutQuad },
  slide: { duration: 200, easing: EASING.ease },
  thumb: { duration: 300, easing: EASING.backOut },
  pop: { duration: 300, easing: EASING.outExpo },
  roll: { duration: 400, easing: EASING.outExpo },
  enter: { duration: 300, easing: EASING.outQuart },
  exit: { duration: 180, easing: EASING.linear },
  restack: { duration: 600, easing: EASING.outQuart },
} as const satisfies Record<string, MotionSpec>;

export type MotionName = keyof typeof MOTION;

/** How much a view is scaled: a press (`pressed`), a pop's dip and swell. */
export const SCALE = { dip: 0.7, pressed: 0.98, full: 1, swell: 1.2 } as const;
export type ScaleName = keyof typeof SCALE;
