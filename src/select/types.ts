import type { StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';
import type { DialogControlProps } from '../dialog/types';

export type SelectProps = {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

export type SelectTriggerProps = {
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
    /**
     * Attach this to the element the trigger actually renders. On web the
     * dropdown is positioned against its measured rect; a trigger that drops
     * it falls back to the viewport's top-left corner.
     */
    ref?: React.Ref<unknown>;
    onPress: () => void;
    onFocus: () => void;
    onBlur: () => void;
    accessibilityLabel: string;
  };
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
};

export type SelectItemProps = {
  ref?: React.Ref<View>;
  value: string;
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export type SelectItemTextProps = {
  children: React.ReactNode;
  style?: TextStyle;
};

export type SelectItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>;
};

export type SelectItemContextValue = {
  selected: boolean;
  hovered: boolean;
  focused: boolean;
  pressed: boolean;
};
