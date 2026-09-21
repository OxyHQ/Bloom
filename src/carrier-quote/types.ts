import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { PriceLine, PriceTotal } from '../price-breakdown';

/**
 * A mark the LIST puts on a quote, not the quote on itself.
 *
 * `cheapest` and `fastest` are statements about the set: a card handed one out
 * of context would be claiming something it cannot know. `CarrierQuoteList`
 * derives them from `priceValue` / `etaMinutes` and passes them down, and a
 * caller rendering a lone card supplies them only if it has the same set.
 */
export type CarrierQuoteMark = 'cheapest' | 'fastest';

/** What the list orders by. */
export type CarrierQuoteSort = 'price' | 'eta' | 'rating';

/** `comfortable` is the offers screen; `compact` fits a sheet or a side panel. */
export type CarrierQuoteDensity = 'comfortable' | 'compact';

export interface CarrierQuoteCarrier {
  /** Identifies the carrier to the app. Not drawn. */
  id: string;
  /** The name on the card — a person or a company. */
  name: string;
  /** A URL, an `{ uri }`, or an `ImageResolver` id. */
  avatar?: string;
  /**
   * The rating on a 5 scale, handed straight to `Rating`. `null` (or omitted)
   * is a carrier with no rating yet, which `Rating` draws as "New".
   */
  rating?: number | string | null;
  /** How many jobs they have done. A string is drawn as given ("1.2k"). */
  jobs?: number | string;
  /** What they will arrive in — "Van", "Cargo bike". */
  vehicle?: string;
  /** The vehicle's glyph, drawn in the vehicle tile. */
  vehicleIcon?: BloomIconComponent;
  /** Draws the verified mark after the name. */
  verified?: boolean;
  /** A one-line trade line under the name — "Larkspur Freight · Lisbon". */
  detail?: string;
}

export interface CarrierQuote {
  /** Identifies the offer to `onAccept` / `onMessage` / `onDecline`, and keys the row. */
  id: string;
  carrier: CarrierQuoteCarrier;
  /**
   * The offer, PRE-FORMATTED with its currency: `"€38.40"`. Nothing in this
   * family parses, sums, converts or rounds an amount.
   */
  price: string;
  /** A quieter line under the price — "All in, VAT included". */
  priceNote?: string;
  /** The itemisation, handed to `PriceSummary` unchanged. */
  priceLines?: readonly PriceLine[];
  /** The summary's own total row. Without it the breakdown draws the lines and no rule. */
  priceTotal?: PriceTotal;
  /** When they would collect — "Today, 14:00–16:00". */
  pickupWindow?: string;
  /** When it would land — "Arrives 17:40", "2 h 10". */
  eta?: string;
  /** What the carrier wrote with the offer. Drawn at three lines, then truncated. */
  message?: string;
  /** How long the offer stands — "Expires in 12 min". Drawn as a warning-toned line. */
  expiresIn?: string;
  /**
   * The price as a NUMBER, for sorting and for the `cheapest` mark only. Never
   * drawn, never formatted, and in whatever unit the app compares in — this
   * family only ever asks which of two is smaller. A quote without it sorts
   * last and is never marked.
   */
  priceValue?: number;
  /** The ETA in minutes, for sorting and for the `fastest` mark. Same rules. */
  etaMinutes?: number;
  /** Marks drawn beside the name. The list supplies these; see {@link CarrierQuoteMark}. */
  marks?: readonly CarrierQuoteMark[];
}

