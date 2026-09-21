import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AddressKind } from '../address';
import type { EmptyStateAction, EmptyStateVariant } from '../empty-state';
import type { BloomIconComponent } from '../icons/icon-component';
import type { OrderStatusBarProps } from '../order-status';

/**
 * One reading of the receipt: when it arrives, what was charged, who is
 * bringing it.
 *
 * `value` is PRE-FORMATTED, like every string in this family — a time, an
 * amount, a courier's name. Nothing here reads a clock or adds a number.
 */
export interface OrderConfirmationFact {
  /** Stable key. Defaults to the label. */
  id?: string;
  /** "Arrives", "Paid with", "Courier". */
  label: string;
  /** "Today, 17:00 – 19:00", "•••• 4417", "Mireia". */
  value: string;
}

/** Where it is going, drawn with `address`'s own `AddressRow`. */
export interface OrderConfirmationAddress {
  /** The line the place is recognised by — "Home". */
  title: string;
  /** The rest of it. */
  subtitle?: string;
  /** Chooses the glyph. Default `place`. */
  kind?: AddressKind;
  /** The glyph, overriding whatever `kind` would have chosen. */
  icon?: BloomIconComponent;
  /** A node after the title — a `Badge`. */
  badge?: ReactNode;
  /** A short trailing reading — "1.2 km". */
  meta?: string;
  testID?: string;
}

export interface OrderConfirmationProps {
  /** Default `"Your order is placed"`. */
  title?: string;
  /** The line under it — "We have sent the receipt to your inbox." */
  description?: string;
  /**
   * The mark above the title. Default a check on a success-tinted disc — a
   * STATIC one, because `AnimatedCheck` draws itself on only when a caller
   * kicks it through its ref, and a mark nobody can see until a method runs is
   * not a mark. Pass `<AnimatedCheck>` (played by your own ref) for the
   * draw-on, a brand mark, or `null` for none.
   */
  mark?: ReactNode;
  /** The default mark's box. Default 56. */
  markSize?: number;

  /** The order's own number — "A-4821". PRE-FORMATTED, including any prefix. */
  reference?: string;
  /** The caption above it. Default `"Order number"`. */
  referenceLabel?: string;

  /**
   * The tracking strip — `order-status`'s `OrderStatusBar`, passed straight
   * through. This family draws no second one: "where it is right now" has one
   * component in the library and this is a place that shows it.
   */
  status?: OrderStatusBarProps;

  /** Where it goes. */
  address?: OrderConfirmationAddress;

  /** When it arrives, what was charged, and anything else worth reading back. */
  facts?: readonly OrderConfirmationFact[];

  /**
   * What was ordered, in full — the basket's own rows, rendered by the app.
   * A slot rather than data: a line of an order is a dish, a parcel or a seat
   * depending on the app, and each already has a row family of its own.
   */
  items?: ReactNode;
  /** The caption above `items`. Default `"What you ordered"`. */
  itemsLabel?: string;

  /** The first thing you do next — normally "Track order". */
  action?: EmptyStateAction;
  /** The other one — normally "Get help". */
  secondaryAction?: EmptyStateAction;
  /** Under the actions — a "Back to the shop" link, a note. */
  footer?: ReactNode;

  /** Default `comfortable`. `compact` is the panel rung. */
  variant?: EmptyStateVariant;
  /** Names the whole surface. Defaults to the title and the reference. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
