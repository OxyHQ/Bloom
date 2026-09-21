import type { AccentTone } from '../theme/accent-colors';
import type { PlaceOpenState } from './types';

/** The English default state words. */
export const PLACE_OPEN_LABELS: Readonly<Record<PlaceOpenState, string>> = {
  open: 'Open',
  'closing-soon': 'Closing soon',
  closed: 'Closed',
  'opening-soon': 'Opens soon',
};

/**
 * Which tone each state's `Badge` takes. `closing-soon` and `opening-soon` are
 * both `warning`: one is about to stop being useful and the other is about to
 * start, and in both cases the answer to "can I go now" is "not quite".
 */
export const PLACE_OPEN_TONE: Readonly<Record<PlaceOpenState, AccentTone>> = {
  open: 'success',
  'closing-soon': 'warning',
  closed: 'error',
  'opening-soon': 'warning',
};

export interface PlaceCardGeometry {
  /** The detail cover's height. */
  cover: number;
  /** The detail card's corner. */
  radius: number;
  /** Inside the detail card. */
  padding: number;
  /** Between the detail card's blocks. */
  blockGap: number;
  /** A stat tile's corner and padding. */
  tileRadius: number;
  tilePadding: number;
  /** Between two actions. */
  actionGap: number;
}

/**
 * One place, two densities — and only the DETAIL side has geometry of its own.
 * The row reuses `listing-card`'s compact thumbnail (112 square, radius 12) and
 * its 12 gap, because a result row over a map and a listing row in a list are
 * the same row with different words in it.
 */
export const PLACE_CARD_GEOMETRY: PlaceCardGeometry = {
  cover: 165,
  radius: 24,
  padding: 16,
  blockGap: 15,
  tileRadius: 10,
  tilePadding: 10,
  actionGap: 10,
};
