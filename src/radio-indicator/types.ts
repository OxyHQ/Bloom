import type { StyleProp, ViewStyle } from 'react-native';

export interface RadioIndicatorProps {
  /** Whether the radio is selected */
  selected: boolean;
  /**
   * Whether the control it belongs to is currently HELD.
   *
   * @deprecated Accepted for compatibility and ignored. There is
   * no pressed paint — selection animates, a press does not.
   */
  pressed?: boolean;
  /** Outer circle size in pixels (defaults to 16, the `md` size; 14 is `sm`) */
  size?: number;
  /** Accent the selected gradient is built around (defaults to theme.colors.primary) */
  selectedColor?: string;
  /** Border color when unselected (defaults to the neutral-300 stop; neutral-700 in dark) */
  borderColor?: string;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
