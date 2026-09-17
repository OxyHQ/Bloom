import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ACCENT_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { BREAKPOINTS } from '../styles/breakpoints';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { Text } from '../typography';
import {
  CONTRIBUTION_COLUMNS,
  CONTRIBUTION_ROWS,
  contributionLabel,
  contributionTier,
  hashContributionCell,
  type ContributionCell,
} from './contributions-cells';
import { ChartHeadline } from './primitives/ChartHeader';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';

// ---------------------------------------------------------------------------
//  Grid
// ---------------------------------------------------------------------------

export interface ContributionsGridProps {
  /** Column-major: `columns × 7` cells, each column top to bottom. Missing cells draw empty. */
  cells: readonly ContributionCell[];
  /** Default 37 (the dashboard card); an AI profile card can use 38. */
  columns?: number;
  /** Ramp base; any colour. Defaults to the theme's accent (`primary`). */
  color?: string;
  /** Pop the coloured cells in on mount, in a scattered order. */
  animateIn?: boolean;
  /**
   * Fixed 13px cells (the grid then takes its own width — put it in a
   * horizontal scroller) instead of equal columns filling the width.
   */
  compact?: boolean;
  /** The hovered cell index. Controlled when set (`null` = none). */
  activeCell?: number | null;
  onActiveCellChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `gap-1`. */
const GAP = 4;
/** `grid-cols-[repeat(37,13px)]` below `sm`. */
const COMPACT_CELL = 13;
/** `rounded-[3px]`. */
const CELL_RADIUS = 3;
/** `animate-cell-pop`: 380ms ease-out, delays scattered over 0–800ms. */
const POP_MS = 380;
const POP_STAGGER_MS = 800;
const POP_EASE = Easing.bezier(0, 0, 0.58, 1);

/**
 * The tier colours: `chart-neutral` for no activity, then the accent ramp —
 * light 200 → 700, dark from the deep end 950 → 500, so more activity always
 * reads as more contrast against the card.
 */
export function useContributionTiers(color?: string): readonly [string, string, string, string, string, string] {
  const theme = useTheme();
  const palette = useChartCardPalette();
  return useMemo(() => {
    const r = color ? colorRamp(color, ACCENT_TABLE) : resolveButtonRamps(theme).accent;
    return theme.isDark
      ? [palette.neutralSeries, r[950], r[800], r[700], r[600], r[500]]
      : [palette.neutralSeries, r[200], r[400], r[500], r[600], r[700]];
  }, [color, theme, palette.neutralSeries]);
}

/**
 * `ContributionsGrid`: `columns × 7` rounded squares coloured by activity
 * tier, 4px apart, each with a "12 contributions on Apr 26" tooltip (opens at
 * once, closes at once, above the cell). Hover on web; on native a press
 * shows the day and dragging moves it.
 */
export function ContributionsGrid({
  cells,
  columns = CONTRIBUTION_COLUMNS,
  color,
  animateIn = false,
  compact = false,
  activeCell: controlled,
  onActiveCellChange,
  style,
  testID,
}: ContributionsGridProps) {
  const tiers = useContributionTiers(color);
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  const [own, setOwn] = useState<number | null>(null);
  const active = controlled !== undefined ? controlled : own;
  const activeRef = useRef(active);
  activeRef.current = active;
  const setActive = useCallback(
    (index: number | null) => {
      if (index === activeRef.current) return;
      activeRef.current = index;
      if (controlled === undefined) setOwn(index);
      onActiveCellChange?.(index);
    },
    [controlled, onActiveCellChange],
  );
  // The tooltip stays on the last cell while it animates out.
  const [anchorIndex, setAnchorIndex] = useState<number | null>(active);
  if (active !== null && active !== anchorIndex) setAnchorIndex(active);

  // Leaving one cell and entering the next arrive as two events: defer the
  // clear a frame so the tooltip moves instead of closing and reopening.
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = (index: number) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = null;
    setActive(index);
  };
  const leave = () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setActive(null), 16);
  };
  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
  }, []);

  const clock = useRef(new Animated.Value(animateIn && !reducedMotion ? 0 : POP_STAGGER_MS + POP_MS)).current;
  useEffect(() => {
    if (!animateIn || reducedMotion) {
      clock.setValue(POP_STAGGER_MS + POP_MS);
      return;
    }
    clock.setValue(0);
    const animation = Animated.timing(clock, {
      toValue: POP_STAGGER_MS + POP_MS,
      duration: POP_STAGGER_MS + POP_MS,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [animateIn, reducedMotion, clock]);

  const cellSize = compact ? COMPACT_CELL : width > 0 ? (width - GAP * (columns - 1)) / columns : 0;
  const pitch = cellSize + GAP;

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const nativeHandlers: ViewProps =
    Platform.OS === 'web'
      ? {}
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderGrant: (e: GestureResponderEvent) => scrub(e),
          onResponderMove: (e: GestureResponderEvent) => scrub(e),
        };
  function scrub(e: GestureResponderEvent) {
    if (pitch <= 0) return;
    const col = Math.floor(e.nativeEvent.locationX / pitch);
    const row = Math.floor(e.nativeEvent.locationY / pitch);
    if (col < 0 || col >= columns || row < 0 || row >= CONTRIBUTION_ROWS) return;
    setActive(col * CONTRIBUTION_ROWS + row);
  }

  const anchorCell = anchorIndex !== null ? (cells[anchorIndex] ?? { count: 0 }) : null;

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[{ flexDirection: 'column', gap: GAP, width: compact ? columns * pitch - GAP : '100%' }, style]}
      {...nativeHandlers}>
      {Array.from({ length: CONTRIBUTION_ROWS }, (_, row) => (
        <View key={`row-${row}`} style={styles.gridRow}>
          {Array.from({ length: columns }, (_, col) => {
            const index = col * CONTRIBUTION_ROWS + row;
            const cell = cells[index] ?? { count: 0 };
            const tier = contributionTier(cell);
            const box: WebCssStyle = compact
              ? { width: COMPACT_CELL, height: COMPACT_CELL, flexShrink: 0 }
              : { flex: 1, flexBasis: 0, minWidth: 0, aspectRatio: 1 };
            const common = {
              role: 'img' as const,
              accessibilityLabel: contributionLabel(cell),
              testID: testID ? `${testID}-cell-${index}` : undefined,
              onPointerEnter: () => enter(index),
              onPointerLeave: leave,
            };
            const paint = { borderRadius: CELL_RADIUS, backgroundColor: tiers[tier] };
            if (animateIn && tier > 0) {
              const delay = (hashContributionCell(row, col) >>> 7) % POP_STAGGER_MS;
              const progress = clock.interpolate({
                inputRange: [0, delay, delay + POP_MS, POP_STAGGER_MS + POP_MS],
                outputRange: [0, 0, 1, 1],
                easing: POP_EASE,
                extrapolate: 'clamp',
              });
              const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
              return (
                <Animated.View
                  key={`cell-${col}`}
                  {...common}
                  style={[box, paint, { opacity: progress, transform: [{ scale }] }]}
                />
              );
            }
            return <View key={`cell-${col}`} {...common} style={[box, paint]} />;
          })}
        </View>
      ))}

      {anchorCell && anchorIndex !== null && cellSize > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Math.floor(anchorIndex / CONTRIBUTION_ROWS) * pitch,
            top: (anchorIndex % CONTRIBUTION_ROWS) * pitch,
            width: cellSize,
            height: cellSize,
          }}>
          <Tooltip position="top" visible={active !== null} onVisibleChange={(open) => !open && setActive(null)}>
            <TooltipTrigger>
              <View style={{ width: cellSize, height: cellSize }} />
            </TooltipTrigger>
            <TooltipTextBubble>{contributionLabel(anchorCell)}</TooltipTextBubble>
          </Tooltip>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

