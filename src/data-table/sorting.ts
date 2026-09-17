import type { DataTableColumn, DataTableSort, DataTableSortValue } from './types';

/**
 * The row-model half of `DataTable`, in plain functions — @tanstack/react-table's
 * sorted and paginated row models, reimplemented without the dependency and
 * with TanStack's defaults kept:
 *
 *  - a header press cycles `first → other → unsorted` (`enableSortingRemoval`);
 *  - the first direction is ascending for text, descending for anything else
 *    (`sortDescFirst: 'auto'`);
 *  - pressing another column replaces the sort (no multi-sort without a modifier);
 *  - text compares alphanumerically, so "Row 10" follows "Row 9";
 *  - empty values sort last in both directions.
 */

export function isSortable<T>(column: DataTableColumn<T>): boolean {
  return column.sortable ?? column.accessor != null;
}

function firstDirectionDescending<T>(column: DataTableColumn<T>, rows: readonly T[]): boolean {
  if (column.sortDescFirst != null) return column.sortDescFirst;
  const accessor = column.accessor;
  if (!accessor) return false;
  for (const row of rows) {
    const value = accessor(row);
    if (value == null) continue;
    return typeof value !== 'string';
  }
  return false;
}

/** The sort after a press on `column`'s header. */
export function nextSort<T>(
  current: DataTableSort | null,
  column: DataTableColumn<T>,
  rows: readonly T[],
): DataTableSort | null {
  const descFirst = firstDirectionDescending(column, rows);
  const first = descFirst ? 'descending' : 'ascending';
  const second = descFirst ? 'ascending' : 'descending';
  if (!current || current.columnId !== column.id) return { columnId: column.id, direction: first };
  if (current.direction === first) return { columnId: column.id, direction: second };
  return null;
}

const collator =
  typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

function compareValues(a: DataTableSortValue, b: DataTableSortValue): number {
  if (typeof a === 'string' || typeof b === 'string') {
    const sa = String(a);
    const sb = String(b);
    return collator ? collator.compare(sa, sb) : sa < sb ? -1 : sa > sb ? 1 : 0;
  }
  const na = a instanceof Date ? a.getTime() : Number(a);
  const nb = b instanceof Date ? b.getTime() : Number(b);
  return na < nb ? -1 : na > nb ? 1 : 0;
}

/** A sorted copy of `rows`; the input order breaks ties, so the sort is stable. */
export function sortRows<T>(
  rows: readonly T[],
  columns: readonly DataTableColumn<T>[],
  sort: DataTableSort | null,
): readonly T[] {
  if (!sort) return rows;
  const accessor = columns.find((column) => column.id === sort.columnId)?.accessor;
  if (!accessor) return rows;
  const sign = sort.direction === 'descending' ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: accessor(row) }))
    .sort((a, b) => {
      const aEmpty = a.value == null || a.value === '';
      const bEmpty = b.value == null || b.value === '';
      if (aEmpty || bEmpty) return aEmpty === bEmpty ? a.index - b.index : aEmpty ? 1 : -1;
      return compareValues(a.value, b.value) * sign || a.index - b.index;
    })
    .map(({ row }) => row);
}

export function pageCount(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / Math.max(1, pageSize)));
}

/** `page` clamped into `1…pageCount`. */
export function clampPage(page: number, rowCount: number, pageSize: number): number {
  return Math.min(Math.max(1, Math.floor(page)), pageCount(rowCount, pageSize));
}
