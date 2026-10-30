import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** One fact: a small label over a large value over a caption. */
export interface FactStripItem {
  key: string;
  /** What the fact is: "Ratings", "Category", "Languages". */
  label: string;
  /** The fact itself: "4.5", "Social", an icon. Strings are drawn large. */
  value: ReactNode;
  /** Under the value: the stars, "Years old", the full name. Strings are drawn small. */
  caption?: ReactNode;
  /** The fact's one accessible name. Defaults to the text it contains. */
  accessibilityLabel?: string;
  /** Makes the fact a button (jump to the ratings, open the developer). */
  onPress?: () => void;
}

export interface FactStripProps {
  items: readonly FactStripItem[];
  /** The narrowest a fact may get; past that the strip scrolls sideways. Default `96`. */
  minItemWidth?: number;
  /**
   * Horizontal padding inside the scroll track, so the first fact lines up with
   * the page gutter while the strip still scrolls edge to edge. Default `0`.
   */
  contentInset?: number;
  /** The list's name. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
