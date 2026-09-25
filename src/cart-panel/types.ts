import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { PriceLine, PriceTotal } from '../price-breakdown/types';

/** `comfortable` is the desktop panel's rung; `compact` fits a phone sheet. */
export type CartDensity = 'comfortable' | 'compact';

/** One thing in the basket, as data. */
export interface CartLineEntry {
  /** Identifies the line in `onLineQuantityChange` and `onLineRemove`. */
  id: string;
  /** What it is — "Ember flatbread". */
  name: string;
  /**
   * The choices made for it, already in words — "Large", "Extra cheese". Drawn
   * as one quiet line, joined with a middle dot.
   */
  options?: ReadonlyArray<string>;
  /** A note to the kitchen — "No coriander". Drawn under the options, in quotes by the app. */
  note?: string;
  /**
   * The line's own total, PRE-FORMATTED and already multiplied by `quantity` by
   * the app. Nothing here multiplies, converts or adds up a price.
   */
  price: string;
  /** PRE-FORMATTED price before a discount, struck through BEFORE `price`. */
  originalPrice?: string;
  /**
   * A second, PRE-FORMATTED rendering of `price` — the buyer's currency beside
   * the shop's, `"≈ 12,00 €"` — drawn de-emphasised under it. The cart's
   * spelling of `ListingPriceLine.secondary`; drawn as given, nothing converts.
   */
  secondaryPrice?: string;
  /** How many. Always at least 1 — a line with none of it is a line that was removed. */
  quantity: number;
  /** An absolute URL, or an id the app's `ImageResolver` turns into one. */
  photo?: string;
  /** The `ImageResolver` rendition for a photo id. Ignored for URLs. */
  photoVariant?: string;
  /** The kitchen ran out after it went in the basket. */
  unavailable?: boolean;
  /** Default `"Sold out"`. */
  unavailableLabel?: string;
}

export interface CartLineProps extends Omit<CartLineEntry, 'id'> {
  /** With it the quantity is a `Stepper`; without, a quiet "×2". */
  onQuantityChange?: (quantity: number) => void;
  /** The remove control. Without it no remove control is drawn. */
  onRemove?: () => void;
  /** Names the remove control, which draws no text. Default `"Remove <name>"`. */
  removeLabel?: string;
  /**
   * Moves removal INTO the stepper: at quantity 1 its `−` becomes a trash button
   * named `removeLabel` that calls `onRemove`, and no separate remove control is
   * drawn. Needs both `onQuantityChange` and `onRemove`; a sold-out line keeps
   * the separate control. Default `false` — the stepper floors at 1.
   */
  removeInStepper?: boolean;
  /** Default `comfortable`. */
  density?: CartDensity;
  /** Replaces the composed name ("Ember flatbread, Large, Extra cheese, 2, €24.00"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One tip the picker offers. */
export interface CartTipOption {
  /** Identifies the choice. */
  id: string;
  /** As drawn and as announced — "10%", "€2", "No tip". PRE-FORMATTED. */
  label: string;
}

export interface CartTipPickerProps {
  options: ReadonlyArray<CartTipOption>;
  /** The chosen option's `id`, or `undefined` while nothing is chosen. */
  value?: string;
  onValueChange: (id: string) => void;
  /** The question above the row. Default `"Tip"`. */
  label?: string;
  /** A quieter line under the row — "It goes to the courier, in full." */
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CartPromoFieldProps {
  /** The code being typed. Fully controlled. */
  value: string;
  onChangeText: (value: string) => void;
  /** Called when the apply control is pressed. */
  onApply: () => void;
  /**
   * A code that is already on the order. While it is set the field is replaced
   * by a removable pill — an input still holding a code that has been accepted
   * invites a reader to apply it twice.
   */
  applied?: string;
  /** Removes the applied code. Without it the pill is not removable. */
  onRemove?: () => void;
  /** Names the remove control. Default `"Remove <code>"`. */
  removeLabel?: string;
  /** The field's label. Default `"Promo code"`. */
  label?: string;
  /** The input's placeholder. */
  placeholder?: string;
  /** The apply control's label. Default `"Apply"`. */
  applyLabel?: string;
  /** A rejection — "That code has expired". A non-empty string paints the field invalid. */
  error?: string | null;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** What the basket is still short of. */
export interface CartMinimumOrder {
  /**
   * The whole sentence, PRE-FORMATTED — "€4.50 more to reach the €12 minimum".
   * The component neither subtracts nor formats: it draws what it is handed.
   */
  message: string;
  /** How far along, drawn by `Meter`. Without it no bar is drawn. */
  progress?: {
    value: number;
    /** @default 1 */
    max?: number;
    /** Required — a bar draws no text. "Progress to the minimum order". */
    accessibilityLabel: string;
    /** `aria-valuetext` — "€7.50 of €12". */
    valueText?: string;
  };
}

/** The totals, handed straight to `price-breakdown`'s `PriceSummary`. */
export interface CartSummary {
  lines: ReadonlyArray<PriceLine>;
  total?: PriceTotal;
  /** Folds the LINES away and leaves the total. Default `false`. */
  collapsible?: boolean;
  /** Uncontrolled initial disclosure. Default `false`. */
  defaultExpanded?: boolean;
}

export interface CartPanelProps {
  /** The vendor the basket belongs to. A basket belongs to exactly one. */
  vendorName: string;
  /** An absolute URL, or an id the app's `ImageResolver` turns into one. */
  vendorPhoto?: string;
  /** The `ImageResolver` rendition for a vendor photo id. */
  vendorPhotoVariant?: string;
  /** The line under the vendor — "25–35 min · €1.90 delivery". PRE-FORMATTED. */
  vendorMeta?: string;
  /** Opens the vendor. Without it the vendor header is not pressable. */
  onPressVendor?: () => void;

  /** The lines, in the order they went in. */
  lines: ReadonlyArray<CartLineEntry>;
  /** With it every line draws a `Stepper`. */
  onLineQuantityChange?: (id: string, quantity: number) => void;
  /** With it every line draws a remove control. */
  onLineRemove?: (id: string) => void;
  /**
   * Every line removes from its stepper at quantity 1 instead of drawing a
   * separate remove control (`CartLine`'s `removeInStepper`). Default `false`.
   */
  removeInStepper?: boolean;

  /** The shortfall warning. Drawn above the totals, where the number it is about is. */
  minimumOrder?: CartMinimumOrder;
  /** The tip picker. Without it no tip row is drawn. */
  tip?: CartTipPickerProps;
  /** The promo field. Without it no promo row is drawn. */
  promo?: CartPromoFieldProps;
  /** The totals. Without them no breakdown is drawn. */
  summary?: CartSummary;

  /** The checkout control. Without it no footer is drawn. */
  onCheckout?: () => void;
  /** Default `"Go to checkout"`. */
  checkoutLabel?: string;
  /** Blocks checkout — under the minimum, a line gone. */
  checkoutDisabled?: boolean;

  /** Replaces the whole empty block, drawn when `lines` is empty. */
  empty?: ReactNode;
  /** Default `"Your basket is empty"`. */
  emptyTitle?: string;
  /** Default `"Add something from the menu and it will show up here."` */
  emptyDescription?: string;

  /** Default `comfortable`. */
  density?: CartDensity;
  /** Names the list of lines. Default `"Basket"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