export interface ContributionsStat {
  /** Already formatted: `"9B"`, `"12h 54m"`. */
  value: string;
  label: string;
}

/** A selectable activity period — the segmented control — and the props it overrides. */
export type ContributionsPeriod = ChartRange<{
  cells: readonly ContributionCell[];
  total: number;
  delta: number;
  stats: readonly ContributionsStat[];
}>;

export interface ContributionsCardProps {
  /** Default `"Contributions this year"`. */
  title?: string;
  /** Headline number; defaults to the sum of every cell's count. */
  total?: number;
  /** Delta ratio for the chip, e.g. `0.148` → "+14.8%". */
  delta?: number;
  format?: (value: number) => string;
  /** The stat cards under the header (a dashboard card shows four). */
  stats?: readonly ContributionsStat[];
  /** Column-major `columns × 7` cells — see `contributionCellsFromDays`. */
  cells?: readonly ContributionCell[];
  columns?: number;
  /** Ramp base; any colour. Defaults to the theme's accent. */
  color?: string;
  /** The segmented control's options. Default Weekly / Monthly / Yearly; a period's fields override the props. */
  periods?: readonly ContributionsPeriod[];
  defaultPeriod?: string;
  onPeriodChange?: (id: string) => void;
  /** Default `"Activity"`. */
  activityLabel?: string;
  /** Labels spread under the grid. Default Jan … Dec. */
  months?: readonly string[];
  animateIn?: boolean;
  /** The hovered cell index. Controlled when set (`null` = none). */
  activeCell?: number | null;
  onActiveCellChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_PERIODS: readonly ContributionsPeriod[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const NO_CELLS: readonly ContributionCell[] = [];
/** Index rows of two — a `grid-cols-2` layout below `sm`. */
function pairsOf(count: number): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += 2) rows.push(i + 1 < count ? [i, i + 1] : [i]);
  return rows;
}

/** `sm:h-[337px]`. */
export const CONTRIBUTIONS_CARD_HEIGHT = 337;

