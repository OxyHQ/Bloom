import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { RiCarLine } from '../icons/remix/RiCarLine';
import { RiSubwayLine } from '../icons/remix/RiSubwayLine';
import { RiWalkLine } from '../icons/remix/RiWalkLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { DirectionsManeuver, DirectionsMode, DirectionsTraffic } from './types';

/** The English default mode words. */
export const DIRECTIONS_MODE_LABELS: Readonly<Record<DirectionsMode, string>> = {
  drive: 'Drive',
  transit: 'Transit',
  walk: 'Walk',
  cycle: 'Cycle',
};

/** The glyph each mode draws — on the switcher, on a leg header, on a route row. */
export const DIRECTIONS_MODE_ICON: Readonly<Record<DirectionsMode, BloomIconComponent>> = {
  drive: RiCarLine,
  transit: RiSubwayLine,
  walk: RiWalkLine,
  cycle: RiBikeLine,
};

/** The English default traffic words. */
export const DIRECTIONS_TRAFFIC_LABELS: Readonly<Record<DirectionsTraffic, string>> = {
  light: 'Light traffic',
  moderate: 'Moderate traffic',
  heavy: 'Heavy traffic',
};

/**
 * Which tone the traffic badge takes.
 *
 * `light` is `success` rather than `default` on purpose: a clear road is GOOD
 * news and the reader is scanning for it, and a neutral pill beside a red one
 * reads as "no information" rather than as "clear".
 */
export const DIRECTIONS_TRAFFIC_TONE: Readonly<Record<DirectionsTraffic, AccentTone>> = {
  light: 'success',
  moderate: 'warning',
  heavy: 'error',
};

/**
 * The word each maneuver is announced with, before the instruction.
 *
 * The glyph says it on screen and says NOTHING to a screen reader, which is the
 * same mechanism `RouteStops` records for its marker shapes. The instruction
 * usually repeats it ("Turn right onto…"), and that is fine: a repeated word is
 * cheap and a missing one is not recoverable.
 */
export const DIRECTIONS_MANEUVER_LABELS: Readonly<Record<DirectionsManeuver, string>> = {
  depart: 'Depart',
  straight: 'Continue straight',
  'slight-left': 'Slight left',
  left: 'Turn left',
  'sharp-left': 'Sharp left',
  'slight-right': 'Slight right',
  right: 'Turn right',
  'sharp-right': 'Sharp right',
  uturn: 'Make a U-turn',
  roundabout: 'At the roundabout',
  merge: 'Merge',
  arrive: 'Arrive',
  board: 'Board',
  alight: 'Get off',
  transfer: 'Change',
  walk: 'Walk',
};

/** The leg header's glyph, and the gap above a leg's steps — `address`' own rungs. */
export const DIRECTIONS_LEG_GLYPH = 16;
