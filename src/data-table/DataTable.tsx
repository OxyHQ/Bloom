import { useBloomAppearance } from '../appearance';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent, type TextStyle, type ViewStyle } from 'react-native';

import { Checkbox } from '../checkbox';
import { useControllableState } from '../hooks/use-controllable-state';
import { formatGregorian } from '../locale/format-date';
import { useMessages } from '../locale/messages';
import { Pagination } from '../pagination';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { BREAKPOINTS } from '../styles/breakpoints';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../table';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { DATA_TABLE_MESSAGES } from './messages';
import { clampPage, isSortable, nextSort, pageCount, sortRows } from './sorting';
import type { DataTableColumn, DataTableProps, DataTableSize, DataTableSort } from './types';

/**
 * The advanced data table, styled after the dashboard template's customers table).
 *
 * The table renders from Bloom's own `Table`. Sorting, row selection and
 * pagination are plain React state, keeping TanStack's defaults (see
 * `sorting.ts`). Filtering stays OUTSIDE — the caller filters `rows`, the
 * table sorts and pages them.
 *
 *   surface     1px border-table, radius 16, pt 8, pb 12 (0 without a footer)
 *   toolbar     px 12 py 4, gap 12; title (text-tertiary) over summary
 *               (text-primary, wraps), both body-medium; controls gap 10,
 *               wrapping onto their own full-width row below 640px (the `sm`
 *               breakpoint)
 *   table       8 below the toolbar; min width 1000 scrolls horizontally
 *   select col  16px checkbox, 8 gap, then the first column's content
 *   footer      1px separator-border on top, px 12 pt 12, `Pagination`
 *   density     `SegmentedControl` 20 under the surface, centred
 *
 *   `layout="inset"` — the dashboard templates' flex-row tables (customers,
 *   transactions, campaigns): header and rows sit behind a 12px leading gutter
 *   (`pl-3`) with the first column flush against it, so row hairlines start at
 *   12; every row draws its hairline, the last one too while the table
 *   paginates, and the footer draws none; no selection wash; the sorted
 *   header's label in text-primary; the empty state in a `py-10 pr-3` band.
 *
 *                          light        dark
 *   border-table           neutral-200  neutral-800
 *   separator-border       neutral-200  neutral-800
 *   text-tertiary          neutral-400  neutral-600
 */

/** The `sm` breakpoint, applied to the surface's own width. */
const NARROW_WIDTH = BREAKPOINTS.sm;
const DEFAULT_PAGE_SIZE = 8;

interface DataTablePalette {
  border: string;
  separator: string;
  textTertiary: string;
  text: string;
}

function resolveDataTablePalette(theme: Theme): DataTablePalette {
  const c = theme.colors;
  return {
    border: c.borderLight,
    separator: c.borderLight,
    textTertiary: c.textSecondary,
    text: c.text,
  };
}

/** `inset`: the rows' `pl-3` gutter. */
const INSET_GUTTER = { paddingLeft: 12 } as const;
/** `inset`: the first column's cell has no horizontal inset of its own. */
const INSET_FLUSH_CELL = { paddingLeft: 0, paddingRight: 0 } as const;
/** `inset`: `py-10 pr-3`, centred, inside the rows' `pl-3` gutter. */
const INSET_EMPTY_BAND = {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 40,
  paddingBottom: 40,
  paddingLeft: 12,
  paddingRight: 12,
} as const satisfies ViewStyle;

/** `text-body-medium` / `text-body-2-medium` — the cell type of each density. */
function bodyType(size: DataTableSize): TextStyle {
  return TYPE_SCALE[size === 'sm' ? 'body-2-medium' : 'body-medium'];
}

/** A `basis` column's flex style — see `DataTableColumn.basis`. */
function basisStyle<T>(column: DataTableColumn<T>): ViewStyle | undefined {
  if (column.basis == null) return undefined;
  return {
    flexBasis: column.basis,
    flexGrow: column.basis,
    flexShrink: 1,
    minWidth: column.minWidth ?? 0,
  };
}

function isTextLike(node: React.ReactNode): node is string | number {
  return typeof node === 'string' || typeof node === 'number';
}

