import {
  BookingBar as BloomBookingBar,
  type BookingBarProps,
  BookingCard as BloomBookingCard,
  type BookingCardProps,
  PriceBreakdown as BloomPriceBreakdown,
  type PriceBreakdownProps,
  type PriceBreakdownRow,
  TripCard as BloomTripCard,
  type TripCardProps,
} from '@oxy.so/bloom/booking';

import { type Child, Node, type ViewModifiers } from '../node';
import type { SpaceToken, TripCardOrientation } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A stay's booking: the reserve card and bar, the price breakdown, a trip. */
export type BookingKind = 'tripCard' | 'bookingCard' | 'bookingBar' | 'priceBreakdown';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type TripCardOptions = Omit<
  TripCardProps,
  Drawn | 'title' | 'orientation' | 'onPress' | 'actions'
> & { readonly actions?: Child };
type BookingCardSlots = 'guestPicker' | 'note' | 'footer';
export type BookingCardOptions = Omit<
  BookingCardProps,
  Drawn | 'price' | 'guests' | 'loading' | 'reserveDisabled' | BookingCardSlots
> & { readonly [K in BookingCardSlots]?: Child };
export type BookingBarOptions = Omit<
  BookingBarProps,
  Drawn | 'price' | 'loading' | 'reserveDisabled' | 'bottomInset'
> & { readonly bottomInset?: SpaceToken };
export type PriceBreakdownOptions = Omit<PriceBreakdownProps, 'style' | 'testID' | 'rows'>;

/** Bloom `TripCard`: a booked stay; `.onPress()` makes the whole card a button. */
export interface TripCardView extends ViewModifiers<TripCardView> {
  /** `auto` (default: horizontal from 480 wide), `horizontal` or `vertical`. */
  style(value: TripCardOrientation): TripCardView;
}
/** Bloom `BookingCard`: the price, dates, guests and the reserve button. */
export interface BookingCardView extends ViewModifiers<BookingCardView> {
  /** A spinner in the reserve button; presses are ignored. */
  loading(value?: boolean): BookingCardView;
  /** The reserve button is disabled. */
  disabled(value?: boolean): BookingCardView;
}
/** Bloom `BookingBar`: the price and the reserve button, pinned under a stay. */
export interface BookingBarView extends ViewModifiers<BookingBarView> {
  loading(value?: boolean): BookingBarView;
  /** The reserve button is disabled. */
  disabled(value?: boolean): BookingBarView;
}
export type PriceBreakdownView = ViewModifiers<PriceBreakdownView>;

/** Bloom `TripCard` of the stay titled `title`. */
export function TripCard(title: string, options: TripCardOptions = {}): TripCardView {
  return new Node('tripCard', { title, options }, []);
}
/** Bloom `BookingCard` at `price` (pre-formatted) for `guests` (its summary). */
export function BookingCard(
  price: string,
  guests: string,
  options: BookingCardOptions = {},
): BookingCardView {
  return new Node('bookingCard', { price, guests, options }, []);
}
/** Bloom `BookingBar` at `price` (pre-formatted). */
export function BookingBar(price: string, options: BookingBarOptions = {}): BookingBarView {
  return new Node('bookingBar', { price, options }, []);
}
/** Bloom `PriceBreakdown` of `rows`, with its total when the options give one. */
export function PriceBreakdown(
  rows: readonly PriceBreakdownRow[],
  options: PriceBreakdownOptions = {},
): PriceBreakdownView {
  return new Node('priceBreakdown', { rows, options }, []);
}

export const BOOKINGS: Record<BookingKind, ControlRenderer> = {
  tripCard: product(BloomTripCard, {
    slots: ['actions'],
    press: true,
    own: (d) => ({ orientation: d.own('style')?.value }),
  }),
  bookingCard: product(BloomBookingCard, {
    slots: ['guestPicker', 'note', 'footer'],
    own: (d) => ({
      loading: d.own('loading')?.value,
      reserveDisabled: d.own('disabled')?.value,
    }),
  }),
  bookingBar: product(BloomBookingBar, {
    lengths: ['bottomInset'],
    own: (d) => ({
      loading: d.own('loading')?.value,
      reserveDisabled: d.own('disabled')?.value,
    }),
  }),
  priceBreakdown: product(BloomPriceBreakdown),
};
