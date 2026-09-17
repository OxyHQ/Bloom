import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../button';
import { resolveButtonPalette, resolveButtonRamps } from '../button/shared';
import { Checkbox } from '../checkbox';
import { useControllableState } from '../hooks/use-controllable-state';
import { Pagination } from '../pagination';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import type { WebCssStyle } from '../styles/web-view-style';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../table';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { Text, TYPE_SCALE } from '../typography';
import { clampPage, isSortable, nextSort, pageCount, sortRows } from './sorting';
import type {
  DataTableColumn,
  DataTableProps,
  DataTableRowActionProps,
  DataTableSize,
  DataTableSort,
} from './types';

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
 *               (text-primary), both body-medium; controls gap 10, wrapping
 *               to their own scrolling row below 640px (the `sm` breakpoint)
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
const NARROW_WIDTH = 640;
const DEFAULT_PAGE_SIZE = 8;
const DEFAULT_SIZE_LABELS = { md: 'Normal', sm: 'Compact' } as const;
/** react-aria's `TooltipTrigger delay={200}`. */
const TOOLTIP_DELAY_MS = 200;
const IS_WEB = Platform.OS === 'web';

interface DataTablePalette {
  border: string;
  separator: string;
  textTertiary: string;
  text: string;
}

function resolveDataTablePalette(theme: Theme): DataTablePalette {
  const { neutral: n } = resolveButtonRamps(theme);
  return theme.isDark
    ? { border: n[800], separator: n[800], textTertiary: n[600], text: theme.colors.text }
    : { border: n[200], separator: n[200], textTertiary: n[400], text: theme.colors.text };
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
  return { flexBasis: column.basis, flexGrow: column.basis, flexShrink: 1, minWidth: column.minWidth ?? 0 };
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
  selectAllLabel = 'Select all rows on this page',
  getSelectRowLabel,
  pageSize = DEFAULT_PAGE_SIZE,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  size: sizeProp,
  defaultSize = 'md',
  onSizeChange,
  showSizeToggle = false,
  sizeToggleLabels = DEFAULT_SIZE_LABELS,
  sizeToggleAccessibilityLabel = 'Table density',
  emptyState,
  minWidth,
  layout = 'table',
  style,
  testID,
}: DataTableProps<T>) {
  const theme = useTheme();
  const palette = useMemo(() => resolveDataTablePalette(theme), [theme]);

  const [size, setSize] = useControllableState<DataTableSize>({
    value: sizeProp,
    defaultValue: defaultSize,
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
      : formatValue(column.accessor?.(row));

  return (
    <View testID={testID} style={[{ width: '100%', alignItems: 'center', gap: 20 }, style]}>
      <View
        onLayout={onLayout}
        style={{
          width: '100%',
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 16,
          paddingTop: 8,
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
            <View style={{ justifyContent: 'center', flexShrink: 0 }}>
              {isTextLike(title) ? (
                <Text numberOfLines={1} style={[TYPE_SCALE['body-medium'], { color: palette.textTertiary }]}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {isTextLike(summary) ? (
                <Text numberOfLines={1} style={[TYPE_SCALE['body-medium'], { color: palette.text }]}>
                  {summary}
                </Text>
              ) : (
                summary
              )}
            </View>
            {toolbar != null ? (
              narrow ? (
                // `-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto px-3`: the
                // controls scroll edge to edge under the title on a phone.
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginLeft: -12, marginRight: -12, alignSelf: 'stretch' }}
                  contentContainerStyle={{ paddingLeft: 12, paddingRight: 12, gap: 10, alignItems: 'center' }}
                >
                  {toolbar}
                </ScrollView>
              ) : (
                <View
                  style={{
                    flexShrink: 1,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {toolbar}
                </View>
              )
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
                const labelColor = inset && direction !== 'none' ? palette.text : palette.textTertiary;
                const layout = {
                  width: column.width,
                  flex: column.flex,
                  minWidth: column.minWidth,
                  align: column.align,
                };
                if (selectable && columnIndex === 0) {
                  return (
                    <TableColumn
                      key={column.id}
                      {...layout}
                      accessibilityLabel={column.headerAccessibilityLabel}
                      style={[basisStyle(column), flushCell]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected}
                          onCheckedChange={toggleAllOnPage}
                          accessibilityLabel={selectAllLabel}
                        />
                        {sortable ? (
                          <SortButton
                            label={column.header}
                            accessibilityLabel={column.headerAccessibilityLabel}
                            direction={direction}
                            color={labelColor}
                            textStyle={bodyText}
                            onPress={() => pressSort(column)}
                          />
                        ) : isTextLike(column.header) ? (
                          <Text numberOfLines={1} style={[bodyText, { color: palette.textTertiary }]}>
                            {column.header}
                          </Text>
                        ) : (
                          column.header
                        )}
                      </View>
                    </TableColumn>
                  );
                }
                const primaryLabel = labelColor !== palette.textTertiary && isTextLike(column.header);
                return (
                  <TableColumn
                    key={column.id}
                    {...layout}
                    accessibilityLabel={
                      column.headerAccessibilityLabel ?? (primaryLabel ? String(column.header) : undefined)
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
                    <Text style={[TYPE_SCALE['body-medium'], { color: palette.textTertiary, textAlign: 'center' }]}>
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
                            <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <Checkbox
                                checked={rowSelected}
                                onCheckedChange={(on) => setSelection(toggleId(selection, id, on))}
                                accessibilityLabel={getSelectRowLabel?.(row, id) ?? `Select row ${id}`}
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
            onChange={setSize}
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

function formatValue(value: ReturnType<NonNullable<DataTableColumn<unknown>['accessor']>>): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

// ---------------------------------------------------------------------------
//  The header sort button, for the ONE column `TableColumn` cannot draw it in:
//  the selection column, whose checkbox has to sit BESIDE the button (a checkbox
//  inside a `<button>` is invalid markup and unreachable by keyboard). Same
//  geometry and hooks as `TableColumn`'s own: label + 24px chevron, gap 2, the
//  `data-bloom-table-sort` focus rule `Table` adopts.
// ---------------------------------------------------------------------------

const SORT_ICON_SIZE = 24;
const SORT_PATH =
  'M12.7071 15.2929C12.3166 15.6834 11.6834 15.6834 11.2929 15.2929L7.70711 11.7071C7.07714 11.0771 7.52331 10 8.41421 10H15.5858C16.4767 10 16.9229 11.0771 16.2929 11.7071L12.7071 15.2929Z';

/** `dataSet` is react-native-web's channel for a `data-*` attribute; RN has no type for it. */
type WebDataSet = { dataSet?: Record<string, string> };
/** `aria-sort` is forwarded by react-native-web and untyped in React Native. */
type WebSortProps = { 'aria-sort'?: 'ascending' | 'descending' | 'none' };

function SortButton({
  label,
  accessibilityLabel,
  direction,
  color,
  textStyle,
  onPress,
}: {
  label: React.ReactNode;
  accessibilityLabel?: string;
  direction: 'ascending' | 'descending' | 'none';
  color: string;
  textStyle: TextStyle;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomTableSort: '' } } : {};
  const sortProps: WebSortProps = { 'aria-sort': direction };
  const ring: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    '--bloom-table-ring': accent[500],
  };
  return (
    <Pressable
      {...hook}
      role="button"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? (isTextLike(label) ? String(label) : undefined)}
      {...sortProps}
      style={ring}
    >
      {isTextLike(label) ? (
        <Text numberOfLines={1} style={[textStyle, { color }]}>
          {label}
        </Text>
      ) : (
        label
      )}
      <SortGlyph direction={direction} color={direction === 'none' ? color : neutral[500]} />
    </Pressable>
  );
}

function SortGlyph({ direction, color }: { direction: 'ascending' | 'descending' | 'none'; color: string }) {
  return (
    <View style={direction === 'ascending' ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Svg width={SORT_ICON_SIZE} height={SORT_ICON_SIZE} viewBox="0 0 24 24">
        <Path d={SORT_PATH} fill={color} />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Row action — an `IconButton size="small"` under a `TooltipTrigger
//  delay={200}` with a `md` tooltip. The button is Bloom's secondary `Button`
//  (32×32, pill per Bloom's radius rule) with a 16px glyph.
// ---------------------------------------------------------------------------

/** `IconButton`'s small glyph. */
const ROW_ACTION_ICON_SIZE = 16;

export function DataTableRowAction({
  icon: Icon,
  label,
  active = false,
  tooltip = true,
  accessibilityLabel,
  style,
  ...buttonProps
}: DataTableRowActionProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDown = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const activeStyle = useMemo((): WebCssStyle | ViewStyle | undefined => {
    if (!active) return undefined;
    const paint = resolveButtonPalette('secondary', theme).active;
    return IS_WEB
      ? {
          '--bloom-btn-bg': paint.background,
          '--bloom-btn-bg-hover': paint.background,
          '--bloom-btn-border': paint.border,
          '--bloom-btn-border-hover': paint.border,
        }
      : { backgroundColor: paint.background, borderColor: paint.border };
  }, [active, theme]);

  // Painted `currentColor` on web so the glyph follows the button's state
  // colours; native has no inherited colour, so it takes the label colour.
  const fill = IS_WEB ? 'currentColor' : theme.colors.text;

  const button = (
    <Button
      {...buttonProps}
      variant="secondary"
      size="small"
      iconOnly
      accessibilityLabel={accessibilityLabel ?? label}
      icon={<Icon width={ROW_ACTION_ICON_SIZE} height={ROW_ACTION_ICON_SIZE} fill={fill} />}
      style={[activeStyle, style]}
    />
  );

  if (!tooltip || !IS_WEB) return button;

  // The web `Tooltip` lays a full-screen press-to-dismiss backdrop over the page
  // while it is open. Under a HOVER tooltip that backdrop lands under the
  // pointer: the trigger reports a pointer-leave the moment the bubble opens
  // (so it closed again after one frame), and the next click on the button hit
  // the backdrop instead. `pointerEvents="none"` on this wrapper makes its
  // direct children — the backdrop among them — inert (react-native-web emits
  // `>* { pointer-events: none }`), and the `"auto"` View below hands the
  // button its events back. A hover tooltip dismisses on leave and blur, so the
  // backdrop has nothing to do here.
  return (
    <View pointerEvents="none">
      <Tooltip position="top" visible={open && !active} onVisibleChange={setOpen}>
        <TooltipTrigger>
          <View
            pointerEvents="auto"
            onPointerEnter={() => {
              clearTimer();
              timer.current = setTimeout(() => setOpen(true), TOOLTIP_DELAY_MS);
            }}
            onPointerLeave={() => {
              clearTimer();
              setOpen(false);
            }}
            onPointerDown={() => {
              // react-aria closes a tooltip on press, and a press-focus is not a
              // keyboard focus — only the latter opens it.
              pointerDown.current = true;
              clearTimer();
              setOpen(false);
            }}
            onFocus={() => {
              if (!pointerDown.current) setOpen(true);
              pointerDown.current = false;
            }}
            onBlur={() => {
              clearTimer();
              setOpen(false);
            }}
          >
            {button}
          </View>
        </TooltipTrigger>
        <TooltipTextBubble size="md">{label}</TooltipTextBubble>
      </Tooltip>
    </View>
  );
}
