import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AddressKind } from '../address';
import type { BloomIconComponent } from '../icons/icon-component';
import type { PriceSummaryProps } from '../price-breakdown';

/**
 * ONE row of the review: what was chosen, and the thing that changes it.
 *
 * The row is the summary AND the trigger. A label with a "Change" button beside
 * it gives a reader two targets for one decision and a screen reader two stops
 * that do not mention each other; here the whole row is the button, its name is
 * "<label>: <value>", and the chevron is decoration.
 */
export interface CheckoutSummaryLine {
  /** Stable key. Defaults to the index. */
  id?: string;
  /** What the row is FOR — "Delivery window", "Note for the shop". */
  label: string;
  /** The glyph in the leading tile. */
  icon?: BloomIconComponent;
  /**
   * The chosen value, PRE-FORMATTED — "Today, 17:00 – 19:00", "€24.80". This
   * family formats no dates and no money.
   */
  value?: string;
  /** Drawn in place of the value while nothing is chosen. Default `"Not chosen yet"`. */
  placeholder?: string;
  /** A quieter third line — "Standard delivery", "Leave at the door". */
  detail?: string;
  /** A node beside the value — a `Badge` ("Free"), a `Chip`. */
  badge?: ReactNode;
  /** Opens whatever changes this row. Without it the row is a static summary. */
  onPress?: () => void;
  disabled?: boolean;
  /**
   * What pressing the row does, announced as the row's hint. Default
   * `"Opens the picker"`; it is a HINT and not part of the name, so a reader
   * scanning the summary hears the values rather than "Change" five times.
   */
  accessibilityHint?: string;
  /** Defaults to `"<label>: <value>"`. */
  accessibilityLabel?: string;
  testID?: string;
}

export interface CheckoutSummaryRowProps extends CheckoutSummaryLine {
  /**
   * Replaces the value/detail column — an `AddressRow`, a two-line receipt, a
   * row of chips. The label and the chevron stay.
   */
  content?: ReactNode;
  /**
   * An arbitrary leading node instead of the glyph tile. Read for PRESENCE:
   * `leading={null}` draws no media at all.
   */
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The "where it goes" row, drawn with `address`'s own `AddressRow`. */
export interface CheckoutAddressSummary {
  /** Default `"Deliver to"`. */
  label?: string;
  /** The line the place is recognised by — "Home", "Carrer de l’Om 14". */
  title: string;
  /** The rest of it — "Carrer de l’Om 14, 2nd floor". */
  subtitle?: string;
  /** Chooses the glyph in the row's tile. Default `place`. */
  kind?: AddressKind;
  /** The glyph, overriding whatever `kind` would have chosen. */
  icon?: BloomIconComponent;
  /** A node after the title — a `Badge` ("Default"). */
  badge?: ReactNode;
  /** Opens the address picker. */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export interface CheckoutConfirmProps {
  /** Default `"Place order"`. */
  label?: string;
  /**
   * The amount the press commits to, PRE-FORMATTED, drawn on the button after
   * the label. It is on the BUTTON rather than beside it because the number a
   * press commits to and the press are one decision.
   */
  amount?: string;
  /**
   * The terms line under the button — a string, or a node with links in it.
   * `null` draws none.
   */
  terms?: ReactNode;
  /** Called at most once per busy cycle. */
  onConfirm?: () => void;
  disabled?: boolean;
  /**
   * The order is being placed: spinner, and every further press is dropped.
   *
   * The component ALSO latches on its own press, because the app's `busy`
   * arrives a render later and the second tap of a double-tap lands inside that
   * window. The latch clears when `busy` goes back to `false`.
   */
  busy?: boolean;
  /** Announced while busy, in place of the button's own name. Default `"Placing your order"`. */
  busyLabel?: string;
  /** Under the terms line — "Cancel", a help link. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CheckoutSummaryProps {
  /** The heading above the rows. `null` draws none. */
  title?: string | null;
  /** Where it goes. */
  address?: CheckoutAddressSummary;
  /** When it comes. */
  delivery?: CheckoutSummaryLine;
  /**
   * How it is paid — a SLOT, because the payment-method row is its own family.
   * Anything that renders as a row goes here; `CheckoutSummaryRow` is exported
   * so an app with no payment family yet can draw one in the same register.
   */
  payment?: ReactNode;
  /** The note to the seller. */
  note?: CheckoutSummaryLine;
  /** Anything else this order needs a decision about, appended after the note. */
  extras?: readonly CheckoutSummaryLine[];
  /**
   * What it costs — `price-breakdown`'s `PriceSummary`, passed through. There
   * is no second breakdown in this family and no arithmetic anywhere.
   */
  price?: PriceSummaryProps;
  /** The confirm control under the totals. */
  confirm?: CheckoutConfirmProps;
  /** Between the rows and the totals — a promo field, a tip picker. */
  children?: ReactNode;
  /** Names the summary. Default the title, then `"Order summary"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
