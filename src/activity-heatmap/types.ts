import type { StyleProp, ViewStyle } from 'react-native';

/** A single day cell in the {@link ActivityHeatmap}. */
export interface ActivityHeatmapDay {
  /** ISO `YYYY-MM-DD` date (parsed in UTC). */
  date: string;
  /** Activity count for that day. */
  count: number;
}

export interface ActivityHeatmapProps {
  /** Per-day activity counts. Days not present are treated as count 0. */
  data: ActivityHeatmapDay[];
  /**
   * Number of days to render, ending at `endDate`.
   * @default 364
   */
  numDays?: number;
  /**
   * Last (rightmost) day of the grid as `YYYY-MM-DD`. Defaults to the latest
   * date present in `data`. The component never reads the system clock, so pass
   * `endDate` explicitly to anchor the grid to "today".
   */
  endDate?: string;
  /**
   * Ascending count thresholds partitioning positive counts into color levels.
   * With N thresholds a positive count maps to `colorScale[number of thresholds
   * met]` (clamped to the scale). Count 0 always uses `emptyColor`.
   *
   * N thresholds therefore address indices `0..N`, so the scale wants `N + 1`
   * colors — and index 0 means "positive, but below the first threshold", which
   * only exists while the first threshold is 2 or more. A first threshold of 1
   * makes the faintest color unreachable: every positive count meets it.
   *
   * The defaults bucket 1–2 / 3–5 / 6–9 / 10+.
   * @default [3, 6, 10]
   */
  levels?: number[];
  /**
   * Colors low→high. Index 0 is the faintest activity shade, the last index the
   * strongest. Defaults to four opacity steps of `theme.colors.primary`.
   *
   * Pass `levels.length + 1` of them — see `levels`. A shorter scale clamps the
   * busiest days into its last color; a longer one leaves its darkest colors
   * unused.
   */
  colorScale?: string[];
  /**
   * Color for zero-activity days.
   * @default theme.colors.backgroundSecondary
   */
  emptyColor?: string;
  /**
   * Side length of each day cell in px.
   * @default 12
   */
  cellSize?: number;
  /**
   * Gap between cells in px (both axes).
   * @default 3
   */
  gap?: number;
  /**
   * First day of the week: 0 = Sunday, 1 = Monday. Controls both the row order
   * and how the leading partial week aligns.
   * @default 0
   */
  weekStartsOn?: 0 | 1;
  /**
   * 12 short month names indexed by month (0 = January), for the month-label
   * row. Pass localized names; defaults to English abbreviations.
   */
  monthLabels?: string[];
  /**
   * 7 short weekday names indexed by day of week (0 = Sunday). When provided, a
   * weekday-label column is rendered to the left of the grid. Omit for no
   * weekday column. Pass empty strings for rows you want left blank.
   */
  weekdayLabels?: string[];
  /** Called with the pressed day. When set, each populated cell is pressable. */
  onPressDay?: (day: ActivityHeatmapDay) => void;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
