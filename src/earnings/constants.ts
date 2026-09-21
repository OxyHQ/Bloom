import { RADIUS } from '../design-tokens/scales';
import type { AccentTone } from '../theme/accent-colors';
import type { EarningsLabels, EarningsPayoutState } from './types';

/** Every default word the family draws. */
export const EARNINGS_LABELS: Required<Omit<EarningsLabels, 'payoutState'>> & {
  payoutState: Record<EarningsPayoutState, string>;
} = {
  earned: 'Earned',
  period: 'Earnings period',
  breakdown: 'What it came from',
  payout: 'Next payout',
  payoutState: {
    scheduled: 'Scheduled',
    processing: 'On its way',
    paid: 'Paid',
    held: 'On hold',
    failed: 'Failed',
  },
  chart: (label: string) => `${label} earnings, by period`,
  empty: 'Nothing earned yet',
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
