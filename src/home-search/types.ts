import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { CalendarConstraintProps } from '../date-picker';
import type { PropertyType, PropertyTypeTilesProps } from '../stay-filters';
import type { BloomIconComponent } from '../icons/icon-component';

/** The housing search modes, in their default order. */
export type HomeSearchMode = 'rent' | 'buy' | 'stays' | 'swap';

/** One segment of a {@link HomeSearchBarProps | HomeSearchBar}. */
export interface HomeSearchSegment<K extends string = string> {
  /** Stable identity; what `activeSegment` speaks. */
  key: K;
  /** The small bold label ("Budget"). */
  label: string;
  /** The value, pre-formatted by the app ("€800 – €1,200"). The placeholder shows while empty. */
  value?: string;
  /** Shown while `value` is empty ("Add budget"). */
  placeholder: string;
  /** Relative width. Default `1`. */
  flex?: number;
  /**
   * Where `panel` aligns while this segment is open. Default: `start` for the
   * first segment, `end` for the last, `center` between.
   */
  panelAlign?: 'start' | 'center' | 'end';
}

/** The segment keys of each mode's preset. */
export interface HomeSearchSegmentKeys {
  rent: 'location' | 'moveIn' | 'budget';
  buy: 'location' | 'price' | 'propertyType';
  stays: 'destination' | 'checkIn' | 'checkOut' | 'guests';
  swap: 'destination' | 'dates' | 'homeSize';
}

/** Per-key overrides for {@link homeSearchSegments}. */
export type HomeSearchSegmentOverrides<K extends string> = Partial<Record<K, Partial<Omit<HomeSearchSegment<K>, 'key'>>>>;

export interface HomeSearchBarProps<K extends string = string> {
  /** The segments, left to right. The last one holds the search button. */
  segments: readonly HomeSearchSegment<K>[];
  /** The open segment, or `null` when the bar is at rest. Controlled. */
  activeSegment: K | null;
  /** A segment was pressed (its key), or the bar was dismissed (`null`). */
  onActiveSegmentChange: (segment: K | null) => void;
  /** The search button was pressed. */
  onSearch?: () => void;
  /** The search button's text and name. Default `"Search"`. */
  searchLabel?: string;
  /**
   * The text typed into the FIRST segment (a location). With `onQueryChange`
   * set, the open first segment becomes a text field (focused on open).
   */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** What drops under the bar while a segment is open, usually a `StaySearchPanel`. */
  panel?: ReactNode;
  /** Close on Escape and on a pointer press outside the bar and its panel (web). Default `true`. */
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<key>` per segment, `-separator-<index>`, `-search`, `-panel` and `-<firstKey>-input`. */
  testID?: string;
}

export interface SearchModeTabsProps<K extends string = HomeSearchMode> {
  /** The selected mode. */
  value: K;
  onValueChange: (mode: K) => void;
  /** Which modes, in order. Default `rent`, `buy`, `stays`, `swap`. */
  modes?: readonly K[];
  /** Override labels by key. Defaults: Rent, Buy, Vacation rentals, Swap. */
  labels?: Partial<Record<K, string>>;
  /** `tabs` (default): text tabs with an underline. `segmented`: a pill `SegmentedControl`, for a phone. */
  variant?: 'tabs' | 'segmented';
  /** Names the tablist. Default `"Search mode"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<key>` per tab. */
  testID?: string;
}

export type BudgetPeriod = 'month' | 'total';

/** A ready budget range; `null` is open-ended. */
export interface BudgetPreset {
  min: number | null;
  max: number | null;
  /** Default: "Up to €800", "€800 – €1,200", "€1,800+" from `formatAmount`. */
  label?: string;
}

export interface BudgetPickerProps {
  /** `[min, max]`; `null` is "no minimum" / "no maximum" (controlled). */
  value: [number | null, number | null];
  onValueChange: (value: [number | null, number | null]) => void;
  /** `month` (default): rent per month. `total`: a sale price. Picks the default presets, title and step. */
  period?: BudgetPeriod;
  /** Quick ranges shown as chips. Default four per period. `[]` hides the row. */
  presets?: readonly BudgetPreset[];
  /**
   * Formats an amount for the fields and preset labels. The component computes
   * (presets, clamping, snapping), so amounts arrive as numbers; the app owns
   * currency and locale here. Default `String(n)`.
   */
  formatAmount?: (amount: number) => string;
  /** Default `"Monthly budget"` / `"Price"`. */
  title?: string;
  /** Default `"Rent per month, before bills"` / `"Total price"`; `null` hides it. */
  description?: string | null;
  /** Default `"Minimum"`. */
  minLabel?: string;
  /** Default `"Maximum"`. */
  maxLabel?: string;
  /** Typed amounts snap to it. Default `50` per month, `5000` total. */
  step?: number;
  /** Names the preset group. Default `"Budget presets"`. */
  presetsLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-min`, `-max`, `-preset-<index>`. */
  testID?: string;
}

