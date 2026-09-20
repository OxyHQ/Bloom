import type { StyleProp, ViewStyle } from 'react-native';

/**
 * How good the lead is, as a BAND rather than a colour. The tone each band
 * draws in lives in `constants.ts`, so a card never names a red or a blue and
 * the band survives every preset and both modes.
 */
export type LeadScoreBand = 'cold' | 'warm' | 'hot';

/** One thing the score is made of, positive or negative. */
export interface LeadScoreFactor {
  /** Stable key. Defaults to the label. */
  id?: string;
  label: string;
  /**
   * SIGNED points. A positive factor pushes the score up and draws in the
   * positive tone; a negative one pulls it down and draws in the negative tone.
   * Zero is drawn as an empty bar rather than hidden — "this counted for
   * nothing" is a fact about the lead.
   */
  contribution: number;
  /** A quiet line under the label — "Opened 4 of 5 emails". */
  detail?: string;
}

/** Which way the score moved against the period before this one. */
export interface LeadScoreTrend {
  /** PRE-FORMATTED ("+8 vs last week"). The card does no arithmetic. */
  label: string;
  direction: 'up' | 'down' | 'flat';
}

export interface LeadScoreCardProps {
  score: number;
  /** The full scale. Default 100. */
  max?: number;
  /** Overrides the band the score falls in — for an app with its own thresholds. */
  band?: LeadScoreBand;
  /** Overrides the band's own word. */
  bandLabel?: string;
  /**
   * REQUIRED. The ring draws a number and names no subject, and no amount of
   * content names a `progressbar` — so without this the card announces
   * "progress bar, 72%" and never says whose lead it is.
   */
  accessibilityLabel: string;
  /**
   * `aria-valuetext` — the reading a screen reader says instead of the raw
   * number ("72 of 100, hot"), which is otherwise announced as a percentage.
   */
  valueText?: string;
  /** The heading over the ring. Default `"Lead score"`. */
  title?: string;
  /** What the score is made of. */
  factors?: readonly LeadScoreFactor[];
  /** The heading over the factors. Default `"What it is made of"`. */
  factorsLabel?: string;
  trend?: LeadScoreTrend;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
