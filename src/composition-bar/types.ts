import type { StyleProp, ViewStyle } from 'react-native';

/** One distribution-bar category. Percentages are computed internally. */
export interface CompositionCategory {
  key: string;
  name: string;
  /** Non-negative magnitude; the segment width is its share of the total. */
  amount: number;
  color: string;
}

export interface CompositionBarProps {
  /** Categories to render, in left→right order. Non-positive amounts are dropped. */
  categories: CompositionCategory[];
  /** The currently-selected category key, or null. */
  selectedKey: string | null;
  /** Called with a category key when a segment is pressed. */
  onSelect: (key: string) => void;
  /** Text shown below the bar when nothing is selected. */
  hintLabel: string;
  /**
   * Formats the readout shown below the bar for the selected segment. Receives
   * the raw amount (points) and the rounded share percentage (0–100).
   * @default `(points, percent) => `${points} pts · ${percent}%``
   */
  formatReadout?: (points: number, percent: number) => string;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
