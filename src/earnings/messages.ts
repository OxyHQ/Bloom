import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { EarningsPayoutState } from './types';

/**
 * Every fixed string the earnings family draws or announces, in each Bloom
 * language. Amounts arrive formatted. A caller's `labels`, `title` and
 * `accessibilityLabel` still win.
 */
export interface EarningsMessages {
  /** Over the figure. */
  earned: string;
  /** Names the period switch. */
  period: string;
  /** Over the breakdown. */
  breakdown: string;
  /** Over the payout row. */
  payout: string;
  payoutState: Record<EarningsPayoutState, string>;
  /** Names the chart: "This week earnings, by period". */
  chart: (label: string) => string;
  /** The empty period's line. */
  empty: string;
  /** Names the summary panel. */
  earnings: string;
}

export const EARNINGS_MESSAGES: MessageCatalog<EarningsMessages> = defineMessages<EarningsMessages>(
  'EARNINGS_MESSAGES',
  {
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
    chart: (label) => `${label} earnings, by period`,
    empty: 'Nothing earned yet',
    earnings: 'Earnings',
  },
);
