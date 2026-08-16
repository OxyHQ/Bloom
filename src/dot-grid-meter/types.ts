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
  /**
   * The meter's accessible NAME — what is being measured.
   *
   * `progressbar` takes its name from the author only: ARIA never computes one
   * from an element's contents for this role, and the contents here are dots
   * anyway. Without it the meter announces "13 of 30" against nothing.
   * `StatBar` gets this from its required `label`; a bare grid of dots has no
   * such text, so it has to be stated.
   *
   * Omitting it warns once in development; see `use-accessible-name-warning`.
   */
  accessibilityLabel?: string;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
