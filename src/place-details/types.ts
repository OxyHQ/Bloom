import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { TransitLine } from '../directions/types';
import type { BloomIconComponent } from '../icons/icon-component';
import type { PlaceOpenState } from '../place-card/types';

// ---------------------------------------------------------------------------
//  PlaceInfoList
// ---------------------------------------------------------------------------

/**
 * What pressing a row DOES. It chooses the trailing glyph and the verb the row
 * is announced with, and nothing else — the clipboard, the dialler and the
 * browser belong to the app.
 *
 * `none` is a row that carries a fact and takes no press (a plus code with
 * nothing to copy to). It is a member rather than "omit `onPress`" because a
 * row can be `disabled` while still being a copy row, and the glyph has to
 * survive that.
 */
export type PlaceInfoAction = 'copy' | 'call' | 'open' | 'directions' | 'edit' | 'none';

/** One row of the block you act on: a glyph, a value, and one thing it does. */
export interface PlaceInfoItem {
  /** Identifies the row; keys it and is handed back to `onPress`. */
  id: string;
  /**
   * The VALUE — the address, the number, the domain, the plus code. It is the
   * row's first line because it is what the reader came for.
   */
  value: string;
  /** What the value is ("Address", "Phone"), drawn quietly under it. */
  label?: string;
  /**
   * How many lines the value may take. Default `2` — a postal address does not
   * fit on one across a phone, and the part that would be cut is the part that
   * identifies it. `0` never truncates.
   */
  numberOfLines?: number;
  /** The glyph on the left. Sized and coloured by the row. */
  icon?: BloomIconComponent;
  /** Default `none`. */
  action?: PlaceInfoAction;
  /** Called with the row's id. A row with neither this nor `href` takes no press. */
  onPress?: (id: string) => void;
  /**
   * Announced instead of the composed `"<label>: <value>, <action>"`. Pass it
   * when the value is not a word a screen reader can read out (a plus code).
   * It replaces the WHOLE name, the action word included.
   */
  accessibilityLabel?: string;
  /**
   * The word for what pressing does, said at the end of the name. Defaults to
   * the action's own English word ({@link PLACE_INFO_ACTION_LABELS}); `''`
   * says nothing.
   */
  actionLabel?: string;
  disabled?: boolean;
}

