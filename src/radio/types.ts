import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type RadioSize = 'small' | 'medium' | 'large';

/**
 * One option in a {@link RadioGroupProps} group.
 *
 * Deliberately the same shape as the props a standalone {@link RadioProps}
 * takes, minus the state the group owns: a group is the list of its options, not
 * a second component with its own vocabulary.
 */
export interface RadioProps<Value extends string = string> {
  /** The value this option stands for. */
  value: Value;
  /** Whether this option is the selected one. */
  selected: boolean;
  /** Called with `value` when the option is chosen. Selecting the already-selected
   * option is a no-op — a radio, unlike a checkbox, cannot be un-chosen. */
  onSelect: (value: Value) => void;
  /** Optional label text. */
  label?: string;
  /** Optional description shown below the label. */
  description?: string;
  /** Size preset. */
  size?: RadioSize;
  /** Whether the option is disabled. */
  disabled?: boolean;
  /** Colour of the selected indicator. Uses the theme primary by default. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/** One option, as data, for {@link RadioGroupProps}. */
export interface RadioOption<Value extends string = string> {
  value: Value;
  label?: string;
  description?: string;
  disabled?: boolean;
  testID?: string;
}

export interface RadioGroupProps<Value extends string = string> {
  /**
   * The group's accessible name. Required: a `radiogroup` with no name announces
   * a list of options and nothing about what is being chosen.
   */
  label: string;
  /** The selected value, or `undefined` for a group with nothing chosen yet. */
  value: Value | undefined;
  /** Called with the newly chosen value. */
  onValueChange: (value: Value) => void;
  /** The options, in order. */
  options: ReadonlyArray<RadioOption<Value>>;
  /** Size preset, applied to every option. */
  size?: RadioSize;
  /** Disables every option. An option may also disable itself. */
  disabled?: boolean;
  /** Colour of the selected indicator. Uses the theme primary by default. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
}
