import React, { memo, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ActivityHeatmapDay, ActivityHeatmapProps } from './types';

const DAY_MS = 86_400_000;
const DEFAULT_NUM_DAYS = 364;
const DEFAULT_LEVELS = [1, 3, 6, 10];
const DEFAULT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
/** Opacity steps (low→high) used to derive the default color scale from primary. */
const DEFAULT_ALPHAS = [0.16, 0.32, 0.52, 0.75, 1];
const LABEL_FONT_SIZE = 10;
const MONTH_ROW_HEIGHT = 16;
const WEEKDAY_COL_WIDTH = 26;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

function parseDateKey(key: string): number | null {
  const match = DATE_KEY_RE.exec(key);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const ts = Date.UTC(year, month - 1, day);
    return Number.isNaN(ts) ? null : ts;
  }
  const parsed = Date.parse(key);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatUtcKey(ts: number): string {
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Count of ascending thresholds `count` meets — the color-scale index. */
function levelForCount(count: number, levels: number[]): number {
  if (count <= 0) return 0;
  let level = 0;
  for (const threshold of levels) {
    if (count >= threshold) level += 1;
    else break;
  }
  return level;
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  }
  const match = /rgba?\(([^)]+)\)/i.exec(trimmed);
  if (!match || match[1] === undefined) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3) return null;
  const [r, g, b] = parts;
  if (r === undefined || g === undefined || b === undefined) return null;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

/** Compose `color` at `alpha`; returns the input unchanged if it can't parse. */
function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

interface Cell {
  key: string;
  count: number;
  color: string;
}

/**
 * A GitHub-style contribution graph: columns of weeks × 7 weekday rows of
 * rounded square cells, each colored by its day's activity level. Pure `<View>`
 * composition (no SVG), rendering identically on web and native. The component
 * lays out at its natural width — wrap it in a horizontal `ScrollView` for
 * narrow viewports. All date math runs in UTC and the system clock is never
 * read; anchor the grid with `endDate`.
 */
