import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { mixColor } from '../button/shared';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { resolveTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader } from './primitives/ChartHeader';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';

export interface HeatmapRow {
  label: string;
  /** One value per column, left to right. */
  values: readonly number[];
}

/** A selectable period: pill label + the props it overrides. */
export type HeatmapRange = ChartRange<{
  rows: readonly HeatmapRow[];
  columns: readonly string[];
  max: number;
  delta: number;
  headline: number;
}>;

/** The hovered cell. */
export interface HeatmapCell {
  row: number;
  col: number;
}

export interface HeatmapChartCardProps {
  /** Header label; swaps to "Row · Column" while a cell is hovered. Default `"Active users"`. */
  title?: string;
  rows?: readonly HeatmapRow[];
  /** Names the value slots, left to right. */
  columns?: readonly string[];
  /** Accent for the ramp; any colour, defaults to `chart-6` (blue) on the theme. */
  color?: string;
  activeColor?: string;
  /** Value that maps to the fully saturated cell; defaults to the largest value. */
  max?: number;
  /** Headline at rest; defaults to the sum of all cells. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill ("Last 7 days"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown and the range's fields override the props. */
  ranges?: readonly HeatmapRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  format?: (value: number) => string;
  /** Show every n-th column label (default fits ~12 labels). */
  columnLabelEvery?: number;
  /** The ramp legend's end captions. Default `['Less', 'More']`. */
  legendLabels?: readonly [string, string];
  /** The hovered cell. Controlled when set (`null` = none). */
  activeCell?: HeatmapCell | null;
  onActiveCellChange?: (cell: HeatmapCell | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Ramp stops for the legend swatches (share of `max`). */
const LEGEND_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;
/** `gap-1`. */
const GAP = 4;
/** The column-label row: `pt-0.5` + a 16px caption line. */
const COLUMN_LABEL_HEIGHT = 18;

const LEGEND_LABELS = ['Less', 'More'] as const;
const NO_ROWS: readonly HeatmapRow[] = [];
const NO_COLUMNS: readonly string[] = [];

const sameCell = (a: HeatmapCell | null, b: HeatmapCell | null) =>
  a === b || (!!a && !!b && a.row === b.row && a.col === b.col);

/**
 * The accent mixed into `chart-track` by share of `max` — a
 * `color-mix(in srgb, accent N%, var(--color-chart-track))` with an 8% floor so
 * empty cells still read as cells, 100% at max.
 */
export function heatmapCellColor(value: number, max: number, accent: string, track: string): string {
  const share = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const pct = Math.round(8 + share * 92);
  return mixColor(track, accent, pct / 100);
}

/**
 * `HeatmapChartCard`: a rows × columns matrix of tinted cells (weekday × hour,
 * region × month…).
 *
 *   grid      row labels in an auto-width column (caption-1-medium,
 *             text-tertiary, 8px before the cells), equal `1fr` cells 4px apart,
 *             radius 4, filling the card's height; column labels underneath
 *             (`pt-0.5`, centred, every n-th shown so ~12 fit)
 *   colour    accent mixed into chart-track by share of `max`, 8% → 100%
 *   hover     the cell takes a 2px chart-cursor ring and its `-active` colour,
 *             its row and column labels darken to text-primary (150ms), and
 *             the header swaps to "Row · Column" and the cell's value
 *   footer    "Less ▢▢▢▢▢ More" ramp legend, right-aligned, 12px swatches
 *             radius 3, 6px apart
 *
 * Hover on web (leaving the grid clears); press and scrub on native.
 */
export function HeatmapChartCard({
  title = 'Active users',
  rows: rowsProp,
  columns: columnsProp,
  color,
  activeColor,
  max: maxProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  columnLabelEvery,
  legendLabels = LEGEND_LABELS,
  activeCell: controlled,
  onActiveCellChange,
  style,
  testID,
}: HeatmapChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const rows = selected?.rows ?? rowsProp ?? NO_ROWS;
  const columns = selected?.columns ?? columnsProp ?? NO_COLUMNS;
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  // Palette index 1 = chart-6 blue.
  const tone = resolveTone(palettes, 1, color, activeColor);
  const { max, total } = useMemo(() => {
    const all = rows.flatMap((r) => r.values);
    return {
      max: selected?.max ?? maxProp ?? Math.max(1, ...all),
      total: all.reduce((s, v) => s + v, 0),
    };
  }, [rows, selected?.max, maxProp]);
  const cols = columns.length;
  const labelEvery = columnLabelEvery ?? Math.max(1, Math.ceil(cols / 12));

  const [own, setOwn] = useState<HeatmapCell | null>(null);
  const rawActive = controlled !== undefined ? controlled : own;
  const active = rawActive && rawActive.row < rows.length && rawActive.col < cols ? rawActive : null;
  const activeRef = useRef(active);
  activeRef.current = active;
  const setActive = useCallback(
    (cell: HeatmapCell | null) => {
      if (sameCell(cell, activeRef.current)) return;
      activeRef.current = cell;
      if (controlled === undefined) setOwn(cell);
      onActiveCellChange?.(cell);
    },
    [controlled, onActiveCellChange],
  );

  const hovering = active !== null;
  const hoveredValue = active ? (rows[active.row]?.values[active.col] ?? 0) : 0;
  const headerLabel = active ? `${rows[active.row]?.label} · ${columns[active.col]}` : title;
  const headlineValue = active ? hoveredValue : (headline ?? total);

  const labelEase = useWebTransition('color', 150);
  const cellEase = useWebTransition('background-color, box-shadow', 150);

  // Native: hit-test the cell grid from its measured size.
  const gridSize = useRef<{ width: number; height: number } | null>(null);
  const onGridLayout = useCallback((e: LayoutChangeEvent) => {
    gridSize.current = e.nativeEvent.layout;
  }, []);
  const track = (x: number, y: number) => {
    const size = gridSize.current;
    if (!size || cols === 0 || rows.length === 0) return;
    const col = Math.floor((x / (size.width + GAP)) * cols);
    const row = Math.floor((y / (size.height - COLUMN_LABEL_HEIGHT)) * rows.length);
    if (col < 0 || col >= cols || row < 0 || row >= rows.length) return;
    setActive({ row, col });
  };
  const nativeHandlers: ViewProps =
    Platform.OS === 'web'
      ? {}
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => setActive(null),
          onResponderTerminate: () => setActive(null),
        };

  const labelColor = (on: boolean) => ({ color: on ? palette.text : palette.textTertiary });

  return (
    <ChartCardSurface style={style} testID={testID}>
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${active ? `${active.row}:${active.col}` : 'idle'}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={(id) => {
          setActive(null);
          select(id);
        }}
        testID={testID}
      />

      <View style={styles.grid} onPointerLeave={() => setActive(null)} testID={testID ? `${testID}-grid` : undefined}>
        {/* Row labels: an auto-width column, as `grid-template-columns: auto …`. */}
        <View style={styles.labelColumn}>
          {rows.map((row, r) => (
            <View key={`label-${r}-${row.label}`} style={styles.rowLabel}>
              <Text
                variant="caption-1-medium"
                numberOfLines={1}
                style={[labelColor(active?.row === r), labelEase]}>
                {row.label}
              </Text>
            </View>
          ))}
          <View style={{ height: COLUMN_LABEL_HEIGHT }} />
        </View>

        <View style={styles.cells} onLayout={onGridLayout} {...nativeHandlers}>
          {rows.map((row, r) => (
            <View key={`row-${r}-${row.label}`} style={styles.row}>
              {columns.map((column, c) => {
                const v = row.values[c] ?? 0;
                const isActive = active?.row === r && active?.col === c;
                const cellStyle: WebCssStyle = {
                  flex: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  borderRadius: 4,
                  backgroundColor: heatmapCellColor(v, max, isActive ? tone.activeColor : tone.color, palette.track),
                  boxShadow: isActive ? `0 0 0 2px ${palette.cursor}` : undefined,
                  ...cellEase,
                };
                return (
                  <View
                    key={`cell-${c}-${column}`}
                    role="img"
                    accessibilityLabel={`${row.label} ${column}: ${format(v)}`}
                    testID={testID ? `${testID}-cell-${r}-${c}` : undefined}
                    onPointerEnter={() => setActive({ row: r, col: c })}
                    style={cellStyle}
                  />
                );
              })}
            </View>
          ))}
          <View style={styles.columnLabels}>
            {columns.map((column, c) => (
              <View key={`col-${c}-${column}`} style={[styles.columnLabel, { opacity: c % labelEvery === 0 ? 1 : 0 }]}>
                <Text
                  variant="caption-1-medium"
                  numberOfLines={1}
                  style={[{ textAlign: 'center' }, labelColor(active?.col === c), labelEase]}>
                  {column}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.legend} testID={testID ? `${testID}-legend` : undefined}>
        <Text variant="caption-1-medium" style={{ color: palette.textTertiary }}>
          {legendLabels[0]}
        </Text>
        {LEGEND_STOPS.map((stop) => (
          <View
            key={stop}
            style={[styles.swatch, { backgroundColor: heatmapCellColor(stop * max, max, tone.color, palette.track) }]}
          />
        ))}
        <Text variant="caption-1-medium" style={{ color: palette.textTertiary }}>
          {legendLabels[1]}
        </Text>
      </View>
    </ChartCardSurface>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', flex: 1, minHeight: 0, flexDirection: 'row', gap: GAP },
  labelColumn: { flexDirection: 'column', gap: GAP },
  rowLabel: { flex: 1, flexBasis: 0, minHeight: 0, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  cells: { flex: 1, minWidth: 0, flexDirection: 'column', gap: GAP },
  row: { flex: 1, flexBasis: 0, minHeight: 0, flexDirection: 'row', gap: GAP },
  columnLabels: { height: COLUMN_LABEL_HEIGHT, flexDirection: 'row', gap: GAP },
  columnLabel: { flex: 1, flexBasis: 0, minWidth: 0, paddingTop: 2 },
  legend: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingBottom: 4 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
