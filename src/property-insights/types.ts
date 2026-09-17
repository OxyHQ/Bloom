import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';

/** An icon COMPONENT (`RiBusLine`, not `<RiBusLine />`); the part sizes and colours it. */
export type InsightIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

// ---------------------------------------------------------------------------
//  EnergyLabel / EnergyBadge
// ---------------------------------------------------------------------------

/** The efficiency classes, best to worst. */
export type EnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EnergyMeasurement {
  rating: EnergyClass;
  /** Pre-formatted, unit included ("112 kWh/m²·year", "24 kg CO₂/m²·year"). */
  value?: string;
}

export interface EnergyLabelProps {
  /** The energy consumption rating. */
  consumption?: EnergyMeasurement;
  /** The emissions rating. */
  emissions?: EnergyMeasurement;
  /** Draws the scale muted with a "Certificate in progress" note instead of the marks. */
  pending?: boolean;
  /** Default `"Certificate in progress"`. */
  pendingLabel?: string;
  /** Default `"Consumption"`. */
  consumptionLabel?: string;
  /** Default `"Emissions"`. */
  emissionsLabel?: string;
  /** The scale's end captions. Default `"More efficient"` / `"Less efficient"`. */
  bestLabel?: string;
  worstLabel?: string;
  /** Overrides the composed name ("Energy rating. Consumption: C, 112 kWh/m²·year. …"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type EnergyBadgeSize = 'small' | 'medium';

export interface EnergyBadgeProps {
  /** Omit (or set `pending`) for a certificate still in progress. */
  rating?: EnergyClass;
  pending?: boolean;
  /** The text after the class. Default `"Energy"`; `""` draws the class alone. */
  label?: string;
  /** Drawn in place of the class while pending. Default `"Pending"`. */
  pendingLabel?: string;
  /** Default `medium`. */
  size?: EnergyBadgeSize;
  /** Default `"Energy rating C"` / `"Energy rating pending"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PriceHistoryChart
// ---------------------------------------------------------------------------

export interface PriceHistoryPoint {
  /** X axis label ("Mar 26"). */
  label: string;
  /** The price at this point, in the currency's units. */
  value: number;
  /** A longer name for the header while hovered ("March 2026"). Default `label`. */
  title?: string;
}

export type PriceEventKind = 'listed' | 'price-drop' | 'price-rise' | 'rented' | 'sold' | 'delisted';

export interface PriceHistoryEvent {
  /** Index into the period's `data` the marker sits on. */
  index: number;
  kind: PriceEventKind;
  /** "Listed", "Price drop −5%", "Sold". */
  label: string;
  /** Pre-formatted ("12 Mar 2026"). Default: the point's `title ?? label`. */
  date?: string;
}

export interface PriceHistoryPeriod {
  /** "1y", "3y", "all". */
  id: string;
  /** Segment label ("1Y"). */
  label: string;
  data: readonly PriceHistoryPoint[];
  events?: readonly PriceHistoryEvent[];
}

export type PriceHistoryShape = 'step' | 'line';

