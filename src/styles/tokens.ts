import { RADIUS, SPACING } from '../design-tokens/scales';

/**
 * The t-shirt-keyed VIEW of `design-tokens/scales.ts`.
 *
 * Bloom addresses one physical scale in two vocabularies: class names use the
 * numeric keys (`p-space-12`, `rounded-radius-20`) and inline RN styles use the
 * t-shirt keys (`space.md`, `borderRadius.xl`). Both are needed — a className is
 * inert on web without the consumer's Tailwind pipeline, and `atoms` has to work
 * without one — but only ONE of them may own the numbers, or they disagree. They
 * did: `borderRadius.full` was 999 against `radius-max` 9999, `borderRadius` had
 * no 28 and `RADIUS` had no 16, and each file's own comments claimed to match the
 * other. `scales.ts` is the authority (the Tailwind preset, `theme.css` and
 * `tokens.json` are generated from it); everything below reads it by reference,
 * so a rung cannot exist in one spelling and not the other.
 *
 * `fontSize`, `lineHeight`, `animation` and `gradients` stay declared here: the
 * authority's `TYPOGRAPHY` is a ROLE scale (`body`, `caption`, `headerBold`) with
 * its own sizes, not a raw ramp, so folding them together would be a type
 * redesign rather than a reconciliation.
 */
export const space = {
  _2xs: SPACING['space-2'],
  xs: SPACING['space-4'],
  sm: SPACING['space-8'],
  md: SPACING['space-12'],
  lg: SPACING['space-16'],
  xl: SPACING['space-20'],
  _2xl: SPACING['space-24'],
  _3xl: SPACING['space-32'],
  _4xl: SPACING['space-40'],
  _5xl: SPACING['space-60'],
} as const;

/**
 * Font size tokens.
 */
export const fontSize = {
  _2xs: 10,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  _2xl: 22,
  _3xl: 26,
  _4xl: 32,
  _5xl: 40,
} as const;

/**
 * Line height multipliers.
 */
export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.625,
} as const;

/**
 * Border radius tokens — the t-shirt view of `RADIUS`. `full` is the pill rung
 * (`radius-max`); see `scales.ts` for why it is 9999 rather than 999.
 */
export const borderRadius = {
  _2xs: RADIUS['radius-2'],
  xs: RADIUS['radius-4'],
  sm: RADIUS['radius-8'],
  md: RADIUS['radius-12'],
  lg: RADIUS['radius-16'],
  xl: RADIUS['radius-20'],
  _2xl: RADIUS['radius-24'],
  _3xl: RADIUS['radius-28'],
  full: RADIUS['radius-max'],
} as const;

/**
 * Gradient definitions for icon system.
 */
/**
 * Animation timing and spring tokens.
 * Centralized values ensure consistent motion across all components.
 */
export const animation = {
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
  },
  spring: {
    snappy: { friction: 8, tension: 100 },
    gentle: { friction: 8, tension: 60 },
    bouncy: { friction: 6, tension: 120 },
  },
  /**
   * How far a HELD control shrinks. One number for the whole library.
   *
   * It used to be five, chosen per family — 0.97 on `Button` and `Tabs`, 0.95 on
   * `Chip`, 0.94 on `Fab` and `FrostedIconButton`, 0.90 on `Checkbox` and
   * `Radio` — each justified locally by the size of the target, which is a real
   * argument and still produced a library where the same gesture reads as five
   * different amounts of feedback. At 0.90 a checkbox visibly SQUASHES; that is
   * the effect the value moved away from, and it was ten times deeper than the
   * one that prompted the change.
   *
   * 0.99 is a tactile hint you feel rather than watch — roughly 0.4px on a 40dp
   * button and 0.16px on a 16px checkbox. The suppression rules that decide
   * whether it runs at all live in `hooks/use-press-animation.ts`.
   *
   * Declared here rather than beside the hook because the raw-DOM web forks need
   * it too, and this module imports no react-native — a fork that renders through
   * react-dom must not pull the RN runtime in behind a constant.
   */
  pressScale: 0.99,
} as const;

/**
 * Gradient definitions for icon system.
 */
export const gradients = {
  primary: {
    values: [
      [0, '#054CFF'],
      [0.4, '#1085FE'],
      [0.6, '#1085FE'],
      [1, '#59B9FF'],
    ] as Array<[number, string]>,
    hover_value: '#1085FE',
  },
  sky: {
    values: [
      [0, '#0A7AFF'],
      [1, '#59B9FF'],
    ] as Array<[number, string]>,
    hover_value: '#0A7AFF',
  },
} as const;
