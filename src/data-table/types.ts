import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonProps } from '../button/types';
import type { AccentTone } from '../theme/accent-colors';
import type { TableColumnLayout, TableSize } from '../table/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** The table's two densities, `md` ("Normal") and `sm` ("Compact"). */
export type DataTableSize = TableSize;

/** The two row recipes — see `DataTableProps.layout`. */
export type DataTableLayout = 'table' | 'inset';

/** An active sort. No sort at all is `null`. */
export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  /** `id` of the sorted column. */
  columnId: string;
  direction: DataTableSortDirection;
}

/** A value a column sorts by. `null`/`undefined` always sort last. */
export type DataTableSortValue = string | number | Date | boolean | null | undefined;

/** What a column's `cell` renderer receives. */
export interface DataTableCellContext<T> {
  row: T;
  rowId: string;
  /** Index of the row on the current page. */
  index: number;
  /** The table's current density — chip and select sizes swap on it. */
  size: DataTableSize;
  selected: boolean;
}

export interface DataTableColumn<T> extends TableColumnLayout {
  /**
   * Preferred width in px that grows and shrinks IN PROPORTION with the other
   * `basis` columns — how an HTML table's auto layout treats
   * `w-[240px]` column classes. Wins over `width`/`flex`; `minWidth` still floors it.
   */
  basis?: number;
  /** Stable id: the sort key and the React key. */
  id: string;
  /** Header label. A string is rendered in the header's own type. */
  header: ReactNode;
  /** Names a header whose `header` is not a plain string. */
  headerAccessibilityLabel?: string;
  /**
   * The row's value for this column. Used to sort, and rendered as the cell's
   * text when no `cell` is given.
   */
  accessor?: (row: T) => DataTableSortValue;
  /** Renders the cell. Defaults to the `accessor` value as body text. */
  cell?: (context: DataTableCellContext<T>) => ReactNode;
  /** Whether the header toggles sorting. Defaults to `true` when there is an `accessor`. */
  sortable?: boolean;
  /**
   * Whether the first press sorts descending. Defaults to TanStack's rule:
   * strings start ascending, numbers and dates descending.
   */
  sortDescFirst?: boolean;
}

export interface DataTableProps<T> {
  /** Every row, already filtered. The table sorts and paginates them. */
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Stable id of a row — the selection key. */
  getRowId: (row: T, index: number) => string;
  /** Names the table for assistive tech. */
  accessibilityLabel: string;

  // Toolbar ---------------------------------------------------------------
  /** Muted caption over the summary, e.g. `"Total Results"`. */
  title?: ReactNode;
  /** The count line under the title, e.g. `"48 customers"`. */
  summary?: ReactNode;
  /** Trailing toolbar controls — filters, search. Laid out in a row with a 10px gap. */
  toolbar?: ReactNode;

  // Sorting ---------------------------------------------------------------
  /** Controlled sort. `null` is unsorted. */
  sort?: DataTableSort | null;
  /** Initial sort when uncontrolled. Defaults to `null`. */
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;

  // Selection -------------------------------------------------------------
  /**
   * Adds a checkbox before the first column's content in every row, and a
   * select-all-on-this-page checkbox in its header. Defaults to `false`.
   */
  selectable?: boolean;
  /** Controlled selection, as row ids. */
  selectedRowIds?: readonly string[];
  /** Initial selection when uncontrolled. */
  defaultSelectedRowIds?: readonly string[];
  onSelectionChange?: (rowIds: string[]) => void;
  /** Name of the header checkbox. Default `"Select all rows on this page"`. */
  selectAllLabel?: string;
  /** Name of a row checkbox. Default `` `Select row ${rowId}` ``. */
  getSelectRowLabel?: (row: T, rowId: string) => string;

  // Pagination ------------------------------------------------------------
  /** Rows per page. Defaults to 8. */
  pageSize?: number;
  /** Controlled current page, 1-based. */
  page?: number;
  /** Initial page when uncontrolled. Defaults to 1. */
  defaultPage?: number;
  onPageChange?: (page: number) => void;

