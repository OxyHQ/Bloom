import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface ResponsiveGridProps {
  children: ReactNode;
  /** Preferred minimum width of a cell. A narrower container uses one full-width cell. Default 320. */
  minItemWidth?: number;
  /** Maximum number of columns. Default 2. */
  maxColumns?: number;
  /** Horizontal and vertical space between cells. Default 16. */
  gap?: number;
  /** Let participating chart surfaces fill the tallest cell in each multi-column row. Default false. */
  stretchItems?: boolean;
  /** Outer container style; padding is excluded from the measured available width. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
