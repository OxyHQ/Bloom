import type { StyleProp, ViewStyle } from 'react-native';

export interface DotGridMeterProps {
  /** Number of filled dots (clamped to `[0, total]`). */
  filled: number;
  /** Total number of dots in the grid. */
  total: number;
  /**
   * Dots per row before wrapping.
   * @default 10
   */
  columns?: number;
  /**
   * Diameter of each dot in px.
   * @default 10
   */
  dotSize?: number;
  /**
   * Gap between dots in px (both axes).
   * @default 6
   */
  gap?: number;
  /**
   * Color of a filled dot.
   * @default theme.colors.success
   */
  filledColor?: string;
  /**
   * Color of an empty dot.
   * @default theme.colors.backgroundSecondary
   */
  emptyColor?: string;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
