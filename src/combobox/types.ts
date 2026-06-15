import type { StyleProp, ViewStyle } from 'react-native';

export interface ComboboxOption<T = string> {
  /** Stable value used for selection + comparison. */
  value: T;
  /** Display label. */
  label: string;
  /** Optional secondary text shown beneath the label. */
  description?: string;
  /** Disable selecting this option. */
  disabled?: boolean;
}

export interface ComboboxProps<T = string> {
  /** All selectable options. */
  options: ComboboxOption<T>[];
  /** Currently selected value (controlled). `null` = nothing selected. */
  value: T | null;
  /** Fired when the user picks an option. */
  onValueChange: (value: T) => void;
  /** Placeholder shown in the input when nothing is selected. */
  placeholder?: string;
  /** Accessible label for the input. Defaults to `placeholder` or `'Search'`. */
  label?: string;
  /** Text shown when the filtered list is empty. Defaults to `'No results'`. */
  emptyText?: string;
  /**
   * Custom filter predicate. Defaults to a case-insensitive substring match
   * against `label` and `description`.
   */
  filter?: (option: ComboboxOption<T>, query: string) => boolean;
  /** Controlled query text. When omitted the combobox owns the query. */
  query?: string;
  /** Notified on query changes (works controlled or uncontrolled). */
  onQueryChange?: (query: string) => void;
  disabled?: boolean;
  /** Max height of the option list in px. Defaults to `280`. */
  maxListHeight?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
