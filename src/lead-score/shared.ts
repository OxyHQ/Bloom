/**
 * The pure half of `LeadScoreCard`: which band a score falls in, how a signed
 * contribution reads, and how wide the widest factor bar is.
 *
 * Pure so the suite can walk the boundaries without rendering — a band that
 * flips one point early is invisible in a screenshot and obvious in a table.
 */
import { surfaceTextOn, hairlineOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { LEAD_SCORE_THRESHOLDS } from './constants';
import type { LeadScoreBand, LeadScoreFactor } from './types';

export interface LeadScorePaint {
  surface: string;
  hairline: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The rail every factor bar sits on, and the ring's own track. */
  track: string;
}

export function resolveLeadScorePaint(theme: Theme, surface: string): LeadScorePaint {
  const text = surfaceTextOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    track: hairlineOn(theme, surface),
  };
}

/**
 * The band a score falls in, by FRACTION of the scale. The boundaries are
 * inclusive upward: exactly 0.4 is warm and exactly 0.7 is hot, so a score
 * sitting on a threshold reads as having reached it.
 *
 * A non-positive `max` has no scale to divide, so the score is `cold` rather
 * than `NaN` — a card that renders is better than one that throws over data it
 * did not choose.
 */
export function resolveLeadScoreBand(score: number, max: number): LeadScoreBand {
  if (!(max > 0) || Number.isNaN(score)) return 'cold';
  const fraction = Math.min(Math.max(score / max, 0), 1);
  if (fraction >= LEAD_SCORE_THRESHOLDS.hot) return 'hot';
  if (fraction >= LEAD_SCORE_THRESHOLDS.warm) return 'warm';
  return 'cold';
}

/** A signed contribution as it is drawn and announced: `+12`, `-6`, `0`. */
export function formatContribution(contribution: number): string {
  return contribution > 0 ? `+${contribution}` : String(contribution);
}

/**
 * The scale every factor bar is measured against: the largest ABSOLUTE
 * contribution in the set, floored at 1.
 *
 * One scale for the whole set, not one per bar — bars normalised individually
 * would draw a +2 and a +30 at the same length, which is the one thing a row of
 * bars is read for.
 */
export function factorScale(factors: readonly LeadScoreFactor[]): number {
  return factors.reduce((widest, factor) => Math.max(widest, Math.abs(factor.contribution)), 1);
}
