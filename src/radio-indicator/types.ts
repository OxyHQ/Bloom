import type { StyleProp, ViewStyle } from 'react-native';

export interface RadioIndicatorProps {
  /** Whether the radio is selected */
  selected: boolean;
  /**
   * Whether the control it belongs to is currently HELD.
   *
   * The indicator paints the press because it is the only node that holds both
   * colours the state layer is built from — its own fill and its dot. A caller
   * that owns the gesture (`Radio`) passes its pressed flag straight through
   * rather than computing a colour it would have to keep in step by hand.
   */
  pressed?: boolean;
  /** Outer circle size in pixels (defaults to 20) */
  size?: number;
  /** Color when selected (defaults to theme.colors.primary) */
  selectedColor?: string;
  /** Border color when unselected (defaults to theme.colors.border) */
  borderColor?: string;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
