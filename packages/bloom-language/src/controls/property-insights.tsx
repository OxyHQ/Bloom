import {
  type AreaPriceRow,
  type EstimateConfidence,
  PriceEstimate as BloomPriceEstimate,
  type PriceEstimateProps,
  PricePerAreaComparison as BloomPricePerAreaComparison,
} from '@oxy.so/bloom/property-insights';

import type { Bound } from '../binding';
import { Node, type ViewModifiers } from '../node';
import { type ControlRenderer, defineControls } from './draw';
import { product } from './product';

/** A property's price insights: the estimate, and the price per area against its area's. */
export type PropertyInsightKind = 'priceEstimate' | 'pricePerAreaComparison';

/** Bloom `PriceEstimate`'s words, asking price, reasons and handlers. */
export type PriceEstimateOptions = Omit<
  PriceEstimateProps,
  'style' | 'testID' | 'low' | 'high' | 'confidence' | 'expanded' | 'onExpandedChange'
>;

/** Bloom `PriceEstimate`: the estimated range, and where the asking price sits in it. */
export interface PriceEstimateView extends ViewModifiers<PriceEstimateView> {
  expanded(value: Bound<PriceEstimateProps, 'expanded'>): PriceEstimateView;
}
/** Bloom `PricePerAreaComparison`: a bar per area; `.label()` names the chart. */
export type PricePerAreaComparisonView = ViewModifiers<PricePerAreaComparisonView>;

/** Bloom `PriceEstimate` from `low` to `high`, as sure as `confidence`. */
export function PriceEstimate(
  low: number,
  high: number,
  confidence: EstimateConfidence,
  options: PriceEstimateOptions = {},
): PriceEstimateView {
  return new Node('priceEstimate', { low, high, confidence, options }, []);
}
/** Bloom `PricePerAreaComparison` of `rows`. */
export function PricePerAreaComparison(rows: readonly AreaPriceRow[]): PricePerAreaComparisonView {
  return new Node('pricePerAreaComparison', { rows }, []);
}

const PROPERTY_INSIGHTS: Record<PropertyInsightKind, ControlRenderer> = {
  priceEstimate: product(BloomPriceEstimate, {
    bindings: { expanded: ['expanded', 'onExpandedChange'] },
  }),
  pricePerAreaComparison: product(BloomPricePerAreaComparison),
};
defineControls(PROPERTY_INSIGHTS);