export interface PlaceInfoListProps {
  items: readonly PlaceInfoItem[];
  /** A heading over the card, in the settings-list register. */
  title?: string;
  /** A quiet line under the card. */
  footer?: string;
  /** Replaces the English action words for every row that does not carry its own. */
  actionLabels?: Partial<Record<PlaceInfoAction, string>>;
  style?: StyleProp<ViewStyle>;
  /** Each row gets `<testID>-<item id>`. */
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PlaceHours
// ---------------------------------------------------------------------------

/** One stretch the place is open. Both ends are pre-formatted by the app. */
export interface PlaceHoursInterval {
  /** "07:30". */
  open: string;
  /** "14:00". */
  close: string;
}

/** One line of the week. */
export interface PlaceHoursDay {
  /** Identifies the day; keys the row. Defaults to `label`. */
  id?: string;
  /** The day's name as drawn ("Monday"). */
  label: string;
  /**
   * The stretches it is open, in order. A day with none is CLOSED — that is
   * the whole encoding, so an app cannot say "closed" and list hours at once.
   */
  intervals?: readonly PlaceHoursInterval[];
  /** This day's closed word, when the default does not fit ("Closed for the season"). */
  closedLabel?: string;
  /**
   * A reason this day is not the usual one ("Public holiday"). Drawn as a
   * badge on the row and added to its announced name.
   */
  exception?: string;
  /** The day the reader is in. Marked on the row and named in its announcement. */
  today?: boolean;
}

export interface PlaceHoursProps {
  /** The week, starting on whichever day the app starts its week on. */
  days: readonly PlaceHoursDay[];
  /**
   * Whether the place is open NOW. Chooses the tone of the state pill; the
   * words are {@link PlaceOpenState}'s, shared with `PlaceCard` so one place
   * cannot be "Open" on the header and "Closing soon" here.
   */
  state?: PlaceOpenState;
  /** Replaces the English state word ("Open", "Closing soon", …). */
  stateLabel?: string;
  /**
   * TODAY'S LINE, pre-formatted and whole: "Open until 20:00", "Closes soon",
   * "Closed — opens 07:30 tomorrow". It is a sentence the app composes, never
   * assembled here from the intervals: a clock, a timezone and a language are
   * three things Bloom does not have.
   */
  summary?: string;
  /** Whether the week is showing. Controlled when set. */
  expanded?: boolean;
  /** Default `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** The word added to today's row. Default `"Today"`. */
  todayLabel?: string;
  /** A day with no intervals. Default `"Closed"`. */
  closedLabel?: string;
  /** Between the two ends of an interval. Default `" – "` (an en dash). */
  intervalSeparator?: string;
  /** Between two intervals of a split day. Default `", "`. */
  splitSeparator?: string;
  /**
   * Names the block. Default `"Opening hours"`.
   *
   * The TOGGLE takes no name of its own: it is named by the state word and the
   * summary it draws, which is the better button name ("Open, Open until
   * 20:00") and the one that cannot disagree with what is on screen.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-toggle`, `-state`, `-summary`, `-week`, `-day-<n>`. */
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PlaceAmenities
// ---------------------------------------------------------------------------

/** How the amenities are drawn. */
export type PlaceAmenitiesLayout = 'list' | 'chips';

/** One thing the place has, or pointedly does not. */
export interface PlaceAmenity {
  /** The thing, in the reader's words ("Step-free entrance"). */
  label: string;
  icon?: BloomIconComponent;
  /** A second line, `list` only ("Ramp at the side door"). */
  description?: string;
  /** `false` strikes the label through and mutes the glyph. Default `true`. */
  available?: boolean;
}

export interface PlaceAmenitiesProps {
  items: readonly PlaceAmenity[];
  /** Default `list`. */
  layout?: PlaceAmenitiesLayout;
  /** `list` only: `auto` (default) is two columns from 560 wide. */
  columns?: 1 | 2 | 'auto';
  /** Draw only the first `limit` amenities. */
  limit?: number;
  /** Draws "Show all" when set and more exist than are drawn. */
  onShowAll?: () => void;
  /** The full count when `items` is already a subset. Default `items.length`. */
  total?: number;
  /** Default `(n) => \`Show all ${n} amenities\``. */
  showAllLabel?: (total: number) => string;
  /** Prefixed to an unavailable amenity's name. Default `"Not available"`. */
  unavailableLabel?: string;
  /** Names the block. `chips` only — the list names each row instead. Default `"Amenities"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PlacePopularTimes
// ---------------------------------------------------------------------------

/**
 * How now compares with the usual. Three members rather than a number because
 * it is the only part of a busyness reading a person acts on, and the word for
 * it ({@link PLACE_BUSY_LABELS}) has to be translatable.
 */
export type PlaceBusyTrend = 'busier' | 'typical' | 'quieter';

/** One hour of the day. */
export interface PlaceBusyHour {
  /** The hour as drawn on the axis ("6a", "12p", "18:00"). */
  label: string;
  /** How busy, 0–100. Clamped; a closed hour draws the empty track whatever this says. */
  value: number;
  /** The place is shut this hour: the track is drawn with no bar. */
  closed?: boolean;
  /** The hour's spoken name ("6 in the morning"), when the label is two characters. */
  accessibilityLabel?: string;
}

/** One day of the week, with its own hours and its own "now". */
export interface PlacePopularTimesDay {
  /** Identifies the day; selects it and keys the bars. */
  id: string;
  /** The day on the switch ("Mon"). Keep it short — seven of these share a row. */
  label: string;
  /** The day's full name, announced instead of the two letters on the switch. */
  accessibilityLabel?: string;
  hours: readonly PlaceBusyHour[];
  /**
   * The hour the reader is IN, as an index into `hours`. Only the day that
   * carries one draws the "now" marker, so switching days drops it — which is
   * the honest answer, since Tuesday has no "now".
   */
  currentHourIndex?: number;
  /** How the current hour compares with its usual. Draws the live line. */
  trend?: PlaceBusyTrend;
  /** Replaces the English trend sentence for this day. */
  trendLabel?: string;
}

export interface PlacePopularTimesProps {
  days: readonly PlacePopularTimesDay[];
  /** The shown day's id. Controlled when set. */
  day?: string;
  /** Defaults to the day carrying a `currentHourIndex`, else the first. */
  defaultDay?: string;
  onDayChange?: (id: string) => void;
  /** The plot's height in px, axis labels excluded. Default `120`. */
  height?: number;
  /** Which of the nine chart hues the bars take. Default `1`, the theme's own seed hue. */
  hue?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Names the day switch. Default `"Day"`. */
  daysLabel?: string;
  /**
   * Names the chart, which is ONE image: the bars are not tab stops and each
   * is two pixels wide. Defaults to a sentence naming the day, the busiest
   * hour and the current one.
   */
  accessibilityLabel?: string;
  /** A day whose `hours` is empty. Default `"No data for this day"`. */
  emptyLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-days`, `-chart`, `-live`, `-bar-<n>`. */
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PlaceTransit
// ---------------------------------------------------------------------------

/** What kind of vehicle stops here. Chooses the stop's glyph. */
export type PlaceTransitMode = 'bus' | 'metro' | 'train' | 'tram' | 'ferry';

/** One vehicle leaving this stop. */
export interface PlaceTransitDeparture {
  /** Identifies the departure; keys the row. */
  id: string;
  /** The line, drawn with `directions`' own `TransitLineBadge`. */
  line: TransitLine;
  /** Where this one is going ("Pla del Bosc"). */
  headsign?: string;
  /** When it leaves, pre-formatted and short ("4 min", "18:42"). Drawn tabular. */
  time: string;
  /**
   * The time came off a vehicle rather than off a timetable. Drawn in the
   * success tone with a dot, and SAID — a colour is not a fact.
   */
  realtime?: boolean;
  /** Replaces the composed row name ("Line L4 to Pla del Bosc, 4 min, live"). */
  accessibilityLabel?: string;
}

/** One stop near the place. */
export interface PlaceTransitStop {
  /** Identifies the stop; keys it and is handed back to `onPressStop`. */
  id: string;
  /** The stop's name ("Plaça de les Bruixes"). */
  name: string;
  /** Default `bus`. */
  mode?: PlaceTransitMode;
  /** How far, pre-formatted ("120 m · 2 min"). */
  distance?: string;
  /**
   * The lines that call here, as badges under the name. Give these even when
   * `departures` is empty: a stop with no vehicle due still tells the reader
   * which lines it is on.
   */
  lines?: readonly TransitLine[];
  /** The next few vehicles, in order. */
  departures?: readonly PlaceTransitDeparture[];
  /** A word about this stop ("Step-free access"). */
  note?: string;
}

export interface PlaceTransitProps {
  stops: readonly PlaceTransitStop[];
  /** Makes each stop's header pressable — an app pans its map to the stop. */
  onPressStop?: (id: string) => void;
  /** Draw only this many departures per stop. Default: all of them. */
  departureLimit?: number;
  /** The word added to a live departure's name. Default `"live"`. */
  realtimeLabel?: string;
  /** A stop with no departures. Default `"No departures right now"`. */
  emptyLabel?: string;
  /** Names the list. Default `"Nearby transit"`. */
  accessibilityLabel?: string;
  /** Extra content under the stops — a "see all stops" button. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-stop-<n>`, `-stop-<n>-departure-<m>`. */
  testID?: string;
}
