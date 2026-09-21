import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { PriceLine, PriceTotal } from '../price-breakdown';
import type { VehicleKind } from '../vehicle-picker';

/**
 * Where a job has got to.
 *
 * `open` is takeable. `taken` and `expired` are CLOSED, and they are a state
 * rather than an absence on purpose: a job the board removed under the reader's
 * thumb is a row that vanished mid-press, which is indistinguishable from a
 * mis-tap. A closed job keeps its place and says what happened to it.
 */
export type JobOfferState = 'open' | 'taken' | 'expired';

/** What the board orders by. */
export type JobBoardSort = 'pay' | 'distance' | 'soonest' | 'expiring';

/** `comfortable` is the board; `compact` fits a sheet or a side panel. */
export type JobCardDensity = 'comfortable' | 'compact';

/**
 * One end of the job, or a stop along it.
 *
 * It is the shape `RouteStops` draws and nothing more — `JobCard` hands these
 * straight to that family rather than drawing a second pin column of its own.
 */
export interface JobPlace {
  /** The line the stop is recognised by — "Rua das Amoreiras 12". */
  title: string;
  /** The rest of it — "Third floor, no lift". */
  subtitle?: string;
  /** A short trailing reading — "2.1 km away". */
  meta?: string;
}

export interface JobOffer {
  /** Identifies the job to `onTake` / `onPass` / `onPressJob`, and keys the row. */
  id: string;
  /** What is being moved — "Two-seater sofa", "Six catering trays". */
  load: string;
  /** A second line about the load — "Heavy; two people at the top floor". */
  loadNote?: string;
  /**
   * What the job pays the person who takes it, PRE-FORMATTED with its currency:
   * `"€38.40"`. Nothing in this family parses, sums, converts or rounds an
   * amount.
   */
  pay: string;
  /** A quieter line under the pay — "Fuel and tolls included". */
  payNote?: string;
  /** What the pay is made of, handed to `PriceSummary` unchanged. */
  payLines?: readonly PriceLine[];
  /** The summary's own total row. Without it the breakdown draws the lines and no rule. */
  payTotal?: PriceTotal;
  /** Where it starts. */
  pickup: JobPlace;
  /** Where it ends. */
  dropoff: JobPlace;
  /** Anything between them, in order. */
  via?: readonly JobPlace[];
  /** How far the whole job is — "11.4 km". A reading, never a number to compare. */
  distance?: string;
  /** How long it should take — "about 40 min". */
  duration?: string;
  /** When it has to happen — "Today, 14:00–16:00". */
  window?: string;
  /** What it has to be carried in — "Van". Drawn beside the load. */
  vehicle?: string;
  /** The vehicle's glyph, drawn in the mark. Defaults to the one for `vehicleKind`. */
  vehicleIcon?: BloomIconComponent;
  /** The vehicle the board FILTERS on. Never drawn; `vehicle` is the words. */
  vehicleKind?: VehicleKind;
  /** How long the offer stands — "Open for 12 min". Drawn as a warning-toned line. */
  expiresIn?: string;
  /** Short nouns drawn as pills after the load — "Two people", "Fragile". */
  tags?: readonly string[];
  /** Default `open`. */
  state?: JobOfferState;
  /**
   * The pay as a NUMBER, for ordering and for the pay filter only. Never drawn,
   * never formatted, and in whatever unit the app compares in — this family
   * only ever asks which of two is larger. A job without it sorts last and
   * survives every pay filter, because a filter cannot exclude what it cannot
   * measure.
   */
  payValue?: number;
  /** The distance in km, for ordering and the distance filter. Same rules. */
  distanceKm?: number;
  /** Minutes until the job STARTS, for ordering and the when filter. Same rules. */
  startsInMinutes?: number;
  /** Minutes until the offer CLOSES, for ordering. Same rules. */
  expiresInMinutes?: number;
}

/** A band on one of the board's filters. `null` is the "any" rung. */
export interface JobBoardBand {
  /** The ceiling this band admits, or `null` for no ceiling. */
  value: number | null;
  /** The words on the chip — "Under 10 km", "Within the hour". */
  label: string;
}

/**
 * What the board is currently showing, as four independent questions. Every
 * field left out is "any".
 */
export interface JobBoardFilter {
  /** Jobs no further than this many km. */
  maxDistanceKm?: number | null;
  /** Jobs paying at least this, in the same unit as `payValue`. */
  minPay?: number | null;
  /** Jobs starting within this many minutes. */
  startsWithinMinutes?: number | null;
  /** Jobs for these vehicles. Empty or omitted is any. */
  vehicles?: readonly VehicleKind[];
}

