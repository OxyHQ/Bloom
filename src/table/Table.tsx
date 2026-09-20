import { useBloomAppearance } from '../appearance';
import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Platform, Pressable, ScrollView, View, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import type { Theme } from '../theme/types';
import type {
  TableAlign,
  TableBodyProps,
  TableCellProps,
  TableColumnLayout,
  TableColumnProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
  TableSize,
} from './types';

/**
 * Table geometry, to the pixel:
 *
 *                     md          sm
 *   cell inset        10 / 12     6 / 10      (vertical / horizontal)
 *   text              14/20 500   13/18 500
 *   body row          40          30          (+1px hairline between rows)
 *   header row        40 (+2)     30 (+2)     (hairline above and below; 44 / 36
 *                                               with a 24px sort chevron)
 *
 * No radius, no outer border — the table sits inside a surface that owns
 * those (a data table wraps it in a `rounded-2xl border` card).
 *
 * Headers, selections and separators read the shared tonal surface roles.
 * Header labels retain the theme's readable secondary foreground.
 *
 * React Native has no table layout, so the auto column sizing of an HTML table
 * cannot be ported: every row is a flex row, and a column takes a fixed `width`
 * or a `flex` share. The layout props on `TableColumn` are read once by `Table`
 * and applied to the cell at the same index in every row, so they are written
 * once, in the header.
 *
 * Roles are ARIA's table set (`table` › `rowgroup` › `row` › `columnheader` |
 * `cell`), not react-aria's interactive `grid`: Bloom's table has no keyboard
 * cell navigation, and announcing a grid that cannot be navigated is worse than
 * announcing a table.
 */

interface TablePalette {
  headerBackground: string;
  hairline: string;
  headerText: string;
  text: string;
  sortActive: string;
  selectedRow: string;
  ring: string;
}

function resolveTablePalette(theme: Theme): TablePalette {
  const c = theme.colors;
  return {
    headerBackground: c.backgroundSecondary,
    hairline: c.borderLight,
    headerText: c.textSecondary,
    text: c.text,
    sortActive: c.textSecondary,
    selectedRow: c.backgroundSecondary,
    ring: c.primary,
  };
}

const GEOMETRY = {
  md: { paddingVertical: 10, paddingHorizontal: 12, type: 'body-medium' },
  sm: { paddingVertical: 6, paddingHorizontal: 10, type: 'body-2-medium' },
} as const satisfies Record<
  TableSize,
  { paddingVertical: number; paddingHorizontal: number; type: 'body-medium' | 'body-2-medium' }
>;

/**
 * `transition: padding 200ms ease, font-size 200ms ease` on every
 * cell, so switching density eases instead of snapping. Web only — a style
 * transition is not something React Native animates.
 */
const CELL_TRANSITION: WebCssStyle | null = Platform.OS === 'web'
  ? { transitionProperty: 'padding', transitionDuration: '200ms', transitionTimingFunction: 'ease' }
  : null;
