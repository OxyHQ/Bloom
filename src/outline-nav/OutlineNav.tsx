import React, { useMemo } from 'react';
import { Platform, Pressable, View, type GestureResponderEvent } from 'react-native';

import { Meter } from '../stat-bar';
import { useInteractionState } from '../hooks/use-interaction-state';
import { surfaceTextOn, useRingOffsetStyle, useSurfaceFill } from '../styles/surface-levels';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { buildOutlineTree, compactHeadings, outlineProgress, type OutlineNode } from './shared';
import type { OutlineHeading, OutlineNavLabels, OutlineNavProps } from './types';

/**
 * The document's own table of contents.
 *
 *   rail         2px down the left of every row; the tone only on the current one
 *   indent       14px per nesting level, carried by the nested LIST, not by a
 *                per-row padding — the indent and the structure are the same fact
 *   row height   36 (`full`) / 44 (`compact`, which is the touch one)
 *   progress     a `Meter` above the list, 4px (`full`) / 3px (`compact`)
 *
 * **It is a real list.** `role="list"` with `role="listitem"` children, nested
 * one list inside another for each level, so a screen reader announces "list,
 * 3 items, list, 2 items" and the reader knows the shape of the document. A
 * flat list of rows with a left padding LOOKS the same and says nothing. The
 * tree is built from the ORDER (`shared.ts`), because real documents skip
 * levels.
 *
 * **The current heading is `aria-current`, not `aria-selected`.** The reader is
 * AT it; they have not chosen it from a set. Both spellings for the two
 * platforms, as always.
 *
 * **This component does not jump.** `onSelect` emits and the app scrolls — a
 * TOC that scrolled something itself would have to guess which scroller, and in
 * a split view it would guess wrong with no error (`docs/composition.mdx`
 * §Scroll ownership).
 *
 * **`compact` DROPS the deep levels rather than squeezing them.** Below
 * `compactMaxLevel` an indent on a 360px screen is a few pixels nobody reads, so
 * the honest compact form is a shorter list of full-width rows at a touch size.
 */

const IS_WEB = Platform.OS === 'web';

const STYLE_ID = 'bloom-outline-nav-web-css';
const ROW = '[data-bloom-outline-row]';

const OUTLINE_NAV_CSS = interactiveWebCss({
  selector: ROW,
  varPrefix: 'bloom-outline',
  reset: 'none',
  transition: 'color 120ms ease',
  outlineOffset: 2,
});

const DEFAULT_LABELS: Required<OutlineNavLabels> = {
  outline: 'On this page',
  progress: (at, of) => `Heading ${at} of ${of}`,
};

/** 14px per level, carried by the nested list so the indent IS the structure. */
const INDENT = 14;
/** The rail down the left of every row; only the current one is painted. */
const RAIL = 2;

interface RowPaint {
  text: string;
  quiet: string;
  accent: string;
  rail: string;
}

function OutlineRow({
  heading,
  active,
  paint,
  height,
  onSelect,
  testID,
}: {
  heading: OutlineHeading;
  active: boolean;
  paint: RowPaint;
  height: number;
  onSelect?: (heading: OutlineHeading) => void;
  testID?: string;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const ringOffset = useRingOffsetStyle();
  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: height,
    paddingVertical: 6,
    paddingRight: 8,
    borderLeftWidth: RAIL,
    borderLeftColor: active ? paint.accent : paint.rail,
    paddingLeft: 10,
    '--bloom-outline-ring': paint.accent,
  };
  // On web a heading with an href is a real anchor (see `OutlineHeading.href`).
  const href = IS_WEB ? heading.href : undefined;
  return (
    <Pressable
      {...webDataSet({ bloomOutlineRow: '' })}
      {...(href != null ? ({ href } as Record<string, unknown>) : {})}
      role="link"
      accessibilityLabel={heading.label}
      // The reader is AT this heading; they did not choose it from a set.
      aria-current={active ? ('location' as const) : undefined}
      accessibilityState={{ selected: active }}
      onPress={
        onSelect
          ? (event: GestureResponderEvent) => {
              if (href != null) {
                // A modified click asks the browser for a tab or a window: leave
                // it the anchor. Only a plain press is the app's jump.
                const click = event.nativeEvent as unknown as {
                  metaKey?: boolean;
                  ctrlKey?: boolean;
                  shiftKey?: boolean;
                  button?: number;
                };
                if (click.metaKey || click.ctrlKey || click.shiftKey || (click.button ?? 0) !== 0) return;
                event.preventDefault();
              }
              onSelect(heading);
            }
          : undefined
      }
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={[rowStyle, ringOffset as WebCssStyle]}
      testID={testID}
    >
      <Text
        variant={active ? 'body-2-medium' : 'body-2-regular'}
        numberOfLines={1}
        style={{ color: active ? paint.accent : hovered ? paint.text : paint.quiet, flexShrink: 1 }}
      >
        {heading.label}
      </Text>
    </Pressable>
  );
}

