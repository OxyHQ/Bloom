import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { PriceLine, PriceTotal } from '../price-breakdown';

/**
 * Where a payout has got to.
 *
 * Five states, because "not in the account yet" is four different situations
 * and a courier acts differently on each: `scheduled` waits, `processing` is
 * already moving, `paid` is done, `held` needs the courier to do something,
 * `failed` needs them to fix something. One "pending" would collapse the two
 * that require action into the two that do not.
 */
export type EarningsPayoutState = 'scheduled' | 'processing' | 'paid' | 'held' | 'failed';

/**
 * One bar in the chart of the last weeks.
 *
 * It carries BOTH a number and an amount, and they are not the same fact.
 * `value` is geometry — how tall the bar is, in whatever unit the app compares
 * in — and is never drawn. `amount` is the money, PRE-FORMATTED, and is the
 * only thing a reader ever sees. Nothing here parses one into the other.
 */
export interface EarningsBar {
  /** The bar's foot — "W12", "Mon". */
  label: string;
  /** The bar's HEIGHT. Never drawn. */
  value: number;
  /** What that bar paid, PRE-FORMATTED: `"€312.80"`. */
  amount: string;
}

/** One tile under the figure: a reading over what it is. */
export interface EarningsStat {
  /** The reading, PRE-FORMATTED — `"18"`, `"5 h 40"`, `"€2.14/km"`. */
  value: string;
  /** What it is — "Jobs done", "Online", "Per kilometre". */
  label: string;
}

/** The money that is on its way out, and what is holding it up. */
export interface EarningsPayout {
  /** How much, PRE-FORMATTED. */
  amount: string;
  /** When — "Friday 26 September". The app's words: this family formats no date. */
  date?: string;
  /** Default `scheduled`. */
  state?: EarningsPayoutState;
  /** Where it lands — "Account ending 4417". */
  destination?: string;
  /** What the reader has to do about it, for `held` and `failed`. */
  note?: string;
}

/**
 * One period the switch offers, with everything that period says.
 *
 * Every field is the period's own, so switching the segment replaces the whole
 * panel rather than just the chart. A field left out falls back to the
 * panel-level prop of the same name, which is how a payout that does not change
 * with the period is written once.
 */
export interface EarningsPeriod {
  /** Identifies the period to `onPeriodChange`. */
  id: string;
  /** The segment's words — "Day", "Week", "Month". */
  label: string;
  /** What the period paid, PRE-FORMATTED. This is the figure. */
  total: string;
  /**
   * The change on the period before, as a RATIO (`0.148` is up 14.8%). A ratio
   * is not money, so it is a number here and the chip's words are derived from
   * it; no chip without one.
   */
  deltaRatio?: number;
  /** A line under the figure — "Before the platform fee". */
  caption?: string;
  /** The bars. */
  bars?: readonly EarningsBar[];
  /** The breakdown by kind, handed to `PriceSummary` unchanged. */
  lines?: readonly PriceLine[];
  /** The tiles under the chart. */
  stats?: readonly EarningsStat[];
  /** The next payout, when it is this period's. */
  payout?: EarningsPayout;
}

/** Every word the family speaks, in one prop. */
export interface EarningsLabels {
  /** Over the figure. Default `"Earned"`. */
  earned?: string;
  /** Names the period switch. Default `"Earnings period"`. */
  period?: string;
  /** Over the breakdown. Default `"What it came from"`. */
  breakdown?: string;
  /** Over the payout row. Default `"Next payout"`. */
  payout?: string;
  /** The payout states. Defaults `"Scheduled"`, `"On its way"`, `"Paid"`, `"On hold"`, `"Failed"`. */
  payoutState?: Partial<Record<EarningsPayoutState, string>>;
  /** Names the chart. Default `` (label) => `${label} earnings, by period` ``. */
  chart?: (label: string) => string;
  /** The empty period's line. Default `"Nothing earned yet"`. */
  empty?: string;
}

export interface EarningsBreakdownProps {
  /** The kinds, in the order they should be read. */
  lines: readonly PriceLine[];
  /**
   * The answer. Left out — which is what `EarningsSummary` does — the breakdown
   * draws the kinds and no rule, because the figure above it is already the
   * total and two totals on one panel is one too many.
   */
  total?: PriceTotal;
  /** A heading over the list. Default `"What it came from"`. */
  title?: string;
  /** Hide the kinds behind a disclosure. Default `false`. */
  collapsible?: boolean;
  /** Starts the disclosure open. Default `false`. */
  defaultExpanded?: boolean;
  labels?: EarningsLabels;
  /** Names the list. Defaults to `title`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface EarningsPayoutRowProps {
  /** The payout. */
  payout: EarningsPayout;
  /** The line over the date. Default `"Next payout"`. */
  title?: string;
  /** Makes the row pressable — an app opens the payout's detail from here. */
  onPress?: () => void;
  /** A control after the row — "Change the account", "Try again". */
  action?: ReactNode;
  labels?: EarningsLabels;
  /** Overrides the composed name of the row. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface EarningsSummaryProps {
  /** The periods the switch offers, in the order they are drawn. At least one. */
  periods: readonly EarningsPeriod[];
  /** Controlled period id. */
  period?: string;
  /** Uncontrolled initial period id. Default the first. */
  defaultPeriod?: string;
  onPeriodChange?: (id: string) => void;
  /** The payout, when it does not change with the period. A period's own wins. */
  payout?: EarningsPayout;
  /** Makes the payout row pressable. */
  onPressPayout?: () => void;
  /** A control after the payout row. */
  payoutAction?: ReactNode;
  /**
   * The Y axis's tick words.
   *
   * THE AXIS IS THE ONE PLACE A NUMBER CANNOT ARRIVE PRE-FORMATTED: a tick is a
   * position on a scale the chart chose, not a sum the app made, so there is no
   * string for it to have formatted. The default prints the rounded number and
   * no currency; an app that wants `"€200"` supplies this.
   */
  formatAxisValue?: (value: number) => string;
  /** How tall the chart is. Default 329 — the height every chart card here is. */
  chartHeight?: number;
  /** Draws the breakdown. Default `true` when the period carries `lines`. */
  breakdown?: boolean;
  /** Draws the tiles. Default `true` when the period carries `stats`. */
  stats?: boolean;
  labels?: EarningsLabels;
  /** Names the panel. Default `"Earnings"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-chart`, `-stats`, `-breakdown`, `-payout`. */
  testID?: string;
}
