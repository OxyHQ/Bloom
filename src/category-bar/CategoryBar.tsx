import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { CategoryBarItem, CategoryBarProps } from './types';

/**
 * Bloom's category strip: a horizontal, scrollable row of icon-over-label tabs
 * with an optional fixed `trailing` slot on the right.
 *
 *   item        icon 24 · 8 · label caption-1-medium · 10 · 2px bar
 *               12 above the icon; 32 between items (`gap`)
 *   rest        text-secondary icon and label, no bar
 *   hover       text-primary (web)
 *   selected    text-primary, a 2px text-primary bar the width of the label
 *   trailing    24 from the strip, never scrolls
 *
 * The label keeps ONE weight in every state, so selecting an item never
 * reflows the strip.
 *
 * Web: a hidden scrollbar and, at each edge with more to scroll, a round
 * secondary arrow button over a fade into `fadeColor`; an arrow scrolls by
 * roughly a page (the viewport less both fades). Keyboard: the strip is one
 * tab stop (the selected item), ArrowLeft/ArrowRight/Home/End move focus
 * between items, Enter/Space select. Native: a plain horizontal `ScrollView`.
 * On both, the selected item is scrolled into view when it changes and on the
 * first layout.
 *
 * Semantics: `role="tablist"` named by `accessibilityLabel`, each item a
 * `role="tab"` with `aria-selected` (React Native folds it into
 * `accessibilityState.selected`).
 */

const IS_WEB = Platform.OS === 'web';

const ICON_SIZE = 24;
/** Horizontal padding inside each item, so the focus ring clears the label. */
const ITEM_PADDING = 6;
/** Web: width of each edge's fade, arrow included. */
export const CATEGORY_BAR_EDGE = 72;
/** Native: breathing room kept beside an item scrolled into view. */
const NATIVE_REVEAL_INSET = 16;

export interface CategoryBarPaint {
  rest: string;
  active: string;
  ring: string;
}

/** Every colour the bar paints (the arrows are `Button`'s own). Pure. */
export function resolveCategoryBarPaint(theme: Theme): CategoryBarPaint {
  const { accent } = resolveButtonRamps(theme);
  return {
    rest: theme.colors.textSecondary,
    active: theme.colors.text,
    ring: accent[500],
  };
}

export interface CategoryBarScroll {
  /** Scroll offset. */
  x: number;
  /** Visible width. */
  viewport: number;
  /** Scrollable content width. */
  content: number;
}

/** Whether there is more to scroll to each side. 1px slack for fractional offsets. */
export function categoryBarOverflow({ x, viewport, content }: CategoryBarScroll): {
  previous: boolean;
  next: boolean;
} {
  if (viewport <= 0 || content <= viewport + 1) return { previous: false, next: false };
  return { previous: x > 1, next: x < content - viewport - 1 };
}

function clampOffset(target: number, { viewport, content }: CategoryBarScroll): number {
  return Math.min(Math.max(0, target), Math.max(0, content - viewport));
}

/** The offset an arrow scrolls to: the viewport less both fades, at least half of it. */
export function categoryBarPageTarget(scroll: CategoryBarScroll, direction: -1 | 1): number {
  const page = Math.max(scroll.viewport - CATEGORY_BAR_EDGE * 2, scroll.viewport / 2);
  return clampOffset(scroll.x + direction * page, scroll);
}

/**
 * The offset that brings an item (`left`, `width`, in content coordinates) into
 * view with `inset` clear of each edge, or `null` when it already is.
 */
export function categoryBarRevealTarget(
  scroll: CategoryBarScroll,
  left: number,
  width: number,
  inset: number,
): number | null {
  if (scroll.viewport <= 0) return null;
  let target: number | null = null;
  if (left - inset < scroll.x) target = left - inset;
  else if (left + width + inset > scroll.x + scroll.viewport) {
    target = left + width + inset - scroll.viewport;
  }
  if (target === null) return null;
  let clamped = clampOffset(target, scroll);
  // Within one inset of an end, go all the way: stopping a few pixels short
  // would leave an arrow up for a sliver of content.
  const max = Math.max(0, scroll.content - scroll.viewport);
  if (clamped > scroll.x && clamped > max - inset) clamped = max;
  if (clamped < scroll.x && clamped < inset) clamped = 0;
  return Math.abs(clamped - scroll.x) < 1 ? null : clamped;
}

// ---------------------------------------------------------------------------
//  Web CSS — the hidden scrollbar, cursor and keyboard focus ring, none of
//  which an inline style can carry. Hooks are `dataSet` attributes because a
//  class never reaches the DOM through react-native-web.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-category-bar-web-css';
const TRACK = '[data-bloom-category-bar-track]';
const ITEM = '[data-bloom-category-bar-item]';

