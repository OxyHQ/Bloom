import type { ReactNode } from 'react';
import {
  Table as BloomTable,
  TableBody as BloomTableBody,
  TableCell as BloomTableCell,
  TableColumn as BloomTableColumn,
  TableHeader as BloomTableHeader,
  TableRow as BloomTableRow,
} from '@oxy.so/bloom/table';

import { Node, type Child, type ViewModifiers } from '../node';
import {
  resolveSpace,
  type ColumnWidthToken,
  type SpaceToken,
  type TableAlign,
  type TableSize,
  type TableSort,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** A data table: a header of columns, a body of rows, two densities and sortable columns (Bloom `table`). */
export type TableKind =
  | 'table'
  | 'tableHeader'
  | 'tableColumn'
  | 'tableBody'
  | 'tableRow'
  | 'tableCell';

/** A header's label or a cell's content: a string or number in the table's own type, or a view. */
export type TableContent = string | number | Child;
export interface TableContentProps {
  readonly content: TableContent;
}

/** How a column (and each of its cells) claims width: a fixed width, or a share of what remains. */
interface ColumnLayout<Self> {
  /** A fixed width, or `fit` to hug the content. Wins over `share`. */
  width(value: ColumnWidthToken): Self;
  /** Its share of the remaining width (1 by default). */
  share(value: number): Self;
  /** The narrowest a shared column gets. */
  minWidth(value: SpaceToken): Self;
  /** Where its content sits: `start` (default), `center` or `end`. */
  align(value: TableAlign): Self;
}

/** Bloom `Table`: its header and body; `md` or `sm` rows. */
export interface TableView extends ViewModifiers<TableView> {
  /** Row density: `md` (default) or `sm`. */
  size(value: TableSize): TableView;
  /** The table's narrowest width: a narrower container scrolls it sideways. */
  minWidth(value: SpaceToken): TableView;
}
/** Bloom `TableHeader`: the columns, whose layout every row's cells follow. */
export type TableHeaderView = ViewModifiers<TableHeaderView>;
/** Bloom `TableColumn`: a header label, its layout, and its sort. */
export interface TableColumnView
  extends ViewModifiers<TableColumnView>,
    ColumnLayout<TableColumnView> {
  /** The header is a sort button: its direction (`none` draws no chevron) and what pressing it does. */
  sort(direction: TableSort, action: () => void): TableColumnView;
  /** What sits before the label, outside the sort button (a select-all checkbox). */
  prefix(value: Child): TableColumnView;
}
/** Bloom `TableBody`: the rows, with hairlines between them. */
export interface TableBodyView extends ViewModifiers<TableBodyView> {
  /** What fills a 160 band with no rows (a string in the muted body type). */
  emptyState(value: TableContent): TableBodyView;
}
/** Bloom `TableRow`: one cell per column. */
export interface TableRowView extends ViewModifiers<TableRowView> {
  /** `true` paints the row selected; either value announces the selection. */
  selected(value: boolean): TableRowView;
}
/** Bloom `TableCell`: its content, in its column's layout unless it sets its own. */
export type TableCellView = ViewModifiers<TableCellView> & ColumnLayout<TableCellView>;

/** Bloom `Table`: a `TableHeader` and a `TableBody`. */
export function Table(...children: Child[]): TableView {
  return new Node('table', null, children);
}
/** Bloom `TableHeader`: its `TableColumn`s. */
export function TableHeader(...columns: Child[]): TableHeaderView {
  return new Node('tableHeader', null, columns);
}
/** Bloom `TableColumn`: its header label. */
export function TableColumn(label: TableContent): TableColumnView {
  return new Node('tableColumn', { content: label } satisfies TableContentProps, []);
}
/** Bloom `TableBody`: its `TableRow`s. */
export function TableBody(...rows: Child[]): TableBodyView {
  return new Node('tableBody', null, rows);
}
/** Bloom `TableRow`: its `TableCell`s. */
export function TableRow(...cells: Child[]): TableRowView {
  return new Node('tableRow', null, cells);
}
/** Bloom `TableCell`: a string or number in the table's body type, or a view. */
export function TableCell(content: TableContent): TableCellView {
  return new Node('tableCell', { content } satisfies TableContentProps, []);
}

/** A label or content: a string or number as it is (the table draws it in its type), a view drawn. */
function content(d: ControlDraw, value: TableContent): ReactNode {
  return typeof value === 'string' || typeof value === 'number' ? value : d.render(value);
}

function layout(d: ControlDraw, props: Record<string, unknown>): Record<string, unknown> {
  const width = d.own('width')?.value;
  const minWidth = d.own('minWidth')?.value;
  props.width = width === undefined ? undefined : width === 'fit' ? 'auto' : resolveSpace(width);
  props.flex = d.own('share')?.value;
  props.minWidth = minWidth === undefined ? undefined : resolveSpace(minWidth);
  props.align = d.own('align')?.value;
  return props;
}

/** A container: its children, drawn in place, so the table reads its columns and rows as Bloom's own. */
function container(
  host: unknown,
  extra?: (d: ControlDraw, props: Record<string, unknown>) => void,
) {
  return (d: ControlDraw) => {
    const props = d.props();
    extra?.(d, props);
    return d.component(host, props, ...d.children(d.node.children));
  };
}

export const TABLES: Record<TableKind, ControlRenderer> = {
  table: container(BloomTable, (d, props) => {
    const minWidth = d.own('minWidth')?.value;
    props.size = d.own('size')?.value;
    props.minWidth = minWidth === undefined ? undefined : resolveSpace(minWidth);
  }),
  tableHeader: container(BloomTableHeader),
  tableColumn: (d) => {
    const props = layout(d, d.props());
    const sort = d.own('sort')?.value;
    if (sort !== undefined) [props.sortDirection, props.onSort] = sort;
    const prefix = d.own('prefix')?.value;
    if (prefix !== undefined) props.leading = d.render(prefix);
    return d.component(
      BloomTableColumn,
      props,
      content(d, (d.node.props as TableContentProps).content),
    );
  },
  tableBody: container(BloomTableBody, (d, props) => {
    const empty = d.own('emptyState')?.value;
    if (empty !== undefined) props.emptyState = content(d, empty);
  }),
  tableRow: container(BloomTableRow, (d, props) => {
    props.selected = d.own('selected')?.value;
  }),
  tableCell: (d) =>
    d.component(
      BloomTableCell,
      layout(d, d.props()),
      content(d, (d.node.props as TableContentProps).content),
    ),
};
