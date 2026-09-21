import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiLoopRightLine } from '../icons/remix/RiLoopRightLine';
import type { BloomIconComponent } from '../icons/icon-component';
import { borderRadius } from '../styles/tokens';
import type { AccentTone } from '../theme/accent-colors';
import type { NavigationBannerState } from './types';

export interface NavigationBannerGeometry {
  /** The pane's radius. A banner is a SURFACE, so it takes a rung of the scale, not the pill. */
  radius: number;
  /** The pane's padding. */
  padding: number;
  /** The maneuver glyph's square. */
  glyph: number;
  /** The glyph drawn inside it. */
  glyphIcon: number;
  /** The smaller glyph on the "then" line, and on a lane arrow. */
  smallGlyph: number;
  /** One lane cell's height. */
  lane: number;
  /** One lane cell's minimum width — a cell with one arrow. */
  laneWidth: number;
  /** The speed sign's outer diameter. */
  sign: number;
  /** The ring around it. */
  signRing: number;
}

/**
 * 56 for the maneuver glyph is the largest square that leaves the distance
 * figure room on a 390 phone with the pane's own padding either side, and the
 * glyph is the one thing on the banner a driver reads without focusing.
 *
 * The speed sign is 48 with a 4 ring: below 44 the number stops being legible
 * at arm's length, and a ring thinner than 4 stops reading as a sign at all.
 */
export const NAVIGATION_BANNER_GEOMETRY: NavigationBannerGeometry = {
  radius: borderRadius.lg,
  padding: 14,
  glyph: 56,
  glyphIcon: 40,
  smallGlyph: 18,
  lane: 38,
  laneWidth: 30,
  sign: 48,
  signRing: 4,
};

/** The glyph each exceptional state draws in place of a maneuver. */
export const NAVIGATION_STATE_ICON: Readonly<
  Record<Exclude<NavigationBannerState, 'guiding'>, BloomIconComponent>
> = {
  'off-route': RiErrorWarningLine,
  rerouting: RiLoopRightLine,
};

/**
 * The tone each exceptional state paints.
 *
 * `rerouting` is `warning` rather than `error`: nothing is wrong yet, the app
 * is working, and a red banner at that moment tells a driver to act when the
 * only correct action is to keep driving. `off-route` IS the error — the line
 * on the map no longer describes where the car is.
 */
export const NAVIGATION_STATE_TONE: Readonly<
  Record<Exclude<NavigationBannerState, 'guiding'>, AccentTone>
> = {
  'off-route': 'error',
  rerouting: 'warning',
};

/** The English default headline for each exceptional state. */
export const NAVIGATION_STATE_LABELS: Readonly<
  Record<Exclude<NavigationBannerState, 'guiding'>, string>
> = {
  'off-route': 'Off route',
  rerouting: 'Finding a new route',
};
