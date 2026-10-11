import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { EstimateConfidence } from './types';

/**
 * Every fixed string the property-insights family draws or announces, in each
 * Bloom language. Prices and scores are formatted by the caller's `format`;
 * a component's own `*Label` props still win over any entry here.
 */
export interface PropertyInsightsMessages {
  /** `EnergyBadge`'s text after the class, and its pending text. */
  energy: string;
  pending: string;
  /** "Energy rating C" — `EnergyBadge`'s name. */
  energyRatingClass: (rating: string) => string;
  /** "Energy rating pending" — `EnergyBadge`'s name while pending. */
  energyRatingStatus: (status: string) => string;
  /** Heads `EnergyLabel`'s composed name. */
  energyRating: string;
  certificateInProgress: string;
  consumption: string;
  emissions: string;
  moreEfficient: string;
  lessEfficient: string;
  /** `NearbyPlaces`: "4 min walk". */
  walkTime: (time: string) => string;
  /** `NeighbourhoodScores`' `aria-valuetext`: "8.4 out of 10". */
  scoreOutOf: (display: string, max: number) => string;
  pricePerSquareMetre: string;
  rentHistory: string;
  rentHistoryEmpty: string;
  confidence: Record<EstimateConfidence, string>;
  aboveEstimate: (percent: string) => string;
  belowEstimate: (percent: string) => string;
  fairPrice: string;
  estimatedPrice: string;
  asking: string;
  noVerdict: string;
  whyThisEstimate: string;
  comparables: (count: number) => string;
  currentPrice: string;
  now: string;
  noPriceHistory: string;
  priceHistoryPeriod: string;
  priceHistory: string;
  /** The chart's summary: "Price history, 1Y: from €360,000 in Mar 2024 to €385,000 in Feb 2026." */
  priceHistoryTrend: (
    head: string,
    from: string,
    fromWhen: string,
    to: string,
    toWhen: string,
  ) => string;
}

export const PROPERTY_INSIGHTS_MESSAGES: MessageCatalog<PropertyInsightsMessages> =
  defineMessages<PropertyInsightsMessages>('PROPERTY_INSIGHTS_MESSAGES', {
    energy: 'Energy',
    pending: 'Pending',
    energyRatingClass: (r) => `Energy rating ${r}`,
    energyRatingStatus: (s) => `Energy rating ${String(s).toLowerCase()}`,
    energyRating: 'Energy rating',
    certificateInProgress: 'Certificate in progress',
    consumption: 'Consumption',
    emissions: 'Emissions',
    moreEfficient: 'More efficient',
    lessEfficient: 'Less efficient',
    walkTime: (t) => `${t} walk`,
    scoreOutOf: (d, m) => `${d} out of ${m}`,
    pricePerSquareMetre: 'Price per square metre',
    rentHistory: 'Rent history',
    rentHistoryEmpty: 'No history for this home yet',
    confidence: { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' },
    aboveEstimate: (p) => `Above estimate by ${p}`,
    belowEstimate: (p) => `Below estimate by ${p}`,
    fairPrice: 'Fair price',
    estimatedPrice: 'Estimated price',
    asking: 'Asking',
    noVerdict: 'Not enough data for a verdict',
    whyThisEstimate: 'Why this estimate',
    comparables: (n) =>
      plural('en', n, {
        one: 'Based on {n} comparable home',
        other: 'Based on {n} comparable homes',
      }),
    currentPrice: 'Current price',
    now: 'Now',
    noPriceHistory: 'No price history yet',
    priceHistoryPeriod: 'Price history period',
    priceHistory: 'Price history',
    priceHistoryTrend: (head, a, aw, b, bw) => `${head}: from ${a} in ${aw} to ${b} in ${bw}.`,
  });
