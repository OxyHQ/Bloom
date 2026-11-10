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
  /**
   * How the cells are laid out once there is more than one column. `rows` (default): equal cells in
   * aligned rows, so a short cell beside a tall one leaves room under it. `columns`: each column is
   * its own stack, filled in turn (cell 1 to column 1, cell 2 to column 2, …), so cells of any
   * height sit one under the other with no gaps between them. In `columns` a cell is moved to
   * another column when the column count changes, so it remounts there.
   */
  flow?: 'rows' | 'columns';
  /** Let participating chart surfaces fill the tallest cell in each multi-column row. Default false. */
  stretchItems?: boolean;
  /** Outer container style; padding is excluded from the measured available width. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