/** How the move-in date is given: a day, "Flexible", or "As soon as possible". */
export type MoveInTiming = 'date' | 'flexible' | 'asap';

export interface MoveInValue {
  timing: MoveInTiming;
  /** The day, while `timing` is `date`. */
  date: Date | null;
  /** A contract length option's `value` (default options `any`, `short`, `medium`, `long`). */
  contractLength: string;
}

export interface MoveInOption {
  value: string;
  label: string;
}

export interface MoveInPickerProps extends CalendarConstraintProps {
  value: MoveInValue;
  /**
   * Picking a day reports `timing: 'date'`; choosing a timing chip reports
   * that timing with `date: null` (pressing it again returns to `date`).
   */
  onValueChange: (value: MoveInValue) => void;
  /** Default Any, 1–6 months, 6–12 months, 1+ year. */
  contractLengths?: readonly MoveInOption[];
  /** Month shown first. */
  defaultMonth?: Date;
  /** Override any heading or chip label. */
  labels?: Partial<MoveInPickerLabels>;
  style?: StyleProp<ViewStyle>;
  /** Derives `-calendar`, `-flexible`, `-asap`, `-length-<value>`. */
  testID?: string;
}

export interface MoveInPickerLabels {
  date: string;
  flexible: string;
  asap: string;
  contractLength: string;
}

export type PropertyTypePickerProps<T extends string = PropertyType> = PropertyTypeTilesProps<T>;

export interface SavedSearchCardProps {
  /** The search's name ("2-bed flats in Old Halden"). */
  title: string;
  /** The criteria as short pre-formatted strings, drawn as chips ("€800 – €1,200", "2+ bedrooms"). */
  criteria?: readonly string[];
  /** New results since the last visit; a badge shows above `0`. */
  newCount?: number;
  /** The badge's text and name. Default `` (n) => `${n} new` ``. */
  formatNewCount?: (count: number) => string;
  /** How often alerts go out, pre-formatted ("Daily alerts"). `undefined` shows `alertsOffLabel`. */
  alertFrequency?: string;
  /** Default `"Alerts off"`. */
  alertsOffLabel?: string;
  /** A small icon tile beside the title. Default a search glyph. */
  icon?: SavedSearchIcon;
  /** Opens the search's results; makes the title block a button. */
  onPress?: () => void;
  /** Draws an "Edit" button. */
  onEdit?: () => void;
  /** Draws a delete icon button. */
  onDelete?: () => void;
  /** Default `"Edit"`. */
  editLabel?: string;
  /** Default `"Delete"`. */
  deleteLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-open`, `-badge`, `-edit`, `-delete`. */
  testID?: string;
}

/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type SavedSearchIcon = BloomIconComponent;

export interface SaveSearchButtonProps {
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
  /** Default `"Save search"`. */
  label?: string;
  /** Default `"Saved"`. */
  savedLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
