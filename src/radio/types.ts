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
  /**
   * The control's id. Inside a `Field` the field supplies one, so the label's
   * `htmlFor` points at this control on web.
   */
  nativeID?: string;
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
   * The group's accessible name.
   *
   * A `radiogroup` with no name announces a list of options and nothing about
   * what is being chosen, so this or an enclosing `Field`'s label has to supply
   * one.
   */
  label?: string;
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
  /**
   * `default` renders each option as a `Radio` row; `card` as a `RadioCard`
   * (title + description left, the dot right, the whole
   * card selectable). A card's title is the option's `label`.
   */
  variant?: 'default' | 'card';
  testID?: string;
}

export interface RadioCardProps<Value extends string = string> {
  /** The value this card stands for. */
  value: Value;
  /** Whether this card is the selected one. */
  selected: boolean;
  /** Called with `value` when the card is chosen. Re-choosing it is a no-op. */
  onSelect: (value: Value) => void;
  /** The card's title (one line); also its accessible name. */
  title: string;
  /** Optional one-line description under the title. */
  description?: string;
  /** Dims the whole card and stops it selecting. */
  disabled?: boolean;
  /** Accent for the selected dot. Uses the theme primary by default. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}
