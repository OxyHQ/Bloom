import { RADIUS } from '../design-tokens/scales';
import type { AccentTone } from '../theme/accent-colors';
import { EARNINGS_MESSAGES } from './messages';
import type { EarningsLabels, EarningsPayoutState } from './types';

/**
 * Every default word the family draws, in English. The components speak
 * `EARNINGS_MESSAGES` in the resolved locale.
 */
export const EARNINGS_LABELS: Required<Omit<EarningsLabels, 'payoutState'>> & {
  payoutState: Record<EarningsPayoutState, string>;
} = {
  earned: EARNINGS_MESSAGES.en.earned,
  period: EARNINGS_MESSAGES.en.period,
  breakdown: EARNINGS_MESSAGES.en.breakdown,
  payout: EARNINGS_MESSAGES.en.payout,
  payoutState: EARNINGS_MESSAGES.en.payoutState,
  chart: EARNINGS_MESSAGES.en.chart,
  empty: EARNINGS_MESSAGES.en.empty,
};

/**
 * The tone each payout state is painted in.
 *
 * `scheduled` is `default` because waiting is not news. `processing` is `info`:
 * something is happening and there is nothing to do about it. `paid` is
 * `success`. `held` is `warning` and `failed` is `error` — the two that need
 * the reader to act, told apart by whether the money is still coming.
 */
export const EARNINGS_PAYOUT_TONE: Record<EarningsPayoutState, AccentTone> = {
  scheduled: 'default',
  processing: 'info',
  paid: 'success',
  held: 'warning',
  failed: 'error',
};

/**
 * The panel's geometry.
 *
 * `tile` is `ai-profile-card`'s stat tile exactly — radius 10, padding 10, the
 * reading over its label — because a courier's "18 jobs" and a profile's
 * "9B lifetime tokens" are the same object, and two tile geometries in one
 * library is two answers to one question.
 */
export const EARNINGS_GEOMETRY = {
  /** Between the chart, the tiles, the breakdown and the payout. */
  gap: 16,
  /** Between tiles, and between tile rows. */
  tileGap: 8,
  tilePadding: 10,
  tileRadius: 10,
  /** The payout row's leading glyph tile. */
  glyph: 40,
  glyphRadius: RADIUS['radius-12'],
  /** Under this the tiles stack two to a row. */
  narrowWidth: 640,
} as const;

export type EarningsGeometry = typeof EARNINGS_GEOMETRY;
