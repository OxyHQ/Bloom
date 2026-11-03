import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** One choice of a {@link ChoiceListProps} list. */
export interface ChoiceListOption<Value extends string = string> {
  value: Value;
  /** Its name: what a screen reader says of it. Nothing of it is drawn but `renderContent`. */
  label: string;
  disabled?: boolean;
  testID?: string;
}

/** What an option is now, for its drawn content. */
export interface ChoiceListOptionState {
  /** The chosen option. */
  selected: boolean;
  disabled: boolean;
}

export interface ChoiceListProps<Value extends string = string> {
  /** The list's name (the accounts, the profiles): what a screen reader says of the whole. */
  label: string;
  /** The chosen option; the list is controlled. */
  value: Value;
  /**
   * A press of an option, or Space or Return on the focused one, chooses it.
   * Called for the chosen option too, as going on with it.
   */
  onValueChange: (value: Value) => void;
  options: readonly ChoiceListOption<Value>[];
  /**
   * Each option's drawn content (a picture and a name), decorative: the option
   * itself is the control, named by its `label`. Never put controls in it.
   */
  renderContent: (
    option: Readonly<ChoiceListOption<Value>>,
    state: Readonly<ChoiceListOptionState>,
  ) => ReactNode;
  /**
   * The options' arrangement and the arrows that move through it: `horizontal`
   * (← →, the default) or `vertical` (↑ ↓).
   */
  orientation?: 'horizontal' | 'vertical';
  /** The whole list. */
  disabled?: boolean;
  /** Layout of the list (its gap, its alignment). */
  style?: StyleProp<ViewStyle>;
  /** Layout of each option. */
  optionStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
