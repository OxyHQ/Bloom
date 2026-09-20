import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * What a line is, as a colour decision rather than a domain one.
 *
 * `discount` paints the amount in the success tone — it is money coming back.
 * `muted` draws the whole line at the secondary rung, for the charges a reader
 * scans past (a tax line, a rounding line). `default` is everything else,
 * including a fee: a fee is a line with a label and an amount, and giving it a
 * tone of its own would be this component deciding what an app's fees mean.
 */
export type PriceLineTone = 'default' | 'discount' | 'muted';

/**
 * Whether the number is the answer yet. `estimated` is a real number that can
 * still move (a distance-based delivery charge before the route is fixed);
 * `pending` has no number at all yet.
 */
export type PriceLineState = 'final' | 'estimated' | 'pending';

export interface PriceLine {
  /** Stable key. Defaults to the index. */
  id?: string;
  /** "Subtotal", "Delivery", "Service fee". */
  label: string;
  /** A quieter second line under the label — "3 items", "4.2 km". */
  sublabel?: string;
  /**
   * PRE-FORMATTED, sign and currency included: `"€12.40"`, `"−€3.00"`,
   * `"$0.00"`. Nothing in this family parses, adds or formats a number — the
   * app owns currency, locale and the minus sign. Omit it for a `pending` line.
   */
  amount?: string;
  /** Default `default`. */
  tone?: PriceLineTone;
  /** Default `final`. */
  state?: PriceLineState;
  /**
   * An explanation, shown in a `Popover` anchored to an info glyph after the
   * label. Any node: a string, a `Text`, a short column.
   */
  info?: ReactNode;
  /**
   * Names the info affordance — it draws a glyph and no text. Defaults to
   * `"About <label>"`.
   */
  infoAccessibilityLabel?: string;
}

/** The row that is the answer. */
export interface PriceTotal {
  /** "Total", "Total due", "You pay". */
  label: string;
  /** PRE-FORMATTED, like every other amount here. */
  amount?: string;
  /** A quieter line under the total — "Includes taxes". */
  note?: string;
  /** Default `final`. */
  state?: PriceLineState;
}

/** The words drawn beside an amount that is not final. */
export type PriceStateLabels = Partial<Record<Exclude<PriceLineState, 'final'>, string>>;

export interface PriceSummaryLineProps extends Omit<PriceLine, 'id'> {
  /** Defaults: `estimated` → "Estimated", `pending` → "Pending". */
  stateLabels?: PriceStateLabels;
  /** Drawn where the amount would be on a line that has none. Default `"—"`. */
  pendingPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PriceSummaryProps {
  /** The charges, in the order they should be read. */
  lines: readonly PriceLine[];
  /** The answer. Without it the component draws the lines and no rule. */
  total?: PriceTotal;
  /**
   * Hide the lines behind a disclosure, leaving the total visible. The total is
   * deliberately never what collapses: the number a reader came for stays on
   * screen and the ITEMISATION is what folds away.
   */
  collapsible?: boolean;
  /** Controlled disclosure. */
  expanded?: boolean;
  /** Uncontrolled initial disclosure. Default `false`. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Default `"Show price details"`. */
  expandLabel?: string;
  /** Default `"Hide price details"`. */
  collapseLabel?: string;
  /** Defaults: `estimated` → "Estimated", `pending` → "Pending". */
  stateLabels?: PriceStateLabels;
  /** Drawn where the amount would be on a line that has none. Default `"—"`. */
  pendingPlaceholder?: string;
  /** Names the list of charges. Default `"Price breakdown"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
