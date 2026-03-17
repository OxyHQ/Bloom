import type { StyleProp, ViewStyle } from 'react-native';

export interface DividerProps {
  /** Custom color (defaults to theme.colors.border) */
  color?: string;
  /** Line thickness (defaults to StyleSheet.hairlineWidth) */
  thickness?: number;
  /** If true, renders a vertical divider */
  vertical?: boolean;
  /** Spacing around the divider (marginVertical for horizontal, marginHorizontal for vertical) */
  spacing?: number;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