const ActivityHeatmapComponent: React.FC<ActivityHeatmapProps> = ({
  data,
  numDays = DEFAULT_NUM_DAYS,
  endDate,
  levels = DEFAULT_LEVELS,
  colorScale,
  emptyColor,
  cellSize = 12,
  gap = 3,
  weekStartsOn = 0,
  monthLabels,
  weekdayLabels,
  onPressDay,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const empty = emptyColor ?? colors.backgroundSecondary;
  const scale = useMemo(
    () => colorScale ?? DEFAULT_ALPHAS.map((alpha) => withAlpha(colors.primary, alpha)),
    [colorScale, colors.primary],
  );
  const sortedLevels = useMemo(() => [...levels].sort((a, b) => a - b), [levels]);
  const months = monthLabels ?? DEFAULT_MONTHS;

  const grid = useMemo(() => {
    // Sum counts per UTC day.
    const countByKey = new Map<string, number>();
    let latest: number | null = null;
    for (const entry of data) {
      const ts = parseDateKey(entry.date);
      if (ts === null) continue;
      const key = formatUtcKey(ts);
      countByKey.set(key, (countByKey.get(key) ?? 0) + entry.count);
      if (latest === null || ts > latest) latest = ts;
    }

    const providedEnd = endDate ? parseDateKey(endDate) : null;
    const endTs = providedEnd ?? latest;
    if (endTs === null) return null;

    const days = Math.max(1, Math.floor(numDays));
    const rawStart = endTs - (days - 1) * DAY_MS;
    // Align the first column to the start-of-week boundary.
    const back = (new Date(rawStart).getUTCDay() - weekStartsOn + 7) % 7;
    const gridStart = rawStart - back * DAY_MS;
    const columnCount = Math.ceil((Math.floor((endTs - gridStart) / DAY_MS) + 1) / 7);

    const maxColor = scale.length - 1;
    const columns: Array<Array<Cell | null>> = [];
    for (let c = 0; c < columnCount; c++) {
      const column: Array<Cell | null> = [];
      for (let r = 0; r < 7; r++) {
        const ts = gridStart + (c * 7 + r) * DAY_MS;
        if (ts > endTs) {
          column.push(null);
          continue;
        }
        const key = formatUtcKey(ts);
        const count = countByKey.get(key) ?? 0;
        const level = Math.min(levelForCount(count, sortedLevels), maxColor);
        const color = count <= 0 ? empty : scale[level] ?? empty;
        column.push({ key, count, color });
      }
      columns.push(column);
    }

    // Month labels: first column whose leading day starts a new month.
    const monthMarks: Array<{ x: number; label: string }> = [];
    let lastMonth = -1;
    for (let c = 0; c < columnCount; c++) {
      const firstTs = gridStart + c * 7 * DAY_MS;
      const month = new Date(firstTs).getUTCMonth();
      if (month !== lastMonth) {
        monthMarks.push({ x: c * (cellSize + gap), label: months[month] ?? DEFAULT_MONTHS[month] ?? '' });
        lastMonth = month;
      }
    }

    return { columns, monthMarks };
  }, [data, endDate, numDays, weekStartsOn, sortedLevels, scale, empty, cellSize, gap, months]);

  if (!grid) {
    return <View style={style} testID={testID} />;
  }

  const { columns, monthMarks } = grid;
  const hasWeekdayCol = Array.isArray(weekdayLabels);
  const weekdayColWidth = hasWeekdayCol ? WEEKDAY_COL_WIDTH : 0;
  const monthRowMarginLeft = hasWeekdayCol ? weekdayColWidth + gap : 0;
  const cellRadius = Math.max(2, Math.round(cellSize * 0.25));

  return (
    <View style={style} testID={testID}>
      <View style={[styles.monthRow, { marginLeft: monthRowMarginLeft }]}>
        {monthMarks.map((mark, i) => (
          <Text
            key={`${mark.label}-${i}`}
            numberOfLines={1}
            style={[styles.label, { left: mark.x, color: colors.textTertiary }]}
          >
            {mark.label}
          </Text>
        ))}
      </View>

      <View style={styles.body}>
        {hasWeekdayCol && (
          <View style={{ width: weekdayColWidth, marginRight: gap }}>
            {Array.from({ length: 7 }, (_, r) => {
              const dow = (weekStartsOn + r) % 7;
              return (
                <View
                  key={r}
                  style={{
                    height: cellSize,
                    marginBottom: r < 6 ? gap : 0,
                    justifyContent: 'center',
                  }}
                >
                  <Text numberOfLines={1} style={[styles.weekdayLabel, { color: colors.textTertiary }]}>
                    {weekdayLabels[dow] ?? ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.grid}>
          {columns.map((column, c) => (
            <View key={c} style={{ marginRight: c < columns.length - 1 ? gap : 0 }}>
              {column.map((cell, r) => {
                const cellStyle = {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellRadius,
                  marginBottom: r < 6 ? gap : 0,
                };
                if (!cell) {
                  return <View key={r} style={cellStyle} />;
                }
                if (onPressDay) {
                  const day: ActivityHeatmapDay = { date: cell.key, count: cell.count };
                  return (
                    <Pressable
                      key={r}
                      onPress={() => onPressDay(day)}
                      accessibilityRole="button"
                      accessibilityLabel={`${cell.key}: ${cell.count}`}
                      style={[cellStyle, styles.cell, { backgroundColor: cell.color }]}
                    />
                  );
                }
                return (
                  <View key={r} style={[cellStyle, styles.cell, { backgroundColor: cell.color }]} />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monthRow: {
    height: MONTH_ROW_HEIGHT,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: 0,
    fontSize: LABEL_FONT_SIZE,
  },
  body: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
  },
  cell: {
    borderCurve: 'continuous',
  },
  weekdayLabel: {
    fontSize: LABEL_FONT_SIZE,
  },
});

export const ActivityHeatmap = memo(ActivityHeatmapComponent);
ActivityHeatmap.displayName = 'ActivityHeatmap';
