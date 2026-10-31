import { ScrollArea } from '../layout/ScrollArea';
import React, {
  type ComponentRef,
  Children,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MEDIA_SHELF_CSS,
  MEDIA_SHELF_STYLE_ID,
  SHELF_GAP,
  shelfColumns,
  shelfGridColumns,
  shelfOverflow,
  shelfPageColumns,
  shelfPageTarget,
  type ShelfScroll,
} from './shared';
import { ShelfCellContext } from './context';
import type { ShelfProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { MEDIA_SHELF_MESSAGES } from './messages';
import { IS_WEB } from '../styles/platform';

/**
 * A section of a home or search page: a header over a run of items.
 *
 *   header      [avatar 24 · eyebrow caption-1-regular]      Show all  (‹)(›)
 *               title title-2-bold
 *               subtitle body-2-regular, text-secondary
 *   gap         12 between header and items
 *   row         one horizontal line, `gap` 16 (web) / 12 (native)
 *   grid        `rows` rows of as many ≥ `minItemWidth` columns as fit
 *   paged       whole columns of `rows` items, as many ≥ `minItemWidth` as fit
 *               the measured track less its insets and `peek`; a page is
 *               exactly those columns and their gaps
 *
 * Web row: a hidden scrollbar, items snap to their start, and round secondary
 * prev/next buttons sit in the header, each disabled at its end and both
 * hidden while nothing overflows. Native row: a plain horizontal `ScrollView`
 * (snapping per item when `itemWidth` is given). Paged is the row's track with
 * computed column widths: the buttons step one page, a column snaps to the
 * start on web and native, and each item learns its place (`useShelfCell`).
 *
 * "Show all" is `text-secondary` and turns `text` on hover — colour only. The
 * title is a heading (`aria-level`, default 2); with `onTitlePress` it is also
 * a link to the same page and underlines on hover.
 *
 * Semantics: `role="group"` named by `title`; each item is a plain child —
 * the tiles bring their own names.
 */
function ShelfComponent({
  title,
  subtitle,
  eyebrow,
  eyebrowAvatar,
  onTitlePress,
  onShowAll,
  showAllLabel: showAllLabelProp,
  layout = 'row',
  itemWidth,
  minItemWidth = 160,
  rows = 1,
  peek = 0,
  gap = SHELF_GAP,
  rowGap: rowGapProp,
  contentInset = 0,
  headingLevel = 2,
  previousLabel: previousLabelProp,
  nextLabel: nextLabelProp,
  children,
  style,
  testID,
}: ShelfProps) {
  const common = useCommonMessages();
  const { messages } = useMessages(MEDIA_SHELF_MESSAGES);
  const showAllLabel = showAllLabelProp ?? messages.showAll;
  const previousLabel = previousLabelProp ?? common.previous;
  const nextLabel = nextLabelProp ?? common.next;
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    adoptStyleSheet(MEDIA_SHELF_STYLE_ID, MEDIA_SHELF_CSS);
  }, []);
  const ring = useMemo(() => resolveButtonRamps(theme).accent[500], [theme]);

  const items = Children.toArray(children);
  const rowGap = rowGapProp ?? gap;

  // ---- row scrolling -------------------------------------------------------
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scroll = useRef<ShelfScroll>({ x: 0, viewport: 0, content: 0 });
  const [overflow, setOverflow] = useState({ previous: false, next: false });

  const refresh = useCallback(() => {
    const next = shelfOverflow(scroll.current);
    setOverflow((current) =>
      current.previous === next.previous && current.next === next.next ? current : next,
    );
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      scroll.current = {
        x: contentOffset.x,
        viewport: layoutMeasurement.width || scroll.current.viewport,
        content: contentSize.width || scroll.current.content,
      };
      refresh();
    },
    [refresh],
  );

  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      scroll.current = { ...scroll.current, viewport: width };
      setTrackWidth((current) => (Math.abs(current - width) < 0.5 ? current : width));
      refresh();
    },
    [refresh],
  );

  const onContentSizeChange = useCallback(
    (width: number) => {
      scroll.current = { ...scroll.current, content: width };
      refresh();
    },
    [refresh],
  );

  // ---- paged -----------------------------------------------------------------
  const [trackWidth, setTrackWidth] = useState(0);
  const paged = shelfPageColumns(trackWidth, { minItemWidth, gap, inset: contentInset, peek });
  const pageSize = layout === 'paged' ? paged.page : undefined;

  const page = useCallback(
    (direction: -1 | 1) => {
      scrollRef.current?.scrollTo({
        x: shelfPageTarget(scroll.current, direction, pageSize),
        animated: !reducedMotion,
      });
    },
    [reducedMotion, pageSize],
  );

  // ---- grid ----------------------------------------------------------------
  const [gridWidth, setGridWidth] = useState(0);
  const onGridLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setGridWidth((current) => (Math.abs(current - width) < 0.5 ? current : width));
  }, []);
  const grid = shelfGridColumns(gridWidth, minItemWidth, gap);

  const showArrows =
    IS_WEB && (layout === 'row' || layout === 'paged') && (overflow.previous || overflow.next);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {eyebrow ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {eyebrowAvatar != null ? (
              <Avatar
                source={eyebrowAvatar}
                size={24}
                testID={testID ? `${testID}-eyebrow-avatar` : undefined}
              />
            ) : null}
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: theme.colors.textSecondary, flexShrink: 1 }}
            >
              {eyebrow}
            </Text>
          </View>
        ) : null}
        <ShelfTitle
          title={title}
          headingLevel={headingLevel}
          onPress={onTitlePress}
          ring={ring}
          testID={testID ? `${testID}-title` : undefined}
        />
        {subtitle ? (
          <Text
            variant="body-2-regular"
            numberOfLines={2}
            style={{ color: theme.colors.textSecondary }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onShowAll || showArrows ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {onShowAll ? (
            <ShowAllButton
              label={showAllLabel}
              title={title}
              onPress={onShowAll}
              ring={ring}
              testID={testID ? `${testID}-show-all` : undefined}
            />
          ) : null}
          {showArrows ? (
            <View
              {...webDataSet({ bloomShelfArrows: '' })}
              style={{ flexDirection: 'row', gap: 8 }}
            >
              <Button
                size="sm"
                iconOnly
                leadingIcon={RiArrowLeftSLine}
                accessibilityLabel={`${previousLabel}: ${title}`}
                disabled={!overflow.previous}
                onPress={() => page(-1)}
                testID={testID ? `${testID}-previous` : undefined}
                tone="neutral"
                appearance="outline"
              />
              <Button
                size="sm"
                iconOnly
                leadingIcon={RiArrowRightSLine}
                accessibilityLabel={`${nextLabel}: ${title}`}
                disabled={!overflow.next}
                onPress={() => page(1)}
                testID={testID ? `${testID}-next` : undefined}
                tone="neutral"
                appearance="outline"
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let body: React.ReactNode;
  if (layout === 'grid') {
    const limit =
      grid.columns > 0 && Number.isFinite(rows) ? grid.columns * Math.max(1, rows) : items.length;
    body = (
      <View
        onLayout={onGridLayout}
        style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap }}
        testID={testID ? `${testID}-grid` : undefined}
      >
        {grid.columns > 0
          ? items.slice(0, limit).map((child, index) => (
              <View
                key={(child as { key?: React.Key }).key ?? index}
                style={{ width: grid.itemWidth, minWidth: 0 }}
              >
                <ShelfCellContext.Provider
                  value={gridCell(index, grid.columns, Math.min(limit, items.length))}
                >
                  {child}
                </ShelfCellContext.Provider>
              </View>
            ))
          : null}
      </View>
    );
  } else {
    const snapWidth = layout === 'paged' ? paged.itemWidth : itemWidth;
    const trackStyle: WebCssStyle = {
      marginLeft: -contentInset,
      marginRight: -contentInset,
      '--bloom-shelf-inset': `${contentInset}px`,
    };
    body = (
      <ScrollArea
        ref={scrollRef}
        {...webDataSet({ bloomShelfTrack: '' })}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onTrackLayout}
        onContentSizeChange={onContentSizeChange}
        decelerationRate={!IS_WEB && snapWidth ? 'fast' : undefined}
        snapToInterval={!IS_WEB && snapWidth ? snapWidth + gap : undefined}
        snapToAlignment={!IS_WEB && snapWidth ? 'start' : undefined}
        style={trackStyle}
        contentContainerStyle={{
          gap,
          paddingLeft: contentInset,
          paddingRight: contentInset,
          alignItems: 'flex-start',
        }}
        testID={testID ? `${testID}-track` : undefined}
      >
        {layout === 'paged'
          ? paged.columns > 0
            ? shelfColumns(items, rows).map((column, columnIndex) => (
                <View
                  key={columnKey(column, columnIndex)}
                  {...webDataSet({ bloomShelfItem: '' })}
                  style={{ width: paged.itemWidth, gap: rowGap }}
                  testID={testID ? `${testID}-column` : undefined}
                >
                  {column.map((child, row) => (
                    <ShelfCellContext.Provider
                      key={(child as { key?: React.Key }).key ?? row}
                      value={pagedCell(row, rows, columnIndex, column.length)}
                    >
                      {child}
                    </ShelfCellContext.Provider>
                  ))}
                </View>
              ))
            : null
          : items.map((child, index) => (
              <View
                key={(child as { key?: React.Key }).key ?? index}
                {...webDataSet({ bloomShelfItem: '' })}
                style={itemWidth ? { width: itemWidth } : undefined}
              >
                {child}
              </View>
            ))}
      </ScrollArea>
    );
  }

  return (
    <View
      collapsable={false}
      role="group"
      accessibilityLabel={title}
      style={[{ gap: 12, minWidth: 0 }, style]}
      testID={testID}
    >
      {header}
      {body}
    </View>
  );
}

/** The place of item `index` in a grid of `columns` showing `count` items. */
function gridCell(index: number, columns: number, count: number) {
  const row = Math.floor(index / columns);
  const rows = Math.ceil(count / columns);
  return {
    layout: 'grid' as const,
    row,
    rows,
    column: index % columns,
    lastInColumn: index + columns >= count,
  };
}

/** The place of the `row`th item of a paged column holding `length` items. */
function pagedCell(row: number, rows: number, column: number, length: number) {
  return {
    layout: 'paged' as const,
    row,
    rows: Math.max(1, Math.floor(Number.isFinite(rows) ? rows : 1)),
    column,
    lastInColumn: row === length - 1,
  };
}

/** A column's key: its first item's, so a column keeps its identity as items are added. */
function columnKey(column: readonly React.ReactNode[], index: number): React.Key {
  const first = column[0] as { key?: React.Key } | undefined;
  return first?.key != null ? `column-${String(first.key)}` : index;
}

function ShelfTitle({
  title,
  headingLevel,
  onPress,
  ring,
  testID,
}: {
  title: string;
  headingLevel: number;
  onPress?: () => void;
  ring: string;
  testID?: string;
}) {
  const theme = useTheme();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const heading = (
    <Text
      role="heading"
      aria-level={headingLevel}
      variant="title-2-bold"
      numberOfLines={1}
      style={{
        color: theme.colors.text,
        textDecorationLine: onPress && hovered ? 'underline' : 'none',
      }}
      testID={onPress ? undefined : testID}
    >
      {title}
    </Text>
  );
  if (!onPress) return heading;
  const linkStyle: WebCssStyle = {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    '--bloom-shelf-ring': ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomShelfLink: '' })}
      role="link"
      accessibilityLabel={title}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={linkStyle}
      testID={testID}
    >
      {heading}
    </Pressable>
  );
}

function ShowAllButton({
  label,
  title,
  onPress,
  ring,
  testID,
}: {
  label: string;
  title: string;
  onPress: () => void;
  ring: string;
  testID?: string;
}) {
  const theme = useTheme();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const style: WebCssStyle = {
    minHeight: 32,
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    '--bloom-shelf-ring': ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomShelfLink: '' })}
      role="button"
      // The visible text leads the name, so a voice command of "Show all" still matches.
      accessibilityLabel={`${label}: ${title}`}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={style}
      testID={testID}
    >
      <Text
        variant="body-2-semibold"
        numberOfLines={1}
        style={{ color: hovered ? theme.colors.text : theme.colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const Shelf = memo(ShelfComponent);
Shelf.displayName = 'Shelf';