/** Every word the card and the list speak, in one prop. */
export interface CarrierQuoteLabels {
  /** The accept action. Default `"Accept"`. */
  accept?: string;
  /** The message action. Default `"Message"`. */
  message?: string;
  /** The decline action. Default `"Decline"`. */
  decline?: string;
  /** Over the pick-up tile. Default `"Pick-up"`. */
  pickup?: string;
  /** Over the arrival tile. Default `"Arrives"`. */
  eta?: string;
  /** Over the vehicle tile. Default `"Vehicle"`. */
  vehicle?: string;
  /** After the jobs count. Default `` (jobs) => `${jobs} jobs` ``. */
  jobs?: (jobs: string) => string;
  /** The verified mark's name — it draws a glyph and no text. Default `"Verified carrier"`. */
  verified?: string;
  /** The marks. Defaults `"Cheapest"` and `"Fastest"`. */
  marks?: Partial<Record<CarrierQuoteMark, string>>;
  /** The breakdown disclosure. Defaults `"Show price details"` / `"Hide price details"`. */
  showPrice?: string;
  hidePrice?: string;
  /** Names the itemisation, before the carrier's name. Default `"Price details for"`. */
  priceDetails?: string;
  /** The sort control's name. Default `"Sort offers"`. */
  sort?: string;
  /** The sort options. Defaults `"Cheapest"`, `"Fastest"`, `"Best rated"`. */
  sortOptions?: Partial<Record<CarrierQuoteSort, string>>;
  /** The list's heading. Default `` (count) => count === 1 ? '1 offer' : `${count} offers` ``. */
  count?: (count: number) => string;
  /** The loading list's name. Default `"Loading offers"`. */
  loading?: string;
}

export interface CarrierQuoteCardProps {
  /** The offer. */
  quote: CarrierQuote;
  /** Draws the accept action. Called with the quote's id. */
  onAccept?: (id: string) => void;
  /** Draws the message action. Called with the quote's id. */
  onMessage?: (id: string) => void;
  /** Draws the decline action. Called with the quote's id. */
  onDecline?: (id: string) => void;
  /** Makes the identity block pressable — an app opens the carrier's profile from here. */
  onPressCarrier?: (id: string) => void;
  /**
   * Draws the itemisation behind a disclosure under the tiles. Default `true`
   * when the quote carries `priceLines`; `false` never draws it.
   */
  breakdown?: boolean;
  /** Starts the breakdown open. Default `false`. */
  defaultBreakdownExpanded?: boolean;
  /** Default `comfortable`. */
  density?: CarrierQuoteDensity;
  /** Paints the card as the chosen offer: the accent border and a checked mark. */
  selected?: boolean;
  /** Dims the card and stops every action. */
  disabled?: boolean;
  /** Replaces the three built-in actions entirely. */
  actions?: ReactNode;
  labels?: CarrierQuoteLabels;
  /** Overrides the composed name of the identity block. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CarrierQuoteListProps {
  /** The offers. Order is the list's, not the caller's — see `sort`. */
  quotes: readonly CarrierQuote[];
  /** Controlled sort. */
  sort?: CarrierQuoteSort;
  /** Uncontrolled initial sort. Default `price`. */
  defaultSort?: CarrierQuoteSort;
  onSortChange?: (sort: CarrierQuoteSort) => void;
  /**
   * Which orders are offered, in the order they are drawn. Default all three.
   * An empty array draws no sort control — a list of two offers does not need
   * one.
   */
  sortOptions?: readonly CarrierQuoteSort[];
  /** Draws the count line over the list. Default `true`. */
  showCount?: boolean;
  /**
   * Marks the cheapest and the fastest offer. Default `true`. Every offer tied
   * at the minimum is marked — two offers at the same price are both the
   * cheapest, and picking one of them arbitrarily would be this component
   * inventing a tie-break.
   */
  marks?: boolean;
  /** Replaces the list with placeholder cards. */
  loading?: boolean;
  /** How many placeholders. Default `3`. */
  loadingCount?: number;
  /** Forwarded to every card. */
  onAccept?: (id: string) => void;
  onMessage?: (id: string) => void;
  onDecline?: (id: string) => void;
  onPressCarrier?: (id: string) => void;
  /** The chosen offer's id, if one has been chosen. */
  selectedId?: string | null;
  density?: CarrierQuoteDensity;
  breakdown?: boolean;
  /** The line over the empty state. Default `"No offers yet"`. */
  emptyTitle?: string;
  /** Under it. Default `"Carriers are looking at your job. The first offers usually arrive within a few minutes."`. */
  emptyDescription?: string;
  /** A control under the empty state — "Edit the job", "Invite a carrier". */
  emptyAction?: ReactNode;
  labels?: CarrierQuoteLabels;
  /** Names the list. Default `"Offers"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<quote id>` for each card. */
  testID?: string;
}
