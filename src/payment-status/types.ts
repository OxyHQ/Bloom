import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { OrderStatusProgress } from '../order-status';

/**
 * WHAT HAPPENED TO THE MONEY.
 *
 * Five states, and they are the five an app has to be able to DRAW rather than
 * the five a processor reports: `authorising` is in flight, `paid` is done,
 * `failed` stopped and says why, `refunded` went back, and `pending` is waiting
 * on something outside the app — a bank window, a queued retry, a device with
 * no connection.
 *
 * A processor with twenty statuses maps them onto these five. This family does
 * no mapping of its own, because which of a processor's statuses counts as
 * "done" is a decision about that processor's contract, not about a strip.
 */
export type PaymentStatusState = 'authorising' | 'paid' | 'failed' | 'refunded' | 'pending';

/** The words each state says, when the caller wants its own. */
export type PaymentStatusLabels = Partial<Record<PaymentStatusState, string>>;

export interface PaymentStatusBarProps {
  /** Which of the five. */
  state: PaymentStatusState;
  /** Overrides the state's own words — "Held for review", "Retrying". */
  status?: string;
  /**
   * PRE-FORMATTED, sign and currency included: `"€48.00"`, `"−€12.50"`.
   * Nothing here parses, adds or formats a number.
   */
  amount?: string;
  /** A quieter second line — the method, the reference, the reason in short. */
  detail?: string;
  /** How far along an authorisation is. Without it no bar is drawn. */
  progress?: OrderStatusProgress;
  /** The glyph, overriding the state's own. */
  icon?: BloomIconComponent;
  /** A trailing control — the retry `Button`, a "View receipt" link. */
  action?: ReactNode;
  /** `surface` paints a strip of its own; `plain` draws only the content. */
  variant?: 'surface' | 'plain';
  /** Replaces the default words for any of the five states. */
  labels?: PaymentStatusLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PaymentStatusBlockProps {
  /** Which of the five. */
  state: PaymentStatusState;
  /** Overrides the state's own words. */
  status?: string;
  /** PRE-FORMATTED, like every other amount in this library. */
  amount?: string;
  /** A line under the amount — "Aurora •••• 4417", "Charged on 4 June". */
  detail?: string;
  /**
   * The reference a reader quotes when something goes wrong. Drawn in tabular
   * figures so it can be read out a character at a time.
   */
  reference?: string;
  /** The word before it. Default `"Reference"`. */
  referenceLabel?: string;
  /**
   * WHY it failed, in the processor's own words, drawn in an `Admonition`.
   *
   * Only for `failed` and `pending`: a reason under a success is a reader
   * looking for a problem that is not there.
   */
  reason?: string;
  /** The retry, the receipt, the "try another method" — as `Button`s. */
  actions?: ReactNode;
  /** The glyph, overriding the state's own. */
  icon?: BloomIconComponent;
  /** `surface` paints a card of its own; `plain` draws only the content. */
  variant?: 'surface' | 'plain';
  /** Replaces the default words for any of the five states. */
  labels?: PaymentStatusLabels;
  /**
   * Names the block. Defaults to the state's words and the amount joined — the
   * block's own heading, which is what a reader lands on.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