/** Every word the card and the board speak, in one prop. */
export interface JobBoardLabels {
  /** The take action. Default `"Take the job"`. */
  take?: string;
  /** The pass action. Default `"Pass"`. */
  pass?: string;
  /** Over the distance tile. Default `"Distance"`. */
  distance?: string;
  /** Over the duration tile. Default `"Time"`. */
  duration?: string;
  /** Over the window tile. Default `"Window"`. */
  window?: string;
  /** The pick-up stop's position. Default `"Pick-up"`. */
  pickup?: string;
  /** The drop-off stop's position. Default `"Drop-off"`. */
  dropoff?: string;
  /** The state a closed job announces. Defaults `"Taken"` and `"Expired"`. */
  state?: Partial<Record<Exclude<JobOfferState, 'open'>, string>>;
  /** The breakdown disclosure. Defaults `"Show what it pays"` / `"Hide what it pays"`. */
  showPay?: string;
  hidePay?: string;
  /** Names the itemisation, before the load. Default `"Pay for"`. */
  payDetails?: string;
  /** The sort control's name. Default `"Sort jobs"`. */
  sort?: string;
  /** The filter disclosure. Default `"Filters"`. */
  filtersToggle?: string;
  /**
   * Added to the disclosure's NAME when some dimensions are narrowed — the
   * count is drawn as a bare numeral, which says nothing on its own. Default
   * `` (count) => `${count} applied` ``.
   */
  filtersActive?: (count: number) => string;
  /** The sort options. Defaults `"Best paid"`, `"Nearest"`, `"Starting soonest"`, `"Closing soonest"`. */
  sortOptions?: Partial<Record<JobBoardSort, string>>;
  /** Names each filter row. Defaults `"Distance"`, `"Pay"`, `"When"`, `"Vehicle"`. */
  filters?: { distance?: string; pay?: string; when?: string; vehicle?: string };
  /** The control that puts every filter back to "any". Default `"Clear filters"`. */
  clearFilters?: string;
  /** The refresh control's name — it draws a glyph and no text. Default `"Refresh the board"`. */
  refresh?: string;
  /** The board's heading. Default `` (count) => count === 1 ? '1 job' : `${count} jobs` ``. */
  count?: (count: number) => string;
  /** The loading board's name. Default `"Loading jobs"`. */
  loading?: string;
}

export interface JobCardProps {
  /** The job. */
  job: JobOffer;
  /** Draws the take action. Called with the job's id. Never drawn on a closed job. */
  onTake?: (id: string) => void;
  /** Draws the pass action. Called with the job's id. */
  onPass?: (id: string) => void;
  /** Makes the load block pressable — an app opens the job's detail from here. */
  onPressJob?: (id: string) => void;
  /** Draws the route between the job's ends. Default `true` at `comfortable`. */
  route?: boolean;
  /**
   * Draws the itemisation behind a disclosure under the tiles. Default `true`
   * when the job carries `payLines`; `false` never draws it.
   */
  breakdown?: boolean;
  /** Starts the breakdown open. Default `false`. */
  defaultBreakdownExpanded?: boolean;
  /** Default `comfortable`. */
  density?: JobCardDensity;
  /** Paints the card as the job being looked at: the accent border. */
  selected?: boolean;
  /** Dims the card and stops every action, whatever the job's own state says. */
  disabled?: boolean;
  /** Replaces the two built-in actions entirely. */
  actions?: ReactNode;
  labels?: JobBoardLabels;
  /** Overrides the composed name of the load block. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface JobBoardProps {
  /** The work on offer. Order is the board's, not the caller's — see `sort`. */
  jobs: readonly JobOffer[];
  /** Controlled sort. */
  sort?: JobBoardSort;
  /** Uncontrolled initial sort. Default `pay`. */
  defaultSort?: JobBoardSort;
  onSortChange?: (sort: JobBoardSort) => void;
  /**
   * Which orders are offered, in the order they are drawn. Default all four.
   * An empty array draws no sort control.
   */
  sortOptions?: readonly JobBoardSort[];
  /** Controlled filter. */
  filter?: JobBoardFilter;
  /** Uncontrolled initial filter. Default: every dimension "any". */
  defaultFilter?: JobBoardFilter;
  onFilterChange?: (filter: JobBoardFilter) => void;
  /** The distance bands. Default {@link JOB_DISTANCE_BANDS}. Fewer than two draws no row. */
  distanceBands?: readonly JobBoardBand[];
  /**
   * The pay bands. NO DEFAULT: a band is words plus an amount, and the amount
   * is the app's currency, so a default here would invent one. Fewer than two
   * draws no row.
   */
  payBands?: readonly JobBoardBand[];
  /** The when bands. Default {@link JOB_WHEN_BANDS}. Fewer than two draws no row. */
  whenBands?: readonly JobBoardBand[];
  /**
   * Which vehicles can be filtered on, in the order they are drawn. Default the
   * five `vehicle-picker` knows. An empty array draws no row.
   */
  vehicleKinds?: readonly VehicleKind[];
  /** Controlled filter disclosure. */
  filtersOpen?: boolean;
  /**
   * Starts the filters open. Default `false` — a board is for reading work, and
   * the four dimensions are a tool the reader opens. The control carries the
   * count of what is narrowed, so a folded filter is never a hidden one.
   */
  defaultFiltersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  /** Draws the count line over the board. Default `true`. */
  showCount?: boolean;
  /** Draws the refresh control, and calls this. Without it there is no control. */
  onRefresh?: () => void;
  /** Spins the refresh glyph and disables it. */
  refreshing?: boolean;
  /** Replaces the board with placeholder cards. */
  loading?: boolean;
  /** How many placeholders. Default `3`. */
  loadingCount?: number;
  /** Forwarded to every card. */
  onTake?: (id: string) => void;
  onPass?: (id: string) => void;
  onPressJob?: (id: string) => void;
  /** The job being looked at, if one is. */
  selectedId?: string | null;
  density?: JobCardDensity;
  route?: boolean;
  breakdown?: boolean;
  /** The line over the empty state. Default `"No jobs right now"`. */
  emptyTitle?: string;
  /** Under it. Default explains that the filters may be the reason. */
  emptyDescription?: string;
  /** A control under the empty state. Without one, an active filter draws the clear control there. */
  emptyAction?: ReactNode;
  labels?: JobBoardLabels;
  /** Names the board. Default `"Jobs"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<job id>` for each card. */
  testID?: string;
}