const BLOOM_CATEGORY_BAR_CSS = `
${TRACK} {
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
${TRACK}::-webkit-scrollbar {
  display: none;
}
${ITEM} {
  cursor: pointer;
  outline: none;
  user-select: none;
}
${ITEM}:focus-visible [data-bloom-category-bar-ring] {
  outline: 2px solid var(--bloom-category-bar-ring, currentColor);
  outline-offset: -2px;
}
`;

function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}

// ---------------------------------------------------------------------------
//  Item
// ---------------------------------------------------------------------------

interface CategoryBarTabProps {
  item: CategoryBarItem;
  selected: boolean;
  tabbable: boolean;
  paint: CategoryBarPaint;
  onSelect: (key: string) => void;
  onKey: (key: string, event: { key: string; preventDefault: () => void }) => void;
  onItemLayout: (key: string, event: LayoutChangeEvent) => void;
  registerRef: (key: string, node: View | null) => void;
  testID?: string;
}

function CategoryBarTab({
  item,
  selected,
  tabbable,
  paint,
  onSelect,
  onKey,
  onItemLayout,
  registerRef,
  testID,
}: CategoryBarTabProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const color = selected || hovered ? paint.active : paint.rest;
  const Icon = item.icon;
  const { key } = item;

  const webProps: Record<string, unknown> = IS_WEB
    ? {
        tabIndex: tabbable ? 0 : -1,
        onKeyDown: (event: { key: string; preventDefault: () => void }) => onKey(key, event),
      }
    : {};

  return (
    <Pressable
      ref={(node) => registerRef(key, node)}
      {...webData({ bloomCategoryBarItem: selected ? 'selected' : '' })}
      {...webProps}
      role="tab"
      accessibilityLabel={item.label}
      aria-selected={selected}
      onPress={() => onSelect(key)}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onLayout={(event) => onItemLayout(key, event)}
      testID={testID}
      style={{
        alignItems: 'center',
        paddingTop: 12,
        paddingLeft: ITEM_PADDING,
        paddingRight: ITEM_PADDING,
      }}
    >
      {/* The keyboard ring, drawn above the selection bar so it never hides it. */}
      <View
        pointerEvents="none"
        {...webData({ bloomCategoryBarRing: '' })}
        style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: 8, borderRadius: 8 }}
      />
      <Icon width={ICON_SIZE} height={ICON_SIZE} fill={color} />
      <View style={{ marginTop: 8, minWidth: ICON_SIZE }}>
        <Text variant="caption-1-medium" numberOfLines={1} style={{ color, textAlign: 'center' }}>
          {item.label}
        </Text>
        <View
          testID={testID ? `${testID}-bar` : undefined}
          style={{
            marginTop: 10,
            height: 2,
            borderRadius: 1,
            backgroundColor: selected ? paint.active : 'transparent',
          }}
        />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Bar
// ---------------------------------------------------------------------------

interface ItemLayout {
  x: number;
  width: number;
}