/**
 * React Native's `Role` union has neither `list` nor `listitem` as DOM roles
 * react-native-web would emit unchanged, so each travels as the spelling its own
 * platform reads.
 */
const LIST_ROLE: Record<string, unknown> = IS_WEB ? { role: 'list' } : { accessibilityRole: 'list' };
const LIST_ITEM_ROLE: Record<string, unknown> = IS_WEB ? { role: 'listitem' } : {};

function OutlineList({
  nodes,
  depth,
  activeId,
  paint,
  height,
  onSelect,
  testID,
}: {
  nodes: ReadonlyArray<OutlineNode>;
  depth: number;
  activeId: string | undefined;
  paint: RowPaint;
  height: number;
  onSelect?: (heading: OutlineHeading) => void;
  testID?: string;
}) {
  return (
    <View {...LIST_ROLE} style={depth === 0 ? undefined : { marginLeft: INDENT }}>
      {nodes.map((node) => (
        <View key={node.heading.id} {...LIST_ITEM_ROLE}>
          <OutlineRow
            heading={node.heading}
            active={node.heading.id === activeId}
            paint={paint}
            height={height}
            onSelect={onSelect}
            testID={testID ? `${testID}-${node.heading.id}` : undefined}
          />
          {node.children.length > 0 ? (
            <OutlineList
              nodes={node.children}
              depth={depth + 1}
              activeId={activeId}
              paint={paint}
              height={height}
              onSelect={onSelect}
              testID={testID}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function OutlineNav({
  headings,
  activeId,
  onSelect,
  variant = 'full',
  progress,
  hideProgress = false,
  title,
  compactMaxLevel = 2,
  accessibilityLabel,
  labels: labelsProp,
  style,
  testID,
}: OutlineNavProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useInteractiveWebCss(STYLE_ID, OUTLINE_NAV_CSS);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const compact = variant === 'compact';

  const shown = useMemo(
    () => (compact ? compactHeadings(headings, compactMaxLevel) : headings),
    [compact, headings, compactMaxLevel],
  );
  const tree = useMemo(() => buildOutlineTree(shown), [shown]);

  const paint = useMemo<RowPaint>(() => {
    const text = surfaceTextOn(theme, surface);
    return {
      text: text.text,
      quiet: text.textSecondary,
      accent: theme.colors.primarySubtleForeground,
      rail: text.textGraphical,
    };
  }, [theme, surface]);

  const value = progress ?? outlineProgress(shown, activeId);
  const at = Math.max(0, shown.findIndex((heading) => heading.id === activeId)) + 1;
  const name = accessibilityLabel ?? labels.outline;

  return (
    <View
      role="navigation"
      accessibilityLabel={name}
      style={style}
      testID={testID}
    >
      {!compact && (title ?? labels.outline) !== undefined ? (
        <Text
          variant="caption-1-medium"
          style={{ color: paint.quiet, marginBottom: 8, paddingLeft: 12 }}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title ?? labels.outline}
        </Text>
      ) : null}
      {hideProgress ? null : (
        <Meter
          value={value}
          height={compact ? 3 : 4}
          accessibilityLabel={name}
          valueText={labels.progress(at, shown.length)}
          style={{ marginBottom: compact ? 8 : 10 }}
          testID={testID ? `${testID}-progress` : undefined}
        />
      )}
      <OutlineList
        nodes={tree}
        depth={0}
        activeId={activeId}
        paint={paint}
        height={compact ? 44 : 36}
        onSelect={onSelect}
        testID={testID ? `${testID}-row` : undefined}
      />
    </View>
  );
}
OutlineNav.displayName = 'OutlineNav';