/** `tbody tr { transition-colors duration-150 }` — a row's selection wash eases in. */
const ROW_TRANSITION: WebCssStyle | null = Platform.OS === 'web'
  ? { transitionProperty: 'background-color', transitionDuration: '150ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  : null;
const TEXT_TRANSITION: WebCssStyle | null = Platform.OS === 'web'
  ? { transitionProperty: 'font-size, line-height', transitionDuration: '200ms', transitionTimingFunction: 'ease' }
  : null;

/** `size-6` — the sort chevron. */
const SORT_ICON_SIZE = 24;
/** `h-40` — the empty-state band. */
const EMPTY_STATE_HEIGHT = 160;

// ---------------------------------------------------------------------------
//  Keyboard focus on web. The sort button is a react-native-web `Pressable`,
//  so the rule hangs off a `data-*` attribute (a class never reaches the DOM),
//  and is adopted rather than injected as a `<style>` (CSP).
// ---------------------------------------------------------------------------

const IS_WEB = Platform.OS === 'web';
const STYLE_ID = 'bloom-table-web-css';
const SORT_SELECTOR = '[data-bloom-table-sort]';
const TABLE_CSS = `${SORT_SELECTOR} { cursor: pointer; outline: none; }
${SORT_SELECTOR}:focus-visible {
  outline: 2px solid var(--bloom-table-ring, currentColor);
  outline-offset: 2px;
  border-radius: 4px;
}`;

/** `dataSet` is react-native-web's channel for a `data-*` attribute; RN has no type for it. */
type WebDataSet = { dataSet?: Record<string, string> };
/** `aria-sort` is forwarded by react-native-web and untyped in React Native. */
type WebSortProps = { 'aria-sort'?: 'ascending' | 'descending' | 'none' };

interface TableContextValue {
  size: TableSize;
  palette: TablePalette;
  columns: readonly TableColumnLayout[];
}

const TableContext = createContext<TableContextValue | null>(null);
/** Index of the cell being rendered inside its row. */
const CellIndexContext = createContext(-1);
/** Whether the row being rendered is the body's last. */
const LastRowContext = createContext(false);

function useTableContext(): TableContextValue {
  const theme = useTheme();
  const context = useContext(TableContext);
  const fallbackPalette = useMemo(() => resolveTablePalette(theme), [theme]);
  return context ?? { size: 'md', palette: fallbackPalette, columns: [] };
}

function alignItemsFor(align: TableAlign | undefined): ViewStyle['alignItems'] {
  if (align === 'center') return 'center';
  if (align === 'end') return 'flex-end';
  return 'flex-start';
}

function textAlignFor(align: TableAlign | undefined): TextStyle['textAlign'] {
  if (align === 'center') return 'center';
  if (align === 'end') return 'right';
  return 'left';
}

/** Merge a cell's own layout over its column's, then turn it into a style. */
function cellLayoutStyle(
  column: TableColumnLayout | undefined,
  own: TableColumnLayout,
  size: TableSize,
): { style: ViewStyle; align: TableAlign | undefined } {
  const width = own.width ?? column?.width;
  const flex = own.flex ?? column?.flex ?? 1;
  const minWidth = own.minWidth ?? column?.minWidth;
  const align = own.align ?? column?.align;
  const g = GEOMETRY[size];
  return {
    align,
    style: {
      ...(width != null
        ? { width, flexGrow: 0, flexShrink: 0 }
        : { flexGrow: flex, flexShrink: 1, flexBasis: 0, minWidth: minWidth ?? 0 }),
      // Longhands, so a caller's `paddingLeft` override wins on web too.
      paddingTop: g.paddingVertical,
      paddingBottom: g.paddingVertical,
      paddingLeft: g.paddingHorizontal,
      paddingRight: g.paddingHorizontal,
      justifyContent: 'center',
      alignItems: alignItemsFor(align),
    },
  };
}

function textStyleFor(size: TableSize, color: string, align: TableAlign | undefined): TextStyle {
  const g = GEOMETRY[size];
  // `text-body-medium` / `text-body-2-medium`, in Inter (the typography `Text`).
  return {
    ...TYPE_SCALE[g.type],
    color,
    textAlign: textAlignFor(align),
  };
}

function isTextLike(node: React.ReactNode): node is string | number {
  return typeof node === 'string' || typeof node === 'number';
}

/** The column layouts, read off the header's `TableColumn` children. */
function readColumns(children: React.ReactNode): TableColumnLayout[] {
  const header = Children.toArray(children).find(
    (child): child is React.ReactElement<TableHeaderProps> =>
      isValidElement(child) && child.type === TableHeader,
  );
  if (!header) return [];
  return Children.toArray(header.props.children)
    .filter((child): child is React.ReactElement<TableColumnProps> => isValidElement(child))
    .map(({ props }) => ({
      width: props.width,
      flex: props.flex,
      minWidth: props.minWidth,
      align: props.align,
    }));
}

/** Wrap each element child in the index context, so a cell finds its column. */
function indexChildren(children: React.ReactNode): React.ReactNode {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child, index) => (
      <CellIndexContext.Provider key={child.key ?? index} value={index}>
        {child}
      </CellIndexContext.Provider>
    ));
}

export function Table({
  size: sizeProp,
  children,
  accessibilityLabel,
  minWidth,
  style,
  containerStyle,
  testID,
}: TableProps) {
  const {size: inheritedSize} = useBloomAppearance({size: sizeProp}, {size: 'md', tone: 'neutral'});
  const size: NonNullable<TableProps['size']> = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
  const theme = useTheme();
  const palette = useMemo(() => resolveTablePalette(theme), [theme]);
  const columns = readColumns(children);
  const columnsKey = JSON.stringify(columns);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised layouts, not the array identity
  const stableColumns = useMemo(() => columns, [columnsKey]);
  const context = useMemo(
    () => ({ size, palette, columns: stableColumns }),
    [size, palette, stableColumns],
  );

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, TABLE_CSS);
  }, []);

  const table = (
    <View
      role="table"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ width: '100%', minWidth }, style]}
    >
      {children}
    </View>
  );

  return (
    <TableContext.Provider value={context}>
      {minWidth != null ? (
        <ScrollView
          horizontal
          style={[{ width: '100%' }, containerStyle]}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {table}
        </ScrollView>
      ) : (
        <View style={[{ width: '100%' }, containerStyle]}>{table}</View>
      )}
    </TableContext.Provider>
  );
}

