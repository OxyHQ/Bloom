import type { StyleProp, ViewStyle } from 'react-native';

export interface RadioIndicatorProps {
  /** Whether the radio is selected */
  selected: boolean;
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
