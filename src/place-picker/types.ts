import type { StyleProp, ViewStyle } from 'react-native';

import type { TextFieldSize } from '../text-field/shared';

/** A point on the Earth, in WGS 84 degrees. */
export interface PlacePickerCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * One place the picker can offer and hold. Whatever answered the search — a
 * geocoder, a places API, a saved-address book — maps its result to this.
 * Extra fields ride along untouched: the picker hands the SAME object back in
 * `onValueChange`, so an app can carry its own address parts on it.
 */
export interface PlacePickerOption {
  /** Stable across requests, so a list can be keyed and diffed. */
  id: string;
  /** What the row reads first: a name, or the street and number. */
  title: string;
  /** The quieter second line: the locality, the region, the country. */
  subtitle?: string;
  coordinate: PlacePickerCoordinate;
}

/** Where a search for the current text stands. */
export type PlacePickerStatus = 'idle' | 'loading' | 'error' | 'ready';

/** The words `PlacePicker` composes. Each defaults to the locale's (`BloomProvider locale`); one given here wins. */
export interface PlacePickerLabels {
  /** Names the result list (`"Places"`). */
  results?: string;
  /** While a search is in flight (`"Searching…"`). */
  searching?: string;
  /** A finished search that found nothing, given the text searched for. */
  noResults?: (query: string) => string;
  /** A search that failed. */
  failed?: string;
  /** The retry button after a failure. */
  retry?: string;
  /** The live announcement of a finished search, given how many it found. */
  resultCount?: (count: number) => string;
  /** The button that puts a chosen place back to searching. */
  change?: string;
}

export interface PlacePickerProps<Option extends PlacePickerOption = PlacePickerOption> {
  /** The chosen place, or `null` while none is. Controlled — the app owns it. */
  value: Option | null;
  /** Called with the place pressed in the list, and with `null` by "Change". */
  onValueChange: (value: Option | null) => void;
  /** The text in the field. Controlled, so the app can key its search on it. */
  query: string;
  /** Every keystroke. Debounce before it leaves the device (`useDebouncedValue`). */
  onQueryChange: (query: string) => void;
  /**
   * The answer for the CURRENT text. The picker draws no list until the text
   * reaches `minQueryLength`, so results kept from a longer query never show
   * under a shorter one.
   */
  results: ReadonlyArray<Option>;
  /**
   * `loading` (draws the spinner line, keeps any results it has), `error`
   * (draws the failure and `onRetry`), `ready` (draws the results or "no
   * places"). Default `ready`.
   */
  status?: PlacePickerStatus;
  /** Offered as a button beside a failure. Without it the failure is text only. */
  onRetry?: () => void;
  /** Characters typed before the list appears. Default `3`. */
  minQueryLength?: number;
  /** The field's name, and its placeholder unless `placeholder` is given. */
  label: string;
  placeholder?: string;
  /**
   * Default `md` (36 tall); `sm` is 32. Omitted, it is INHERITED from the
   * nearest `BloomScope`, the same vocabulary `TextField` takes.
   */
  size?: TextFieldSize;
  disabled?: boolean;
  /** Paints the error shell. Combined with an enclosing `Field`'s, never replaced. */
  invalid?: boolean;
  /** Always wins, over `label` AND over an enclosing `Field`'s label. */
  accessibilityLabel?: string;
  /** An id the caller wired itself. Outranks the one a `Field` supplies. */
  nativeID?: string;
  labels?: PlacePickerLabels;
  style?: StyleProp<ViewStyle>;
  /** Parts: `-input`, `-results`, `-result-<id>`, `-status`, `-selected`, `-change`, `-retry`. */
  testID?: string;
}
