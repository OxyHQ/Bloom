import React, { Children, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  IS_WEB,
  MEDIA_SHELF_CSS,
  MEDIA_SHELF_STYLE_ID,
  SHELF_GAP,
  shelfGridColumns,
  shelfOverflow,
  shelfPageTarget,
  webData,
  type ShelfScroll,
} from './shared';
import type { ShelfProps } from './types';

/**
 * A section of a home or search page: a header over a run of items.
 *
 *   header      [avatar 24 · eyebrow caption-1-regular]      Show all  (‹)(›)
 *               title title-2-bold
 *               subtitle body-2-regular, text-secondary
 *   gap         12 between header and items
 *   row         one horizontal line, `gap` 16 (web) / 12 (native)
 *   grid        `rows` rows of as many ≥ `minItemWidth` columns as fit
 *
 * Web row: a hidden scrollbar, items snap to their start, and round secondary
 * prev/next buttons sit in the header, each disabled at its end and both
 * hidden while nothing overflows. Native row: a plain horizontal `ScrollView`
 * (snapping per item when `itemWidth` is given).
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
  showAllLabel = 'Show all',
  layout = 'row',
  itemWidth,
  minItemWidth = 160,
  rows = 1,
  gap = SHELF_GAP,
  contentInset = 0,
  headingLevel = 2,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  children,
  style,
  testID,
}: ShelfProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    adoptStyleSheet(MEDIA_SHELF_STYLE_ID, MEDIA_SHELF_CSS);
  }, []);
  const ring = useMemo(() => resolveButtonRamps(theme).accent[500], [theme]);

  const items = Children.toArray(children);

  // ---- row scrolling -------------------------------------------------------
  const scrollRef = useRef<ScrollView>(null);
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
      scroll.current = { ...scroll.current, viewport: event.nativeEvent.layout.width };
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

  const page = useCallback(
    (direction: -1 | 1) => {
      scrollRef.current?.scrollTo({
        x: shelfPageTarget(scroll.current, direction),
        animated: !reducedMotion,
      });
    },
    [reducedMotion],
  );

  // ---- grid ----------------------------------------------------------------
  const [gridWidth, setGridWidth] = useState(0);
  const onGridLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setGridWidth((current) => (Math.abs(current - width) < 0.5 ? current : width));
  }, []);
  const grid = shelfGridColumns(gridWidth, minItemWidth, gap);

  const showArrows = IS_WEB && layout === 'row' && (overflow.previous || overflow.next);

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
            <View {...webData({ bloomShelfArrows: '' })} style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                variant="secondary"
                size="small"
                iconOnly
                leadingIcon={RiArrowLeftSLine}
                accessibilityLabel={`${previousLabel}: ${title}`}
                disabled={!overflow.previous}
                onPress={() => page(-1)}
                testID={testID ? `${testID}-previous` : undefined}
              />
              <Button
                variant="secondary"
                size="small"
                iconOnly
                leadingIcon={RiArrowRightSLine}
                accessibilityLabel={`${nextLabel}: ${title}`}
                disabled={!overflow.next}
                onPress={() => page(1)}
                testID={testID ? `${testID}-next` : undefined}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let body: React.ReactNode;
  if (layout === 'grid') {
    const limit = grid.columns > 0 && Number.isFinite(rows) ? grid.columns * Math.max(1, rows) : items.length;
    body = (
      <View
        onLayout={onGridLayout}
        style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: gap }}
        testID={testID ? `${testID}-grid` : undefined}
      >
        {grid.columns > 0
          ? items.slice(0, limit).map((child, index) => (
              <View
                key={(child as { key?: React.Key }).key ?? index}
                style={{ width: grid.itemWidth, minWidth: 0 }}
              >
                {child}
              </View>
            ))
          : null}
      </View>
    );
  } else {
    const trackStyle: WebCssStyle = {
      marginLeft: -contentInset,
      marginRight: -contentInset,
      '--bloom-shelf-inset': `${contentInset}px`,
    };
    body = (
      <ScrollView
        ref={scrollRef}
        {...webData({ bloomShelfTrack: '' })}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onTrackLayout}
        onContentSizeChange={onContentSizeChange}
        decelerationRate={!IS_WEB && itemWidth ? 'fast' : undefined}
        snapToInterval={!IS_WEB && itemWidth ? itemWidth + gap : undefined}
        snapToAlignment={!IS_WEB && itemWidth ? 'start' : undefined}
        style={trackStyle}
        contentContainerStyle={{
          gap,
          paddingLeft: contentInset,
          paddingRight: contentInset,
          alignItems: 'flex-start',
        }}
        testID={testID ? `${testID}-track` : undefined}
      >
        {items.map((child, index) => (
          <View
            key={(child as { key?: React.Key }).key ?? index}
            {...webData({ bloomShelfItem: '' })}
            style={itemWidth ? { width: itemWidth } : undefined}
          >
            {child}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View
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
  const linkStyle: WebCssStyle = { alignSelf: 'flex-start', maxWidth: '100%', '--bloom-shelf-ring': ring };
  return (
    <Pressable
      {...webData({ bloomShelfLink: '' })}
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
      {...webData({ bloomShelfLink: '' })}
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
