import type { ReactNode } from 'react';
import {
  DataTable as BloomDataTable,
  DataTableFilter as BloomDataTableFilter,
  DataTableSearch as BloomDataTableSearch,
  DataTableSelect as BloomDataTableSelect,
  type DataTableCellContext,
  type DataTableColumn,
  type DataTableOption,
  type DataTableSelectOption,
  type DataTableSize,
  type DataTableSort,
  type DataTableSortValue,
} from '@oxy.so/bloom/data-table';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import { resolveSpace, type ColumnWidthToken, type SpaceToken, type TableAlign } from '../tokens';
import { type ControlDraw, type ControlRenderer, lastOf, nodesOf, slot } from './draw';
import type { TableContent } from './table';

/** The advanced data table: toolbar, sortable columns, row selection, pages and density (Bloom `data-table`). */
export type DataTableKind =
  | 'dataTable'
  | 'dataColumn'
  | 'dataTableFilter'
  | 'dataTableSearch'
  | 'dataTableSelect';

/** A data table's row recipe: its own look, or the dashboards' flex-row inset. */
export type DataTableStyle = 'table' | 'inset';

/** A data table's wording of your own (Bloom speaks its own in the locale). */
export interface DataTableLabels {
  /** The header checkbox's name. */
  readonly selectAll?: string;
  /** A row checkbox's name. */
  readonly selectRow?: (row: never, rowId: string) => string;
  /** The density control's segments. */
  readonly density?: { readonly md: string; readonly sm: string };
  /** The density control's name. */
  readonly densityName?: string;
}

/** Bloom `DataTable`: its rows, drawn by its `DataColumn`s, sorted, selected and paged by Bloom. */
export interface DataTableView extends ViewModifiers<DataTableView> {
  /** The muted caption over the summary (`Total Results`). */
  title(value: string): DataTableView;
  /** The count line under the title (`48 customers`). */
  summary(value: TableContent): DataTableView;
  /** The toolbar's controls (filters, a search), in a row. */
  toolbar(...value: Child[]): DataTableView;
  /** The sort, `null` unsorted: what a header press writes. */
  sorting(value: Binding<DataTableSort | null>): DataTableView;
  /** A checkbox per row and a select-all: the selected rows' ids. */
  rowSelection(value: Binding<readonly string[]>): DataTableView;
  /** Rows per page (8 by default). */
  pageSize(value: number): DataTableView;
  /** The current page, from 1. */
  page(value: Binding<number>): DataTableView;
  /** Row density: `md` (default) or `sm`. */
  size(value: DataTableSize): DataTableView;
  /** The Normal / Compact control under the table, and the density it sets. */
  sizeToggle(value: Binding<DataTableSize>): DataTableView;
  /** `false` drops the table's own border, inside a surface that draws one. */
  bordered(value: boolean): DataTableView;
  /** What fills the empty band with no rows. */
  emptyState(value: TableContent): DataTableView;
  /** The table's narrowest width: a narrower container scrolls it sideways. */
  minWidth(value: SpaceToken): DataTableView;
  /** `table` (default) or the dashboards' `inset` rows. */
  style(value: DataTableStyle): DataTableView;
  labels(value: DataTableLabels): DataTableView;
}

/** Bloom's `DataTableColumn`: a header, the row's value, its cell and its layout. */
export interface DataColumnView<T = unknown> {
  /** The header's name, when the header is not a string. */
  label(value: string): DataColumnView<T>;
  /** A fixed width, or `fit` to hug the content. */
  width(value: ColumnWidthToken): DataColumnView<T>;
  /** Its share of the remaining width. */
  share(value: number): DataColumnView<T>;
  /** The narrowest a shared column gets. */
  minWidth(value: SpaceToken): DataColumnView<T>;
  /** A preferred width that grows and shrinks in proportion with the other columns'. */
  basis(value: SpaceToken): DataColumnView<T>;
  align(value: TableAlign): DataColumnView<T>;
  /** Draws the cell (the row's value as body text by default). */
  cell(value: (context: DataTableCellContext<T>) => Child): DataColumnView<T>;
  /** Whether its header sorts (it does when the column has a value). */
  sortable(value?: boolean): DataColumnView<T>;
  /** The first press sorts descending (numbers and dates do by default). */
  sortsDescendingFirst(value?: boolean): DataColumnView<T>;
}

/** Bloom `DataTableFilter`: a filter of the toolbar. */
export interface DataTableFilterView extends ViewModifiers<DataTableFilterView> {
  disabled(value?: boolean): DataTableFilterView;
}
/** Bloom `DataTableSearch`: the toolbar's search. */
export interface DataTableSearchView extends ViewModifiers<DataTableSearchView> {
  placeholder(value: string): DataTableSearchView;
}
/** Bloom `DataTableSelect`: a select in a cell. */
export interface DataTableSelectView extends ViewModifiers<DataTableSelectView> {
  /** The cell's density. */
  size(value: DataTableSize): DataTableSelectView;
  disabled(value?: boolean): DataTableSelectView;
}

/**
 * Bloom `DataTable`: every row (already filtered), each named by `rowId`, in
 * its `DataColumn`s. `.label()` names the table.
 */