/**
 * The contributions card:
 *
 *   card      radius 16, padding 16, `background-secondary`, 16px gaps; 337
 *             tall from `sm` (content past it clips), auto below
 *   header    label body-medium text-secondary; number title-1-medium with
 *             the delta chip 8px after it
 *   stats     cards bleeding 8px past the padding, 8px apart, one row from
 *             `sm` (2 × 2 below): radius 10, padding 10, `background-inner`,
 *             `shadow-card`; value body-medium text-primary over label
 *             body-medium text-secondary, both truncating
 *   activity  8px closer (`-mt-2`): "Activity" + a plain segmented control,
 *             then the grid and the month row 6px under it (body-2-medium,
 *             text-tertiary, spread edge to edge). From `sm` the cells are
 *             equal columns kept square; below it they are 13px and the
 *             block scrolls sideways
 */
export function ContributionsCard({
  title = 'Contributions this year',
  total: totalProp,
  delta: deltaProp,
  format = formatNumber,
  stats: statsProp,
  cells: cellsProp,
  columns = CONTRIBUTION_COLUMNS,
  color,
  periods = DEFAULT_PERIODS,
  defaultPeriod,
  onPeriodChange,
  activityLabel = 'Activity',
  months = MONTHS,
  animateIn = false,
  activeCell,
  onActiveCellChange,
  style,
  testID,
}: ContributionsCardProps) {
  const palette = useChartCardPalette();
  const theme = useTheme();
  const { width: viewport } = useWindowDimensions();
  const wide = viewport >= BREAKPOINTS.sm;
  const { selected, selectedId, select } = useChartRange(periods, defaultPeriod, onPeriodChange);

  const cells = selected?.cells ?? cellsProp ?? NO_CELLS;
  const stats = selected?.stats ?? statsProp;
  const delta = selected?.delta ?? deltaProp;
  const total = selected?.total ?? totalProp ?? cells.reduce((s, c) => s + c.count, 0);
  const cardShadow = theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14)' : '0 1px 1px 0 rgb(0 0 0 / 0.05)';

  const grid = (
    <View style={[styles.gridBlock, !wide && { width: undefined }]}>
      <ContributionsGrid
        cells={cells}
        columns={columns}
        color={color}
        animateIn={animateIn}
        compact={!wide}
        activeCell={activeCell}
        onActiveCellChange={onActiveCellChange}
        testID={testID ? `${testID}-grid` : undefined}
      />
      <View style={styles.months}>
        {months.map((month, i) => (
          <Text key={`${i}-${month}`} variant="body-2-medium" style={{ color: palette.textTertiary }}>
            {month}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: palette.surface, height: wide ? CONTRIBUTIONS_CARD_HEIGHT : undefined },
        style,
      ]}>
      <ChartHeadline
        label={title}
        value={total}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        fadeKey={selectedId}
        testID={testID}
        style={{ width: '100%' }}
      />

      {stats && stats.length > 0 ? (
        <View style={styles.stats} testID={testID ? `${testID}-stats` : undefined}>
          {(wide ? [stats.map((_, i) => i)] : pairsOf(stats.length)).map((row) => (
            <View key={row[0]} style={styles.statsRow}>
              {row.map((i) => {
                const stat = stats[i]!;
                return (
                  <View
                    key={`${i}-${stat.label}`}
                    testID={testID ? `${testID}-stat-${i}` : undefined}
                    style={[styles.stat, { backgroundColor: palette.inner, boxShadow: cardShadow } as WebCssStyle]}>
                    <Text variant="body-medium" numberOfLines={1} style={{ width: '100%', color: palette.text }}>
                      {stat.value}
                    </Text>
                    <Text variant="body-medium" numberOfLines={1} style={{ width: '100%', color: palette.textSecondary }}>
                      {stat.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.activity}>
        <View style={styles.activityHeader}>
          <Text variant="body-medium" style={{ color: palette.textSecondary }}>
            {activityLabel}
          </Text>
          {periods.length > 0 && selectedId ? (
            <SegmentedControl
              label={`${activityLabel} period`}
              type="radio"
              variant="plain"
              value={selectedId}
              onChange={select}>
              {periods.map((p) => (
                <SegmentedControlItem key={p.id} value={p.id} testID={testID ? `${testID}-period-${p.id}` : undefined}>
                  <SegmentedControlItemText>{p.label}</SegmentedControlItemText>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          ) : null}
        </View>

        {wide ? (
          grid
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller}>
            {grid}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    flexDirection: 'column',
    gap: 16,
    overflow: 'hidden',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  stats: { marginLeft: -8, marginRight: -8, flexDirection: 'column', gap: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  stat: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  activity: { marginTop: -8, flex: 1, minHeight: 0, width: '100%', flexDirection: 'column', gap: 4 },
  activityHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridBlock: { width: '100%', flexDirection: 'column', gap: 6 },
  gridRow: { flexDirection: 'row', gap: GAP },
  months: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  scroller: { flexGrow: 0 },
});
