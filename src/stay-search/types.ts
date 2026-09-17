import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonIconComponent } from '../button/types';
import type { StepperSize } from '../stepper';

/**
 * A segment of {@link StaySearchBarProps}. `split` dates mode shows
 * `destination`, `checkIn`, `checkOut`, `guests`; `single` mode shows
 * `destination`, `dates`, `guests`.
 */
export type StaySearchSegment = 'destination' | 'checkIn' | 'checkOut' | 'dates' | 'guests';

/** `split` draws separate "Check in" / "Check out" segments; `single` one "When" segment. */
export type StaySearchDatesMode = 'split' | 'single';

/** Dates as the app has already formatted them (the app owns locale). */
export interface StaySearchDates {
  /** The check-in date, e.g. `"Oct 12"`. */
  checkIn?: string;
  /** The check-out date, e.g. `"Oct 16"`. */
  checkOut?: string;
  /**
   * The single-segment summary, e.g. `"Oct 12 – 16"` or `"Any weekend"`. When
   * absent, `single` mode joins `checkIn` and `checkOut` with an en dash.
   */
  summary?: string;
}

export interface StaySearchBarLabels {
  where: string;
  checkIn: string;
  checkOut: string;
  when: string;
  who: string;
  destinationPlaceholder: string;
  datesPlaceholder: string;
  guestsPlaceholder: string;
  search: string;
}

export interface StaySearchBarProps {
  /** The open segment, or `null` when the bar is at rest. Controlled. */
  activeSegment: StaySearchSegment | null;
  /** A segment was pressed (its key), or the bar was dismissed (`null`). */
  onActiveSegmentChange: (segment: StaySearchSegment | null) => void;
  /** The chosen destination; the placeholder shows while empty. */
  destination?: string;
  /** Pre-formatted dates. */
  dates?: StaySearchDates;
  /** The pre-formatted guest summary, e.g. `"3 guests, 1 pet"`. */
  guests?: string;
  /** `split` (default) or `single`. */
  datesMode?: StaySearchDatesMode;
  /** Override any label, placeholder or the search button text. */
  labels?: Partial<StaySearchBarLabels>;
  /** The search button was pressed. */
  onSearch?: () => void;
  /**
   * The text typed into the destination segment. With
   * `onDestinationQueryChange` set, the open destination segment becomes a
   * text field (focused on open) instead of showing `destination`.
   */
  destinationQuery?: string;
  onDestinationQueryChange?: (query: string) => void;
  /**
   * What drops under the bar while a segment is active, usually a
   * {@link StaySearchPanelProps | StaySearchPanel}. Aligned under the active
   * segment: left for the destination, centred for dates, right for guests.
   */
  panel?: ReactNode;
  /**
   * Close on Escape and on a pointer press outside the bar and its panel
   * (web). Default `true`.
   */
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<segment>` for each segment and `-search`, `-panel`. */
  testID?: string;
}

export interface StaySearchPanelProps {
  children?: ReactNode;
  /** Fixed width. Default: sized by its content. */
  width?: number;
  /** Inner padding. Default `16`. */
  padding?: number;
  /** Names the panel as a `dialog` region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DestinationSuggestion {
  id: string;
  title: string;
  description?: string;
  /** A Remix icon component (`RiMapPinLine`, `RiTimeLine`…). Default `RiMapPinLine`. */
  icon?: ButtonIconComponent;
}

export interface DestinationSuggestionsProps {
  items: readonly DestinationSuggestion[];
  onSelect: (item: DestinationSuggestion) => void;
  /** Optional heading drawn above the rows, e.g. `"Suggested destinations"`. */
  heading?: string;
  /** Controlled highlight. Default: internal (hover and arrow keys). */
  highlightedIndex?: number;
  onHighlightedIndexChange?: (index: number) => void;
  /** Names the listbox. Default: `heading`, else `"Destinations"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<index>` for each row. */
  testID?: string;
}

export type GuestKind = 'adults' | 'children' | 'infants' | 'pets';

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface GuestPickerProps {
  value: GuestCounts;
  /** Receives the counts with the one-adult rule already applied. */
  onChange: (value: GuestCounts) => void;
  /** Upper bound — one number for every kind, or per kind. */
  max?: number | Partial<Record<GuestKind, number>>;
  /** The kinds to show, in order. Default all four. */
  kinds?: readonly GuestKind[];
  /** Override titles. */
  labels?: Partial<Record<GuestKind, string>>;
  /** Override descriptions (`null` hides one). */
  descriptions?: Partial<Record<GuestKind, string | null>>;
  /**
   * The most guests the place takes, counting adults and children (infants and
   * pets do not count). Their `+` buttons disable once the sum reaches it.
   */
  maxGuests?: number;
  /** A line under the rows ("This place has a maximum of 4 guests, not including infants."). */
  note?: ReactNode;
  /**
   * The "Close" link under the rows. Inside a `BookingCard` guests popover it
   * closes the popover by default; elsewhere it renders only when this is set.
   */
  onClose?: () => void;
  /** Default `"Close"`. */
  closeLabel?: string;
  /** Stepper size. Default `'medium'`; `'small'` for a popover. */
  size?: StepperSize;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<kind>` per row (then the stepper's own suffixes). */
  testID?: string;
}

export interface DateFlexibilityOption {
  value: string;
  label: string;
}

export interface DateFlexibilityChipsProps {
  /** The selected option's `value`. */
  value: string;
  onChange: (value: string) => void;
  /** Default: exact, ± 1, ± 2, ± 3, ± 7 days (values `exact`, `1`, `2`, `3`, `7`). */
  options?: readonly DateFlexibilityOption[];
  /** Names the group. Default `"Date flexibility"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<value>` per chip. */
  testID?: string;
}

export interface StaySearchCompactProps {
  onPress: () => void;
  /** Default `"Where to?"`. */
  title?: string;
  /** The secondary line, e.g. `"Anywhere · Any week · Add guests"`. */
  summary?: string;
  /** Shows a round filter button at the right end when set. */
  onFilterPress?: () => void;
  /** The filter button's name. Default `"Filters"`. */
  filterLabel?: string;
  /** The filter glyph. Default `RiEqualizer3Line`. */
  filterIcon?: ButtonIconComponent;
  /** Names the trigger. Default `title` + `summary`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-filter`. */
  testID?: string;
}

export interface StaySearchStepProps {
  /** The short label on the collapsed row, e.g. `"Where"`. */
  label: string;
  /** The value on the collapsed row, e.g. `"I'm flexible"`. */
  summary?: string;
  /** The heading of the expanded card, e.g. `"Where to?"`. Default `label`. */
  title?: string;
  expanded: boolean;
  /** Pressing the collapsed row — expand this step. */
  onPress: () => void;
  /** The expanded card's content. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
