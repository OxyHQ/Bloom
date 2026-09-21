import { RADIUS } from '../design-tokens/scales';
import type { AccentTone } from '../theme/accent-colors';
import type { VehicleKind } from '../vehicle-picker';
import type { JobBoardBand, JobBoardLabels, JobBoardSort, JobOfferState } from './types';

/** Every default word the card and the board draw. */
export const JOB_BOARD_LABELS: Required<
  Omit<JobBoardLabels, 'state' | 'sortOptions' | 'filters'>
> & {
  state: Record<Exclude<JobOfferState, 'open'>, string>;
  sortOptions: Record<JobBoardSort, string>;
  filters: Required<NonNullable<JobBoardLabels['filters']>>;
} = {
  take: 'Take the job',
  pass: 'Pass',
  distance: 'Distance',
  duration: 'Time',
  window: 'Window',
  pickup: 'Pick-up',
  dropoff: 'Drop-off',
  state: { taken: 'Taken', expired: 'Expired' },
  showPay: 'Show what it pays',
  hidePay: 'Hide what it pays',
  payDetails: 'Pay for',
  sort: 'Sort jobs',
  filtersToggle: 'Filters',
  filtersActive: (count: number) => `${count} applied`,
  sortOptions: {
    pay: 'Best paid',
    distance: 'Nearest',
    soonest: 'Starting soonest',
    expiring: 'Closing soonest',
  },
  filters: { distance: 'Distance', pay: 'Pay', when: 'When', vehicle: 'Vehicle' },
  clearFilters: 'Clear filters',
  refresh: 'Refresh the board',
  count: (count: number) => (count === 1 ? '1 job' : `${count} jobs`),
  loading: 'Loading jobs',
};

/**
 * The tone a closed job is painted in.
 *
 * `taken` is the DEFAULT neutral: someone else got there first, which is an outcome of a
 * marketplace working rather than something that went wrong. `expired` is
 * `warning`, because the offer ran out while the reader was looking at it and
 * that is the one closure a refresh would have prevented.
 */
export const JOB_STATE_TONE: Record<Exclude<JobOfferState, 'open'>, AccentTone> = {
  taken: 'default',
  expired: 'warning',
};

/** The four orders a board offers, in the order they are drawn. */
export const JOB_BOARD_SORTS: readonly JobBoardSort[] = ['pay', 'distance', 'soonest', 'expiring'];

/**
 * The default distance bands.
 *
 * Four rungs rather than a slider: a courier does not think in a continuum, they
 * think "in my street", "in my quarter", "across town" and "anywhere". Kilometres
 * are the unit `distanceKm` is compared in; an app on miles supplies its own
 * bands and its own words.
 */
export const JOB_DISTANCE_BANDS: readonly JobBoardBand[] = [
  { value: null, label: 'Any distance' },
  { value: 3, label: 'Under 3 km' },
  { value: 10, label: 'Under 10 km' },
  { value: 25, label: 'Under 25 km' },
];

/** The default when bands, in minutes from now. */
export const JOB_WHEN_BANDS: readonly JobBoardBand[] = [
  { value: null, label: 'Any time' },
  { value: 60, label: 'Within the hour' },
  { value: 240, label: 'Next 4 hours' },
  { value: 1440, label: 'Today' },
];

/** The vehicles a board filters on by default, smallest first. */
export const JOB_VEHICLE_KINDS: readonly VehicleKind[] = [
  'bike',
  'car',
  'van',
  'boxTruck',
  'refrigerated',
];

/**
 * The card's geometry, as numbers rather than as prose.
 *
 * `narrowWidth` is the card's OWN width under which the actions drop their
 * labels to glyphs and the tiles stack two by two — the same measurement for
 * both, and the same 420 `carrier-quote` uses, because the two cards are the
 * same object seen from the two sides of the table and a reader moving between
 * them must not meet two different breakpoints. `mark` is the vehicle tile: 48
 * on the card, where the carrier's card puts the 48 avatar, and 36 in a compact
 * row.
 */
export const JOB_BOARD_GEOMETRY = {
  padding: 16,
  gap: 16,
  tileGap: 8,
  tilePadding: 12,
  tileRadius: RADIUS['radius-12'],
  radius: RADIUS['radius-20'],
  narrowWidth: 420,
  mark: { comfortable: 48, compact: 36 },
  rowMinHeight: 64,
  /** The drawn size of an action; a `hitSlop` takes it to 44 for a thumb. */
  actionHit: { top: 6, bottom: 6, left: 6, right: 6 },
  /** The refresh control's target. */
  refresh: 40,
} as const;

export type JobBoardGeometry = typeof JOB_BOARD_GEOMETRY;