export interface PriceHistoryChartProps {
  /** The periods for the switcher (1Y / 3Y / All). */
  periods?: readonly PriceHistoryPeriod[];
  /** Points without periods. */
  data?: readonly PriceHistoryPoint[];
  events?: readonly PriceHistoryEvent[];
  defaultPeriod?: string;
  onPeriodChange?: (id: string) => void;
  /** Default `step` — an asking price holds until it changes. */
  shape?: PriceHistoryShape;
  /** Header label at rest. Default `"Current price"`. */
  title?: string;
  /** Headline at rest. Default: the last point's value. */
  currentPrice?: number;
  /** Price format for the headline, the callout and the summary. Default `€385,000`. */
  format?: (value: number) => string;
  /** Y tick format. Default `€385K`. */
  formatAxisValue?: (value: number) => string;
  /** The callout at the last point. Default `"Now"`. */
  currentLabel?: string;
  /** Drawn instead of the chart with fewer than two points. Default `"No price history yet"`. */
  emptyLabel?: string;
  /** Names the switcher. Default `"Price history period"`. */
  periodsLabel?: string;
  /** Overrides the composed chart summary. */
  accessibilityLabel?: string;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PriceEstimate
// ---------------------------------------------------------------------------

export type EstimateConfidence = 'low' | 'medium' | 'high';

/** Where the asking price falls: `within` the range, or `above` / `below` it by `ratio` of the nearest edge. */
export interface PriceVerdict {
  position: 'within' | 'above' | 'below';
  /** `0.08` → 8%. `0` when within. */
  ratio: number;
}

export interface PriceEstimateProps {
  /** The range's low and high ends, in currency units. */
  low: number;
  high: number;
  /** The point estimate; drawn as a tick inside the band. Optional. */
  estimate?: number;
  /** The asking price, marked on the bar. Without it there is no verdict. */
  asking?: number;
  confidence: EstimateConfidence;
  /** A line beside the confidence meter ("Few recent sales on this street"). */
  confidenceNote?: string;
  /** Price format. Default `€385,000`. */
  format?: (value: number) => string;
  /** Default `"Estimated price"`. */
  title?: string;
  /** Default `"Asking"`. */
  askingLabel?: string;
  /** Verdict wording. Default `"Fair price"`, `"Above estimate by 8%"`, `"Below estimate by 6%"`. */
  formatVerdict?: (verdict: PriceVerdict) => string;
  /** Above the range by more than this is `error`, up to it `warning`. Default `0.1`. */
  highAboveRatio?: number;
  /** Default `"Low confidence"`, `"Medium confidence"`, `"High confidence"`. */
  confidenceLabels?: Partial<Record<EstimateConfidence, string>>;
  /** Shown in place of the verdict at low confidence. Default `"Not enough data for a verdict"`. */
  lowConfidenceVerdictLabel?: string;
  /** The "Why this estimate" bullets. */
  reasons?: readonly string[];
  /** Default `"Why this estimate"`. */
  reasonsLabel?: string;
  /** Controlled expansion of the reasons. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Comparable homes the estimate used. */
  comparables?: number;
  /** Default `(n) => \`Based on ${n} comparable homes\``. */
  comparablesLabel?: (count: number) => string;
  /** Footer parts, joined with " · " ("Automated valuation", "v3.2", "Updated 2 Sep 2026"). */
  method?: string;
  version?: string;
  updated?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PricePerAreaComparison
// ---------------------------------------------------------------------------

export interface AreaPriceRow {
  /** "This home", "Rua das Flores", "Ribeira", "Porto". */
  label: string;
  /** Price per area, in currency units — the bars are proportional to it. */
  value: number;
  /** Pre-formatted ("€4,050/m²"). */
  display: string;
  /** Paints the bar in the accent; the other rows are neutral. */
  highlight?: boolean;
}

export interface PricePerAreaComparisonProps {
  rows: readonly AreaPriceRow[];
  /** Names the chart and prefixes its summary. Default `"Price per square metre"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  NeighbourhoodScores / NearbyPlaces
// ---------------------------------------------------------------------------

export interface NeighbourhoodScore {
  /** "Transport", "Schools", "Quiet". */
  label: string;
  /** 0..`max`. */
  value: number;
  /** Default `value` with one decimal when not whole. */
  display?: string;
  /** "Metro 4 min, 6 bus lines". */
  description?: string;
  icon?: InsightIcon;
}

export type NeighbourhoodScoresVariant = 'bars' | 'rings';

export interface NeighbourhoodScoresProps {
  items: readonly NeighbourhoodScore[];
  /** Default `10`. */
  max?: number;
  /** Default `bars`. */
  variant?: NeighbourhoodScoresVariant;
  /** `auto` (default): 1 column below 560, 2 from 560. */
  columns?: 1 | 2 | 'auto';
  /** A score's `aria-valuetext`. Default `"8.4 out of 10"`. */
  formatValueText?: (display: string, max: number) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NearbyPlace {
  icon: InsightIcon;
  name: string;
  /** "Metro station", "Primary school". */
  category?: string;
  /** Pre-formatted ("4 min"). */
  time: string;
  /** Default: walking. */
  modeIcon?: InsightIcon;
}

export interface NearbyPlacesProps {
  items: readonly NearbyPlace[];
  /** A row's name suffix. Default `(time) => \`${time} walk\``. */
  formatTime?: (time: string) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  RentHistoryList
// ---------------------------------------------------------------------------

export interface RentHistoryEntry {
  /** "Mar 2024 – Feb 2026", "Since Mar 2026". */
  period: string;
  /** "€1,250 / month", "€385,000". */
  amount: string;
  /** "Rented", "Sold", "Current listing". */
  note?: string;
  /** "+4%", "−2%". */
  delta?: string;
  /** Default: `warning` for a leading "+", `success` for "−"/"-", `default` otherwise. */
  deltaTone?: AccentTone;
}

export interface RentHistoryListProps {
  items: readonly RentHistoryEntry[];
  /** Drawn when `items` is empty. Default `"No history for this home yet"`. */
  emptyLabel?: string;
  /** Names the list. Default `"Rent history"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
