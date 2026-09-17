import { Easing } from 'react-native-reanimated';

/**
 * The soft ease (`cubic-bezier(0.22, 1, 0.36, 1)`), as a reanimated
 * easing. Every eased motion in a log — the unit reveal, and the collapses and
 * swaps a consumer builds beside it — runs on this one curve.
 */
export const AGENT_LOG_SOFT_EASE = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * The unit reveal ("blur-in"). A unit lands from 6px of
 * blur, a 4px lift and zero height; the height runs a touch shorter than the
 * text so the row has finished making space slightly before the words finish
 * sharpening. The soft clipping edge (`fadePx`) resolves last.
 */
export const AGENT_LOG_UNIT_MOTION = {
  /** Height 0 → content, ms. */
  heightMs: 380,
  /** Opacity, blur and lift, ms. */
  revealMs: 420,
  /** The soft clipping edge 22px → 0, ms. */
  fadeMs: 440,
  liftPx: 4,
  blurPx: 6,
  fadePx: 22,
} as const;

/**
 * Tree-guide geometry. The elbow sits 14px from the row's top — half the 20px
 * line plus the row's 4px top padding — so a wrapping label still branches at
 * its first line; it turns on a 6px radius and runs 12px out to the label.
 */
export const AGENT_LOG_BRANCH = {
  y: 14,
  radius: 6,
  width: 12,
} as const;

/** The row's left inset that makes room for the guide (`pl-4`). */
export const AGENT_LOG_ROW_INDENT = 16;