function CategoryBarComponent({
  items,
  value,
  onValueChange,
  trailing,
  accessibilityLabel,
  gap = 32,
  fadeColor,
  previousLabel = 'Previous categories',
  nextLabel = 'Next categories',
  style,
  testID,
}: CategoryBarProps) {
  const theme = useTheme();
  useAccessibleNameWarning('CategoryBar', accessibilityLabel);
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, BLOOM_CATEGORY_BAR_CSS);
  }, []);
  const reducedMotion = useReducedMotion();
  const paint = useMemo(() => resolveCategoryBarPaint(theme), [theme]);
  const fade = fadeColor ?? theme.colors.background;

  const scrollRef = useRef<ScrollView>(null);
  const scroll = useRef<CategoryBarScroll>({ x: 0, viewport: 0, content: 0 });
  const layouts = useRef(new Map<string, ItemLayout>());
  const nodes = useRef(new Map<string, View>());
  /** The key still waiting to be revealed, and whether that may animate. */
  const pendingReveal = useRef<{ key: string; animated: boolean } | null>(
    value !== undefined ? { key: value, animated: false } : null,
  );
  const [overflow, setOverflow] = useState({ previous: false, next: false });

  const refresh = useCallback(() => {
    const next = categoryBarOverflow(scroll.current);
    setOverflow((current) =>
      current.previous === next.previous && current.next === next.next ? current : next,
    );
  }, []);

  const scrollTo = useCallback(
    (x: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ x, animated: animated && !reducedMotion });
    },
    [reducedMotion],
  );

  const reveal = useCallback(
    (key: string, animated: boolean): boolean => {
      const layout = layouts.current.get(key);
      if (!layout || scroll.current.viewport <= 0) return false;
      const inset = IS_WEB ? CATEGORY_BAR_EDGE : NATIVE_REVEAL_INSET;
      const target = categoryBarRevealTarget(scroll.current, layout.x, layout.width, inset);
      if (target !== null) scrollTo(target, animated);
      return true;
    },
    [scrollTo],
  );

  const flushReveal = useCallback(() => {
    const pending = pendingReveal.current;
    if (pending && reveal(pending.key, pending.animated)) pendingReveal.current = null;
  }, [reveal]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (value === undefined) return;
    pendingReveal.current = { key: value, animated: true };
    flushReveal();
  }, [value, flushReveal]);

  const onItemLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      layouts.current.set(key, { x, width });
      flushReveal();
    },
    [flushReveal],
  );

  const registerRef = useCallback((key: string, node: View | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
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
      flushReveal();
    },
    [refresh, flushReveal],
  );

  const onContentSizeChange = useCallback(
    (width: number) => {
      scroll.current = { ...scroll.current, content: width };
      refresh();
      flushReveal();
    },
    [refresh, flushReveal],
  );

  const page = useCallback(
    (direction: -1 | 1) => scrollTo(categoryBarPageTarget(scroll.current, direction), true),
    [scrollTo],
  );

  const select = useCallback((key: string) => onValueChange?.(key), [onValueChange]);

  const onKey = useCallback(
    (key: string, event: { key: string; preventDefault: () => void }) => {
      const index = items.findIndex((item) => item.key === key);
      let target = -1;
      switch (event.key) {
        case 'ArrowRight':
          target = Math.min(items.length - 1, index + 1);
          break;
        case 'ArrowLeft':
          target = Math.max(0, index - 1);
          break;
        case 'Home':
          target = 0;
          break;
        case 'End':
          target = items.length - 1;
          break;
        case ' ':
        case 'Spacebar':
          // Enter reaches `onPress` through react-native-web's press responder;
          // Space only does for button roles, so a tab answers it here.
          event.preventDefault();
          select(key);
          return;
        default:
          return;
      }
      event.preventDefault();
      const next = items[target];
      if (!next) return;
      nodes.current.get(next.key)?.focus();
      reveal(next.key, true);
    },
    [items, select, reveal],
  );

  const hasSelection = value !== undefined && items.some((item) => item.key === value);

  const trackStyle: WebCssStyle = {
    flexGrow: 1,
    marginLeft: -ITEM_PADDING,
    marginRight: -ITEM_PADDING,
    '--bloom-category-bar-ring': paint.ring,
  };

  const edgeStyle = (side: 'left' | 'right'): WebCssStyle => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    ...(side === 'left' ? { left: -ITEM_PADDING } : { right: -ITEM_PADDING }),
    width: CATEGORY_BAR_EDGE,
    justifyContent: 'center',
    alignItems: side === 'left' ? 'flex-start' : 'flex-end',
    backgroundImage: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${fade} 0%, ${fade} 50%, transparent 100%)`,
  });

  return (
    <View testID={testID} style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <View style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <ScrollView
          ref={scrollRef}
          {...webData({ bloomCategoryBarTrack: '' })}
          horizontal
          role="tablist"
          accessibilityLabel={accessibilityLabel}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={onTrackLayout}
          onContentSizeChange={onContentSizeChange}
          style={trackStyle}
          contentContainerStyle={{ gap: Math.max(0, gap - ITEM_PADDING * 2) }}
          testID={testID ? `${testID}-track` : undefined}
        >
          {items.map((item, index) => (
            <CategoryBarTab
              key={item.key}
              item={item}
              selected={item.key === value}
              tabbable={hasSelection ? item.key === value : index === 0}
              paint={paint}
              onSelect={select}
              onKey={onKey}
              onItemLayout={onItemLayout}
              registerRef={registerRef}
              testID={testID ? `${testID}-item-${item.key}` : undefined}
            />
          ))}
        </ScrollView>
        {IS_WEB && overflow.previous ? (
          <View pointerEvents="box-none" style={edgeStyle('left')}>
            <Button
              variant="secondary"
              size="small"
              iconOnly
              leadingIcon={RiArrowLeftSLine}
              accessibilityLabel={previousLabel}
              tabIndex={-1}
              onPress={() => page(-1)}
              testID={testID ? `${testID}-previous` : undefined}
            />
          </View>
        ) : null}
        {IS_WEB && overflow.next ? (
          <View pointerEvents="box-none" style={edgeStyle('right')}>
            <Button
              variant="secondary"
              size="small"
              iconOnly
              leadingIcon={RiArrowRightSLine}
              accessibilityLabel={nextLabel}
              tabIndex={-1}
              onPress={() => page(1)}
              testID={testID ? `${testID}-next` : undefined}
            />
          </View>
        ) : null}
      </View>
      {trailing != null ? (
        <View style={{ flexShrink: 0, marginLeft: 24, justifyContent: 'center' }}>{trailing}</View>
      ) : null}
    </View>
  );
}

export const CategoryBar = memo(CategoryBarComponent);
CategoryBar.displayName = 'CategoryBar';
