import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
//  PriceBreakdown
// ---------------------------------------------------------------------------

/** `discount` paints the amount in the success colour with a leading minus. */
export type PriceBreakdownTone = 'default' | 'discount';

export interface PriceBreakdownRow {
  /** React key; defaults to `label`. */
  key?: string;
  /** "$180 x 5 nights", "Cleaning fee". */
  label: string;
  /** Pre-formatted amount ("$900"). A `discount` row draws "−" before it unless it already starts with a minus. */
  amount: string;
  /**
   * Makes the label an underlined button. Called on press — open your own
   * explanation, or pass `details` and let the row open a `Popover`.
   */
  onPressLabel?: () => void;
  /** Content of a `Popover` the underlined label opens (a bottom sheet on native). */
  details?: ReactNode;
  /** Default `'default'`. */
  tone?: PriceBreakdownTone;
}

export interface PriceBreakdownProps {
  rows: PriceBreakdownRow[];
  /** The bold last row's label. Default `"Total"`. */
  totalLabel?: string;
  /** The bold last row's amount; omit to draw no total (and no hairline). */
  total?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  BookingCard
// ---------------------------------------------------------------------------

/** The field of the date/guest box whose picker is open. */
export type BookingFieldKey = 'checkIn' | 'checkOut' | 'guests';

export interface BookingPriceProps {
  /** Pre-formatted price ("$180"). */
  price: string;
  /** A struck-through earlier price ("$210"). */
  originalPrice?: string;
  /** "night". Drawn after the price. */
  priceUnit?: string;
  /**
   * Drawn before the unit: `"/"` draws "€1,250 / month". Not spoken — the
   * price still reads "€1,250 per month".
   */
  priceUnitPrefix?: string;
  /** The price's spoken form. Default: "$180 per night, originally $210". */
  priceAccessibilityLabel?: string;
}

export interface BookingCardProps extends BookingPriceProps {
  /** A `Rating` beside the price. `null` draws "New"; omit to draw none. */
  rating?: number | string | null;
  reviewCount?: number | string;

  /** Pre-formatted check-in date; omit while unselected. */
  checkIn?: string;
  /** Pre-formatted checkout date; omit while unselected. */
  checkOut?: string;
  /** Pre-formatted guest summary ("2 guests, 1 infant"). */
  guests: string;
  /** Called by either date cell. Open your date picker here. */
  onPressDates?: (field: 'checkIn' | 'checkOut') => void;
  /** Called by the guests cell (also when `guestPicker` opens its popover). */
  onPressGuests?: () => void;
  /**
   * The field whose picker is open: drawn with the active outline and
   * announced as expanded. When `guestPicker` is set, an open guests popover
   * marks `guests` active by itself.
   */
  activeField?: BookingFieldKey | null;
  /**
   * Content of the guests popover (a bottom sheet on native) the guests cell
   * opens — normally a `GuestPicker` (`@oxy.so/bloom/stay-search`), whose "Close"
   * closes the popover. Omit to handle `onPressGuests` yourself.
   */
  guestPicker?: ReactNode;
  /** Controlled open state of the guests popover. */
  guestsOpen?: boolean;
  onGuestsOpenChange?: (open: boolean) => void;

  /** Default `"Check-in"`; drawn uppercase. */
  checkInLabel?: string;
  /** Default `"Checkout"`; drawn uppercase. */
  checkOutLabel?: string;
  /** Default `"Guests"`; drawn uppercase. */
  guestsLabel?: string;
  /** Shown in an unselected date cell. Default `"Add date"`. */
  datePlaceholder?: string;

  /**
   * The button's label. Default: `"Reserve"` once both dates are set,
   * `checkAvailabilityLabel` before.
   */
  reserveLabel?: string;
  /** Default `"Check availability"`. */
  checkAvailabilityLabel?: string;
  onReserve?: () => void;
  reserveDisabled?: boolean;
  /** Spinner in the button; presses are ignored. */
  loading?: boolean;

  /**
   * The centred line under the button. Default `"You won't be charged yet"`
   * once both dates are set, nothing before; `null` hides it.
   */
  note?: ReactNode;
  /** The price breakdown under the button. */
  breakdown?: PriceBreakdownProps;
  /** Below the card's content, e.g. a "Report this listing" link. */
  footer?: ReactNode;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  BookingBar
// ---------------------------------------------------------------------------

export interface BookingBarProps extends BookingPriceProps {
  /** Pre-formatted date range ("Oct 12 – 17"), drawn underlined under the price. */
  dates?: string;
  /** Makes `dates` a button. */
  onPressDates?: () => void;
  /** Default `"Reserve"`. */
  reserveLabel?: string;
  onReserve?: () => void;
  reserveDisabled?: boolean;
  loading?: boolean;
  /**
   * Extra space under the content. Default: the safe-area bottom inset from
   * `react-native-safe-area-context` when a provider is mounted, else 0.
   */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  TripCard
// ---------------------------------------------------------------------------

export type TripStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

/** `auto` is horizontal once the card is at least 480 wide. */
export type TripCardOrientation = 'auto' | 'horizontal' | 'vertical';

export interface TripCardProps {
  /** Photo: an absolute URL, or an id resolved through `ImageResolverProvider`. */
  image?: string;
  /** Rendition requested from the resolver. */
  imageVariant?: string;
  /** The place ("Cliffside cabin in Val Serena"). */
  title: string;
  /** The host line ("Hosted by Marisol"). */
  subtitle?: string;
  /** Pre-formatted dates ("Oct 12 – 17, 2026"). */
  dates?: string;
  status?: TripStatus;
  /** Default: "Confirmed", "Pending", "Cancelled", "Completed". */
  statusLabel?: string;
  /** Buttons under the text ("Message host", "Get directions"); they stay separately pressable. */
  actions?: ReactNode;
  /** Default `'auto'`. */
  orientation?: TripCardOrientation;
  /** Makes the card a button (the actions stay their own buttons). */
  onPress?: () => void;
  /** The pressable card's name. Default: title, dates and status. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
