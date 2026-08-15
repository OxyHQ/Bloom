import type { StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';

export type SelectProps = {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

export type SelectTriggerProps = {
  children?: React.ReactNode;
  /**
   * Render the single element child AS the trigger, merging the open handler
   * and a11y props into it. Without it the children render inside Bloom's own
   * pressable. The same escape hatch every anchored Bloom family offers.
   */
  asChild?: boolean;
  disabled?: boolean;
  label: string;
  /**
   * Utility classes APPENDED to the part's own — never substituted for them, so
   * a single layout class cannot strip the chrome.
   */
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Shows the currently selected value inside a `SelectTrigger`.
 *
 * Pass a `children` function to extract a display string from the selected
 * item when items are not plain `{ value, label }` objects.
 */
export type SelectValueProps = {
  /**
   * Extracts the display text from the currently-selected item.
   * Defaults to `item => item.label`.
   */
  children?: (value: unknown) => React.ReactNode;
  placeholder?: string;
  className?: string;
  style?: TextStyle;
};

export type SelectIconProps = {
  style?: TextStyle;
};

export type SelectContentProps<T> = {
  /**
   * Label displayed at the top of the selection sheet (native) or
   * used as an ARIA label (web).
   *
   * @default "Select an option"
   */
  label?: string;
  /** The array of items to choose from. */
  items: T[];
  /** Renders a single item. Use `SelectItem` inside this callback. */
  renderItem: (
    item: T,
    index: number,
    selectedValue?: string | null,
  ) => React.ReactElement;
  /**
   * Extracts a unique string key from an item.
   * Defaults to `item => item.value`.
   */
  valueExtractor?: (item: T) => string;
  /**
   * Tallest the anchored dropdown grows before its options scroll (web only —
   * the native sheet sizes itself). Defaults to 320.
   */
  maxHeight?: number;
  /** Appended to the dropdown panel's own chrome. */
  className?: string;
};

export type SelectGroupProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectLabelProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
};

export type SelectScrollButtonProps = {
  direction: 'up' | 'down';
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectItemProps = {
  ref?: React.Ref<View>;
  value: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectItemTextProps = {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
};

export type SelectItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>;
};

/**
 * What a row publishes to `SelectItemText` and `SelectItemIndicator`.
 *
 * `selected` and nothing else. It used to carry `hovered`, `focused` and
 * `pressed` as well — three members no part in the library ever read, two of
 * which were hardcoded literals (`hovered: false` on native, `pressed: false` on
 * web) rather than computed at all. A context member that is a literal is worse
 * than an absent one: it answers the question wrongly instead of not answering.
 */
export type SelectItemContextValue = {
  selected: boolean;
};