  // Density ---------------------------------------------------------------
  /** Controlled density. */
  size?: DataTableSize;
  /** Initial density when uncontrolled. Defaults to `'md'`. */
  defaultSize?: DataTableSize;
  onSizeChange?: (size: DataTableSize) => void;
  /** Shows the Normal / Compact segmented control under the table. Defaults to `false`. */
  showSizeToggle?: boolean;
  /** Labels of the density control. Defaults to `{ md: 'Normal', sm: 'Compact' }`. */
  sizeToggleLabels?: { md: string; sm: string };
  /** Accessible name of the density control. Default `"Table density"`. */
  sizeToggleAccessibilityLabel?: string;

  /** Shown in the 160px empty band when `rows` is empty. */
  emptyState?: ReactNode;
  /**
   * Minimum table width; narrower containers scroll the table horizontally.
   */
  minWidth?: number;
  /**
   * Row recipe. Defaults to `'table'`.
   *
   * - `table`  the data table's own look (`base/table`): every cell inset 12,
   *            hairlines between rows, a full-width hairline over the footer,
   *            selected rows washed in the secondary surface.
   * - `inset`  the dashboard templates' flex-row tables (customers,
   *            transactions, campaigns): a 12px leading gutter the first column
   *            sits flush against, row hairlines that start after that gutter
   *            (and run under the last row when the table paginates, instead of
   *            the footer's hairline), no selection wash, the sorted header's
   *            label in the primary text colour, and a 40px-padded empty band.
   */
  layout?: DataTableLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A Remix-style icon component: `width`, `height`, `fill`. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type DataTableIconComponent = BloomIconComponent;

export interface DataTableRowActionProps
  extends Omit<ButtonProps, 'children' | 'variant' | 'size' | 'iconOnly' | 'icon' | 'leadingIcon' | 'trailingIcon'> {
  /** The glyph, drawn at 16px. */
  icon: DataTableIconComponent;
  /** Accessible name, and the tooltip's text. */
  label: string;
  /** Paints the pressed state while a menu this button opened is showing. */
  active?: boolean;
  /** Show the hover/focus tooltip. Defaults to `true`. */
  tooltip?: boolean;
}

/** One icon action of a row — a `DataTableRowAction`, or a row menu entry. */
export interface DataTableRowActionItem {
  icon: DataTableIconComponent;
  /** The button's name and tooltip, or the menu entry's text. */
  label: string;
  onPress?: () => void;
}

export interface DataTableRowActionsProps {
  /** Names the row in the menu's accessible name: `` `More actions for ${name}` ``. */
  name: string;
  /** The icon buttons before the menu, in order — e.g. Delete, Edit. */
  actions?: readonly DataTableRowActionItem[];
  /** The "⋮" menu's entries. Without any, no menu button is drawn. */
  menu?: readonly DataTableRowActionItem[];
  /** The menu button's tooltip. Default `"More actions"`. */
  menuLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** An option of a `DataTableFilter` or a `DataTableSelect`. */
export interface DataTableOption {
  value: string;
  label: string;
}

export interface DataTableFilterProps {
  /** Accessible name, e.g. `"Filter by region"`. */
  label: string;
  options: readonly DataTableOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  testID?: string;
}

export interface DataTableSearchProps {
  /** Accessible name, e.g. `"Search customers"`. */
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** Default `"Search"`. */
  placeholder?: string;
  testID?: string;
}

/**
 * A `DataTableSelect` option. `dot` and `icon` lead the label in the trigger and
 * in the list alike.
 */
export interface DataTableSelectOption extends DataTableOption {
  /**
   * A status dot (`Badge dot`): `green` is `success`, `yellow` is `warning`,
   * `indigo` is `info`.
   */
  dot?: AccentTone;
  /** An 18px icon in `foreground-icon-secondary`. */
  icon?: DataTableIconComponent;
}

export interface DataTableSelectProps {
  /** Accessible name, e.g. `` `Purchase status for ${name}` ``. */
  label: string;
  options: readonly DataTableSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * The trigger's width (`w-[142px]`). Like a width class on a flex item, the
   * trigger still shrinks to its content when the column is narrower (web).
   */
  width: number;
  /** Pass the cell's `size`. Defaults to `'md'`. */
  size?: DataTableSize;
  disabled?: boolean;
  testID?: string;
}
