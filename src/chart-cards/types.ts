import type { StyleProp, ViewStyle } from 'react-native';
import type { ChartRange } from './primitives/use-chart-range';

/** One category of a year-over-year chart card — normally one month. */
export interface ChartCardPoint {
  /** Short label on the X axis (`"Jan"`). */
  label: string;
  /** This period's value. */
  current: number;
  /** The same period a year earlier. */
  previous: number;
}

/** Props both dashboard chart cards share. */
export interface YearOverYearChartCardProps {
  /** One point per category, left to right. The dashboard cards show twelve months. */
  data: readonly ChartCardPoint[];
  /** Headline label while nothing is hovered. */
  title?: string;
  /**
   * Headline label while a category is hovered. Defaults to the full English
   * month name for a three-letter month label (`"Jul"` → `"July"`), else the
   * label itself.
   */
  getPointTitle?: (point: ChartCardPoint, index: number) => string;
  /** Formats the headline and the comparison caption. */
  formatValue?: (value: number) => string;
  /** Formats the Y axis ticks. */
  formatAxisValue?: (value: number) => string;
  /** Legend label of `current`. Default `"This year"`. */
  currentLabel?: string;
  /** Legend label of `previous`. Default `"Last year"`. */
  previousLabel?: string;
  /** Caption suffix under the total. Default `"last year"`. */
  totalComparisonLabel?: string;
  /** Caption suffix under a hovered category. Default `"a year earlier"`. */
  pointComparisonLabel?: string;
  /** Override the series colour (`current`) and its hover step. */
  color?: string;
  activeColor?: string;
  /** Override the comparison series colour (`previous`). */
  previousColor?: string;
  /**
   * The hovered / pressed category. Controlled when set (`null` = none);
   * omit to let the card track the pointer itself.
   */
  activeIndex?: number | null;
  /** Called whenever the pointer moves to another category, or leaves (`null`). */
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the chart for assistive tech. Defaults to a summary of the headline. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type RevenueChartCardProps = YearOverYearChartCardProps;
export type OrdersChartCardProps = YearOverYearChartCardProps;

// ---------------------------------------------------------------------------
//  Area chart card
// ---------------------------------------------------------------------------

/** One category of an area chart: its X label plus one numeric field per series. */
export type AreaPoint = { label: string } & Record<string, number | string>;

export interface AreaSeries {
  /** Field of `AreaPoint` holding this series' values. */
  key: string;
  label: string;
  /** Any colour; defaults to the chart palette by series index (lime, blue, purple, …). */
  color?: string;
  /** Stroke / active-dot colour; defaults to the palette's hover step (or `color` darkened). */
  activeColor?: string;
}

/**
 * `stacked` — areas stacked into one silhouette; `overlap` — translucent areas
 * over each other, for comparison; `percent` — 100% stacked, every category
 * fills the height.
 */
export type AreaVariant = 'stacked' | 'overlap' | 'percent';
/** Monotone spline or straight segments between points. */
export type AreaShape = 'curved' | 'sharp';

/** A selectable period: the pill label plus the props it overrides. */
export type AreaRange = ChartRange<{
  data: AreaPoint[];
  series: AreaSeries[];
  delta: number;
  headline: number;
}>;

export interface AreaChartCardProps {
  variant?: AreaVariant;
  shape?: AreaShape;
  /** Header label at rest; swaps to the hovered category's label. Default `"Visitors"`. */
  title?: string;
  /** Rows left to right. Required unless every range carries its own `data`. */
  data?: readonly AreaPoint[];
  /** The series to draw, bottom of the stack first. Required unless every range carries its own. */
  series?: readonly AreaSeries[];
  /** Headline number at rest; defaults to the total across every series (the first series' in `overlap`). */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". No chip when omitted. */
  delta?: number;
  /** Static period pill ("Jan – Jun 2024"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods: the pill becomes a dropdown and the selected range's fields override the props above. */
  ranges?: readonly AreaRange[];
  /** Initially selected range id (defaults to the first). */
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Headline, legend and tile values. Default en-US grouping (`94,700`). */
  format?: (value: number) => string;
  /** Y tick labels. Default `4.5K`-style, or `25%` for `percent`. */
  formatAxisValue?: (value: number) => string;
  /** Stat tiles under the chart instead of the legend; the card grows to fit. */
  tiles?: boolean;
  /** The hovered category. Controlled when set (`null` = none); omit to track the pointer. */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the plot for assistive tech. Defaults to a summary: title, variant and series. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