function toggleId(ids: readonly string[], id: string, on: boolean): string[] {
  const without = ids.filter((existing) => existing !== id);
  return on ? [...without, id] : without;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  accessibilityLabel,
  title,
  summary,
  toolbar,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
  selectAllLabel: selectAllLabelProp,
  getSelectRowLabel,
  pageSize = DEFAULT_PAGE_SIZE,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  size: sizeProp,
  defaultSize,
  onSizeChange,
  showSizeToggle = false,
  sizeToggleLabels: sizeToggleLabelsProp,
  sizeToggleAccessibilityLabel: sizeToggleAccessibilityLabelProp,
  emptyState,
  minWidth,
  bordered = true,
  layout = 'table',
  style,
  testID,
}: DataTableProps<T>) {
  const { locale, messages } = useMessages(DATA_TABLE_MESSAGES);
  const selectAllLabel = selectAllLabelProp ?? messages.selectAll;
  const sizeToggleLabels = sizeToggleLabelsProp ?? messages.density;
  const sizeToggleAccessibilityLabel = sizeToggleAccessibilityLabelProp ?? messages.densityLabel;
  const { size: scopedSize } = useBloomAppearance(
    { size: defaultSize },
    { size: 'md', tone: 'neutral' },
  );
  const theme = useTheme();
  const palette = useMemo(() => resolveDataTablePalette(theme), [theme]);

  const [size, setSize] = useControllableState<DataTableSize>({
    value: sizeProp,
    defaultValue: scopedSize === 'xs' || scopedSize === 'sm' ? 'sm' : 'md',
    onChange: onSizeChange,
  });
  const [sort, setSort] = useControllableState<DataTableSort | null>({
    // `null` is a controlled "unsorted"; only `undefined` means uncontrolled.
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [selection, setSelection] = useControllableState<readonly string[]>({
    value: selectedRowIds,
    defaultValue: defaultSelectedRowIds,
    onChange: onSelectionChange ? (ids) => onSelectionChange([...ids]) : undefined,
  });
  const [rawPage, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });

  const [width, setWidth] = useState<number | null>(null);
  const narrow = width != null && width < NARROW_WIDTH;
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const sorted = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);
  const totalPages = rows.length === 0 ? 0 : pageCount(rows.length, pageSize);
  const page = clampPage(rawPage, rows.length, pageSize);

  // TanStack's `autoResetPageIndex`: a filtered-down row set that no longer
  // reaches the current page goes back to the last one that exists.
  useEffect(() => {
    if (rawPage !== page) setPage(page);
  }, [rawPage, page, setPage]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize).map((row, index) => ({
      row,
      id: getRowId(row, start + index),
    }));
  }, [sorted, page, pageSize, getRowId]);

  const selectedSet = useMemo(() => new Set(selection), [selection]);
  const pageSelectedCount = pageRows.filter(({ id }) => selectedSet.has(id)).length;
  const allPageSelected = pageRows.length > 0 && pageSelectedCount === pageRows.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  const toggleAllOnPage = useCallback(
    (on: boolean) => {
      const pageIds = new Set(pageRows.map(({ id }) => id));
      const rest = selection.filter((id) => !pageIds.has(id));
      setSelection(on ? [...rest, ...pageIds] : rest);
    },
    [pageRows, selection, setSelection],
  );

  const pressSort = useCallback(
    (column: DataTableColumn<T>) => {
      setSort(nextSort(sort, column, rows));
      // TanStack resets the page index whenever the sorted row model changes.
      if (page !== 1) setPage(1);
    },
    [sort, rows, setSort, page, setPage],
  );

  const bodyText = useMemo(
    () => ({ ...bodyType(size), color: palette.text }),
    [size, palette.text],
  );

  const hasToolbar = title != null || summary != null || toolbar != null;
  const inset = layout === 'inset';
  const paginated = totalPages > 1;
  /** `inset`: the first column sits flush against the 12px gutter. */
  const flushCell = inset ? INSET_FLUSH_CELL : undefined;

  const renderCellContent = (column: DataTableColumn<T>, row: T, id: string, index: number) =>
    column.cell
      ? column.cell({ row, rowId: id, index, size, selected: selectedSet.has(id) })
      : formatValue(column.accessor?.(row), locale);

  return (
    <View testID={testID} style={[{ width: '100%', alignItems: 'center', gap: 20 }, style]}>
      <View
        onLayout={onLayout}
        testID={testID ? `${testID}-surface` : undefined}
        style={{
          width: '100%',
          // `bordered={false}`: the host surface owns the frame, so no second
          // border, radius or top gap inside it.
          ...(bordered
            ? { borderWidth: 1, borderColor: palette.border, borderRadius: 16, paddingTop: 8 }
            : null),
          paddingBottom: totalPages > 1 ? 12 : 0,
        }}
      >
        {hasToolbar ? (
          <View
            style={{
              width: '100%',
              flexDirection: narrow ? 'column' : 'row',
              alignItems: narrow ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <View style={{ justifyContent: 'center', flexShrink: 1, minWidth: 0 }}>
              {isTextLike(title) ? (
                <Text
                  numberOfLines={1}
                  style={[TYPE_SCALE['body-medium'], { color: palette.textTertiary }]}
                >
                  {title}
                </Text>
              ) : (
                title
              )}
              {isTextLike(summary) ? (
                // Wraps: a long count line ("48 customers matching ...") must not
                // be cut off or push the toolbar controls out of view.
                <Text style={[TYPE_SCALE['body-medium'], { color: palette.text }]}>{summary}</Text>
              ) : (
                summary
              )}
            </View>
            {toolbar != null ? (
              <View
                style={{
                  flexShrink: 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  // Below 640 the controls take their own full-width row and
                  // wrap onto further lines; a scrolling row clipped filters.
                  ...(narrow
                    ? { alignSelf: 'stretch', justifyContent: 'flex-start' }
                    : { justifyContent: 'flex-end' }),
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {toolbar}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ marginTop: hasToolbar ? 8 : 0 }}>
          <Table size={size} accessibilityLabel={accessibilityLabel} minWidth={minWidth}>
            <TableHeader style={inset ? INSET_GUTTER : undefined}>
              {columns.map((column, columnIndex) => {
                const sortable = isSortable(column);
                const direction = sort?.columnId === column.id ? sort.direction : 'none';
                // `inset`: the sorted column's label reads in text-primary.
                const labelColor =
                  inset && direction !== 'none' ? palette.text : palette.textTertiary;
                const layout = {
                  width: column.width,
                  flex: column.flex,
                  minWidth: column.minWidth,
                  align: column.align,
                };
                const primaryLabel =
                  labelColor !== palette.textTertiary && isTextLike(column.header);
                return (
                  <TableColumn
                    key={column.id}
                    {...layout}
                    accessibilityLabel={
                      column.headerAccessibilityLabel ??
                      (primaryLabel ? String(column.header) : undefined)
                    }
                    leading={
                      selectable && columnIndex === 0 ? (
                        <Checkbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected}
                          onCheckedChange={toggleAllOnPage}
                          accessibilityLabel={selectAllLabel}
                        />
                      ) : undefined
                    }
                    onSort={sortable ? () => pressSort(column) : undefined}
                    sortDirection={direction}
                    style={[basisStyle(column), columnIndex === 0 ? flushCell : undefined]}
                  >
                    {primaryLabel ? (
                      <Text numberOfLines={1} style={[bodyText, { color: labelColor }]}>
                        {column.header}
                      </Text>
                    ) : (
                      column.header
                    )}
                  </TableColumn>
                );
              })}
            </TableHeader>
            <TableBody emptyState={inset ? undefined : emptyState}>
              {inset && pageRows.length === 0 && emptyState != null ? (
                // `flex w-full items-center justify-center py-10 pr-3`.
                <View style={INSET_EMPTY_BAND}>
                  {isTextLike(emptyState) ? (
                    <Text
                      style={[
                        TYPE_SCALE['body-medium'],
                        { color: palette.textTertiary, textAlign: 'center' },
                      ]}
                    >
                      {emptyState}
                    </Text>
                  ) : (
                    emptyState
                  )}
                </View>
              ) : null}
              {pageRows.map(({ row, id }, index) => {
                const rowSelected = selectedSet.has(id);
                return (
                  <TableRow
                    key={id}
                    selected={selectable ? rowSelected : undefined}
                    style={[
                      inset
                        ? {
                            marginLeft: INSET_GUTTER.paddingLeft,
                            // The hairline also runs under the last row when
                            // the pagination footer follows.
                            borderBottomWidth: paginated || index < pageRows.length - 1 ? 1 : 0,
                          }
                        : null,
                      // No selection wash.
                      inset ? { backgroundColor: 'transparent' } : null,
                    ]}
                  >
                    {columns.map((column, columnIndex) => {
                      const content = renderCellContent(column, row, id, index);
                      if (selectable && columnIndex === 0) {
                        return (
                          <TableCell key={column.id} style={[basisStyle(column), flushCell]}>
                            {/* Stretched to the cell, so a long first-column label truncates
                                instead of spilling into the next column. */}
                            <View
                              style={{
                                alignSelf: 'stretch',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 0,
                              }}
                            >
                              <Checkbox
                                checked={rowSelected}
                                onCheckedChange={(on) => setSelection(toggleId(selection, id, on))}
                                accessibilityLabel={
                                  getSelectRowLabel?.(row, id) ?? messages.selectRow(id)
                                }
                              />
                              {isTextLike(content) ? (
                                <Text numberOfLines={1} style={[bodyText, { flexShrink: 1 }]}>
                                  {content}
                                </Text>
                              ) : (
                                content
                              )}
                            </View>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={column.id}
                          style={[basisStyle(column), columnIndex === 0 ? flushCell : undefined]}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </View>

        {paginated ? (
          <View
            style={{
              borderTopWidth: inset ? 0 : 1,
              borderTopColor: palette.separator,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 12,
            }}
          >
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </View>
        ) : null}
      </View>

      {showSizeToggle ? (
        <View style={{ alignSelf: 'center' }}>
          <SegmentedControl<DataTableSize>
            label={sizeToggleAccessibilityLabel}
            type="radio"
            value={size}
            onValueChange={setSize}
          >
            <SegmentedControlItem value="md">
              <SegmentedControlItemText>{sizeToggleLabels.md}</SegmentedControlItemText>
            </SegmentedControlItem>
            <SegmentedControlItem value="sm">
              <SegmentedControlItemText>{sizeToggleLabels.sm}</SegmentedControlItemText>
            </SegmentedControlItem>
          </SegmentedControl>
        </View>
      ) : null}
    </View>
  );
}

function formatValue(
  value: ReturnType<NonNullable<DataTableColumn<unknown>['accessor']>>,
  locale: string | undefined,
): string {
  if (value == null) return '';
  // The locale's own short date — `toLocaleDateString()` with no locale would
  // always speak the runtime's, whatever `BloomProvider locale` says.
  if (value instanceof Date)
    return (
      formatGregorian(value, locale, { year: 'numeric', month: 'numeric', day: 'numeric' }) ??
      value.toDateString()
    );
  return String(value);
}
