import type { StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/common';
import type { DialogControlProps } from '../dialog/types';

export type RootProps = {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

export type TriggerProps = {
  children: React.ReactNode | ((props: TriggerChildProps) => React.ReactNode);
  label: string;
};

export type TriggerChildProps = {
  control: DialogControlProps;
  state: {
    hovered: boolean;
    focused: boolean;
    pressed: boolean;
  };
  props: {
    onPress: () => void;
    onFocus: () => void;
    onBlur: () => void;
    accessibilityLabel: string;
  };
};

/**
 * Shows the currently selected value inside a `Select.Trigger`.
 *
 * Pass a `children` function to extract a display string from the selected
 * item when items are not plain `{ value, label }` objects.
 */
export type ValueTextProps = {
  /**
   * Extracts the display text from the currently-selected item.
   * Defaults to `item => item.label`.
   */
  children?: (value: unknown) => React.ReactNode;
  placeholder?: string;
  style?: TextStyle;
};

export type IconProps = {
  style?: TextStyle;
};

export type ContentProps<T> = {
  /**
   * Label displayed at the top of the selection sheet (native) or
   * used as an ARIA label (web).
   *
   * @default "Select an option"
   */
  label?: string;
  /** The array of items to choose from. */
  items: T[];
  /** Renders a single item. Use `Select.Item` inside this callback. */
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
};

export type ItemProps = {
  ref?: React.Ref<View>;
  value: string;
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export type ItemTextProps = {
  children: React.ReactNode;
  style?: TextStyle;
};

export type ItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>;
};

export type SelectItemContextValue = {
  selected: boolean;
  hovered: boolean;
  focused: boolean;
  pressed: boolean;
};
