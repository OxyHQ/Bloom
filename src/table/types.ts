import type { StyleProp, ViewStyle } from 'react-native';

/** Two densities: `md` (10/12 cell inset, 14/20 text) and `sm` (6/10, 13/18). */
export type TableSize = 'sm' | 'md';

/** Horizontal alignment of a column's cells. */
export type TableAlign = 'start' | 'center' | 'end';

/** ARIA's sort states. `'none'` renders the sort chevron dimmed. */
export type TableSortDirection = 'ascending' | 'descending' | 'none';

/**
 * How a column claims width. React Native has no table layout, so every row is a
 * flex row and a column is sized the same way in the header and in each body row:
 * a fixed `width`, or a `flex` share of what remains (default `1`).
 */
export interface TableColumnLayout {
  /** Fixed width in px. Wins over `flex`. */
  width?: number;
  /** Share of the remaining width. Defaults to `1`. */
  flex?: number;
  /** Floor for a flexed column. */
  minWidth?: number;
  align?: TableAlign;
}

export interface TableProps {
  /** Row density for every row. Defaults to `'md'`. */
  size?: TableSize;
  /** `TableHeader` and `TableBody`. */
  children?: React.ReactNode;
  /** Names the table for assistive tech. */
  accessibilityLabel?: string;
  /**
   * Minimum width of the table. When the container is narrower, the table scrolls
   * horizontally (an `overflow-x-auto` wrapper).
   */
  minWidth?: number;
  /** Style for the table itself. */
  style?: StyleProp<ViewStyle>;
  /** Style for the scroll container around it. */
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TableHeaderProps {
  /** `TableColumn` children. Their layout props size every body row's cells too. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TableColumnProps extends TableColumnLayout {
  /** Header label. A string is rendered in the header's own type. */
  children?: React.ReactNode;
  /**
   * Makes the header a sort button: label plus a sort chevron. Pair with
   * `sortDirection`.
   */
  onSort?: () => void;
  /** Current sort of this column. Only meaningful with `onSort`. Defaults to `'none'`. */
  sortDirection?: TableSortDirection;
  /** Names a header whose `children` is not a plain string. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TableBodyProps {
  /** `TableRow` children. Hairlines are drawn BETWEEN rows, never after the last. */
  children?: React.ReactNode;
  /** Rendered in a 160px band when there are no rows. A string gets the muted body type. */
  emptyState?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TableRowProps {
  /** `TableCell` children, one per column. */
  children?: React.ReactNode;
  /**
   * `true` paints the row with the secondary surface; `true` or `false` announces
   * the selection state. Omit it on a table without row selection.
   */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TableCellProps extends TableColumnLayout {
  /** Cell content. A string or number is rendered in the body type. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