export function DataTable<T>(
  rows: readonly T[],
  rowId: (row: T, index: number) => string,
  ...columns: DataColumnView<T>[]
): DataTableView {
  return new Node('dataTable', { rows, rowId }, columns as unknown as Child[]);
}
/** A column: its `id` (its sort key), its header, and the row's value (what it sorts by and shows). */
export function DataColumn<T>(
  id: string,
  header: TableContent,
  value?: (row: T) => DataTableSortValue,
): DataColumnView<T> {
  return new Node('dataColumn', { id, header, value }, []) as unknown as DataColumnView<T>;
}
/** Bloom `DataTableFilter`: the binding's value among `options`; `label` names it. */
export function DataTableFilter(
  value: Binding<string>,
  label: string,
  options: readonly DataTableOption[],
): DataTableFilterView {
  return new Node('dataTableFilter', { value, label, options }, []);
}
/** Bloom `DataTableSearch`: the binding's text; `label` names it. */
export function DataTableSearch(text: Binding<string>, label: string): DataTableSearchView {
  return new Node('dataTableSearch', { value: text, label }, []);
}
/** Bloom `DataTableSelect`: the binding's value among `options`, its trigger `width` wide; `label` names it. */
export function DataTableSelect(
  value: Binding<string>,
  label: string,
  options: readonly DataTableSelectOption[],
  width: SpaceToken,
): DataTableSelectView {
  return new Node('dataTableSelect', { value, label, options, width }, []);
}

const content = (d: ControlDraw, value: TableContent | undefined): ReactNode =>
  value === undefined || typeof value === 'string' || typeof value === 'number'
    ? value
    : d.render(value);
const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

/** A `DataColumn` node as Bloom's column. */
function column(d: ControlDraw, node: Node): DataTableColumn<unknown> {
  const { id, header, value } = node.props as {
    id: string;
    header: TableContent;
    value?: (row: unknown) => DataTableSortValue;
  };
  const width = lastOf(node, 'width')?.value as ColumnWidthToken | undefined;
  const cell = lastOf(node, 'cell')?.value as
    | ((context: DataTableCellContext<unknown>) => Child)
    | undefined;
  return {
    id,
    header: content(d, header),
    headerAccessibilityLabel: lastOf(node, 'label')?.value,
    accessor: value,
    cell: cell === undefined ? undefined : (context) => d.render(cell(context)),
    sortable: lastOf(node, 'sortable')?.value,
    sortDescFirst: lastOf(node, 'sortsDescendingFirst')?.value,
    width: width === undefined ? undefined : width === 'fit' ? 'auto' : resolveSpace(width),
    flex: lastOf(node, 'share')?.value,
    minWidth: space(lastOf(node, 'minWidth')?.value),
    basis: space(lastOf(node, 'basis')?.value as SpaceToken | undefined),
    align: lastOf(node, 'align')?.value as TableAlign | undefined,
  };
}

const NOT_DRAWN = () => {
  throw new Error('bloom-language: a DataColumn is drawn by its DataTable');
};

export const DATA_TABLES: Record<DataTableKind, ControlRenderer> = {
  dataTable: (d) => {
    const { rows, rowId } = d.node.props as {
      rows: readonly unknown[];
      rowId: (row: unknown, index: number) => string;
    };
    const sorting = d.own('sorting')?.value;
    const selection = d.own('rowSelection')?.value;
    const page = d.own('page')?.value as Binding<number> | undefined;
    const toggle = d.own('sizeToggle')?.value;
    const labels = d.own('labels')?.value as DataTableLabels | undefined;
    const toolbar = d.own('toolbar')?.value as readonly Child[] | undefined;
    const props = d.props();
    Object.assign(props, {
      rows,
      getRowId: rowId,
      columns: nodesOf(d.node.children).map((node) => column(d, node)),
      title: d.own('title')?.value,
      summary: content(d, d.own('summary')?.value),
      toolbar: slot(d, toolbar),
      pageSize: d.own('pageSize')?.value,
      size: d.own('size')?.value,
      bordered: d.own('bordered')?.value,
      emptyState: content(d, d.own('emptyState')?.value as TableContent | undefined),
      minWidth: space(d.own('minWidth')?.value as SpaceToken | undefined),
      layout: d.own('style')?.value,
      selectAllLabel: labels?.selectAll,
      getSelectRowLabel: labels?.selectRow,
      sizeToggleLabels: labels?.density,
      sizeToggleAccessibilityLabel: labels?.densityName,
    });
    if (sorting !== undefined) [props.sort, props.onSortChange] = sorting;
    if (selection !== undefined) {
      props.selectable = true;
      [props.selectedRowIds, props.onSelectionChange] = selection;
    }
    if (page !== undefined) [props.page, props.onPageChange] = page;
    if (toggle !== undefined) {
      props.showSizeToggle = true;
      [props.size, props.onSizeChange] = toggle;
    }
    return d.component(BloomDataTable, props);
  },
  dataColumn: NOT_DRAWN,
  dataTableFilter: (d) => {
    const { value, label, options } = d.node.props as {
      value: Binding<string>;
      label: string;
      options: readonly DataTableOption[];
    };
    return d.around(
      <BloomDataTableFilter
        key={d.key}
        label={label}
        options={options}
        value={value[0]}
        onValueChange={value[1]}
        disabled={d.own('disabled')?.value}
        testID={d.testID}
      />,
    );
  },
  dataTableSearch: (d) => {
    const { value, label } = d.node.props as { value: Binding<string>; label: string };
    return d.around(
      <BloomDataTableSearch
        key={d.key}
        label={label}
        value={value[0]}
        onValueChange={value[1]}
        placeholder={d.own('placeholder')?.value}
        testID={d.testID}
      />,
    );
  },
  dataTableSelect: (d) => {
    const { value, label, options, width } = d.node.props as {
      value: Binding<string>;
      label: string;
      options: readonly DataTableSelectOption[];
      width: SpaceToken;
    };
    return d.around(
      <BloomDataTableSelect
        key={d.key}
        label={label}
        options={options}
        value={value[0]}
        onValueChange={value[1]}
        width={resolveSpace(width)}
        size={d.own('size')?.value as DataTableSize | undefined}
        disabled={d.own('disabled')?.value}
        testID={d.testID}
      />,
    );
  },
};
