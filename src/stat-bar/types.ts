import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type StatBarVariant = 'progress' | 'split';

interface StatBarBaseProps {
  /** Label shown at the top-left of the bar. */
  label: string;
  /**
   * Fill color of the (active portion of the) track.
   * @default theme.colors.primary
   */
  fillColor?: string;
  /**
   * Color of the empty/track portion.
   * @default theme.colors.backgroundSecondary
   */
  trackColor?: string;
  /**
   * Height of the capsule track in px.
   * @default 6
   */
  height?: number;
  /** Optional node rendered at the top-right of the label row (e.g. a trophy icon). */
  icon?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A labeled progress bar with an optional min/max footer row. */
export interface StatBarProgressProps extends StatBarBaseProps {
  variant?: 'progress';
  /** Current value; the fill spans `value / max` of the track. */
  value: number;
  /** Maximum value (the full track). */
  max: number;
  /** Optional label shown at the bottom-left (e.g. the range minimum). */
  minLabel?: string;
  /** Optional label shown at the bottom-right (e.g. the range maximum). */
  maxLabel?: string;
}

/** A two-sided split bar showing an inflow/outflow-style ratio. */
export interface StatBarSplitProps extends StatBarBaseProps {
  variant: 'split';
  /** Share of the track filled from the left, 0–100. Shown right of the label. */
  percent: number;
  /** Value label shown at the bottom-left. */
  leftValue: string;
  /** Value label shown at the bottom-right. */
  rightValue: string;
  /**
   * Color of the left (active) portion.
   * @default fillColor (theme.colors.primary)
   */
  leftColor?: string;
  /**
   * Color of the right portion.
   * @default trackColor (theme.colors.backgroundSecondary)
   */
  rightColor?: string;
}

export type StatBarProps = StatBarProgressProps | StatBarSplitProps;