export function TableHeader({ children, style, testID }: TableHeaderProps) {
  const { palette } = useTableContext();
  return (
    <View role="rowgroup">
      <View
        role="row"
        testID={testID}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'stretch',
            backgroundColor: palette.headerBackground,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: palette.hairline,
            borderBottomColor: palette.hairline,
          },
          style,
        ]}
      >
        {indexChildren(children)}
      </View>
    </View>
  );
}

function SortChevron({ direction, color }: { direction: TableColumnProps['sortDirection']; color: string }) {
  return (
    // `rotate-180` for ascending, on a wrapper: a transform on the `Svg` itself
    // is not honoured by every react-native-svg target.
    <View style={direction === 'ascending' ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Svg width={SORT_ICON_SIZE} height={SORT_ICON_SIZE} viewBox="0 0 24 24">
        <Path
          d="M12.7071 15.2929C12.3166 15.6834 11.6834 15.6834 11.2929 15.2929L7.70711 11.7071C7.07714 11.0771 7.52331 10 8.41421 10H15.5858C16.4767 10 16.9229 11.0771 16.2929 11.7071L12.7071 15.2929Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

export function TableColumn({
  children,
  onSort,
  sortDirection = 'none',
  accessibilityLabel,
  width,
  flex,
  minWidth,
  align,
  style,
  testID,
}: TableColumnProps) {
  const { size, palette } = useTableContext();
  const layout = cellLayoutStyle(undefined, { width, flex, minWidth, align }, size);
  const labelStyle = textStyleFor(size, palette.headerText, layout.align);
  const label = isTextLike(children) ? (
    <Text numberOfLines={1} style={[labelStyle, TEXT_TRANSITION]}>
      {children}
    </Text>
  ) : (
    children
  );
  const sortProps: WebSortProps = onSort ? { 'aria-sort': sortDirection } : {};
  const sortHook: WebDataSet = IS_WEB ? { dataSet: { bloomTableSort: '' } } : {};

  return (
    <View
      role="columnheader"
      accessibilityLabel={onSort ? undefined : accessibilityLabel}
      testID={testID}
      {...sortProps}
      style={[layout.style, CELL_TRANSITION, style]}
    >
      {onSort ? (
        <Pressable
          {...sortHook}
          role="button"
          onPress={onSort}
          accessibilityLabel={accessibilityLabel ?? (isTextLike(children) ? String(children) : undefined)}
          style={
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              '--bloom-table-ring': palette.ring,
            } as WebCssStyle
          }
        >
          {label}
          <SortChevron
            direction={sortDirection}
            color={sortDirection === 'none' ? palette.headerText : palette.sortActive}
          />
        </Pressable>
      ) : (
        label
      )}
    </View>
  );
}

export function TableBody({ children, emptyState, style, testID }: TableBodyProps) {
  const { palette } = useTableContext();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View role="rowgroup" testID={testID} style={style}>
      {rows.length === 0 && emptyState != null ? (
        <View
          style={{ height: EMPTY_STATE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
        >
          {isTextLike(emptyState) ? (
            <Text style={textStyleFor('md', palette.headerText, 'center')}>
              {emptyState}
            </Text>
          ) : (
            emptyState
          )}
        </View>
      ) : (
        rows.map((row, index) => (
          <LastRowContext.Provider key={row.key ?? index} value={index === rows.length - 1}>
            {row}
          </LastRowContext.Provider>
        ))
      )}
    </View>
  );
}

export function TableRow({ children, selected, style, testID }: TableRowProps) {
  const { palette } = useTableContext();
  const isLast = useContext(LastRowContext);

  return (
    <View
      role="row"
      // Only a row that takes part in selection announces it. Both spellings:
      // react-native-web reads only `aria-selected`, React Native reads
      // `accessibilityState`.
      aria-selected={selected}
      accessibilityState={selected === undefined ? undefined : { selected }}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: selected ? palette.selectedRow : undefined,
          // Separators are drawn BETWEEN rows only — whatever follows the
          // table owns the last edge.
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: palette.hairline,
        },
        ROW_TRANSITION,
        style,
      ]}
    >
      {indexChildren(children)}
    </View>
  );
}

export function TableCell({ children, width, flex, minWidth, align, style, testID }: TableCellProps) {
  const { size, palette, columns } = useTableContext();
  const index = useContext(CellIndexContext);
  const layout = cellLayoutStyle(columns[index], { width, flex, minWidth, align }, size);

  return (
    <View role="cell" testID={testID} style={[layout.style, CELL_TRANSITION, style]}>
      {isTextLike(children) ? (
        <Text style={[textStyleFor(size, palette.text, layout.align), TEXT_TRANSITION]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
