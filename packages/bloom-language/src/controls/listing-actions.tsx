import {
  ActionBar as BloomActionBar,
  type ActionBarProps,
  MortgageCalculator as BloomMortgageCalculator,
  type MortgageCalculatorProps,
  RentalActionCard as BloomRentalActionCard,
  type RentalActionCardProps,
  SaleActionCard as BloomSaleActionCard,
  type SaleActionCardProps,
} from '@oxy.so/bloom/listing-actions';

import { type Child, Node, type ViewModifiers } from '../node';
import type { MortgageLayout, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** A listing's actions: the pinned bar, the rental and sale cards, the mortgage calculator. */
export type ListingActionKind =
  | 'listingActionBar'
  | 'mortgageCalculator'
  | 'rentalActionCard'
  | 'saleActionCard';

type Drawn = 'style' | 'testID';
type CardSlots = 'note' | 'footer';

export type ListingActionBarOptions = Omit<
  ActionBarProps,
  Drawn | 'price' | 'primaryLabel' | 'loading' | 'primaryDisabled' | 'bottomInset'
> & { readonly bottomInset?: SpaceToken };
export type MortgageCalculatorOptions = Omit<
  MortgageCalculatorProps,
  Drawn | 'layout' | 'maxWidth' | 'disclaimer'
> & { readonly maxWidth?: SpaceToken; readonly disclaimer?: Child };
export type RentalActionCardOptions = Omit<
  RentalActionCardProps,
  Drawn | 'price' | 'loading' | CardSlots
> & { readonly [K in CardSlots]?: Child };
export type SaleActionCardOptions = Omit<
  SaleActionCardProps,
  Drawn | 'price' | 'loading' | CardSlots
> & { readonly [K in CardSlots]?: Child };

/** Bloom's listing `ActionBar`: the price and the primary action, pinned under a listing. */
export interface ListingActionBarView extends ViewModifiers<ListingActionBarView> {
  /** A spinner in the primary button; presses are ignored. */
  loading(value?: boolean): ListingActionBarView;
  /** The primary button is disabled. */
  disabled(value?: boolean): ListingActionBarView;
}
/** Bloom `MortgageCalculator`: the price, deposit, term and rate, and the monthly payment. */
export interface MortgageCalculatorView extends ViewModifiers<MortgageCalculatorView> {
  /** `auto` (default: side by side from 640 wide), `stacked` or `split`. */
  style(value: MortgageLayout): MortgageCalculatorView;
}
/** Bloom `RentalActionCard`: a rental's price, facts, status and its two actions. */
export interface RentalActionCardView extends ViewModifiers<RentalActionCardView> {
  /** A spinner in the primary action; presses are ignored. */
  loading(value?: boolean): RentalActionCardView;
}
/** Bloom `SaleActionCard`: a sale's price, mortgage estimate, status and its actions. */
export interface SaleActionCardView extends ViewModifiers<SaleActionCardView> {
  loading(value?: boolean): SaleActionCardView;
}

/** Bloom's listing `ActionBar` at `price` (pre-formatted), its primary action `primaryLabel`. */
export function ListingActionBar(
  price: string,
  primaryLabel: string,
  options: ListingActionBarOptions = {},
): ListingActionBarView {
  return new Node('listingActionBar', { price, primaryLabel, options }, []);
}
/** Bloom `MortgageCalculator`; its values are controlled or start from their defaults, as Bloom's are. */
export function MortgageCalculator(
  options: MortgageCalculatorOptions = {},
): MortgageCalculatorView {
  return new Node('mortgageCalculator', { options }, []);
}
/** Bloom `RentalActionCard` at `price` (pre-formatted). */
export function RentalActionCard(
  price: string,
  options: RentalActionCardOptions = {},
): RentalActionCardView {
  return new Node('rentalActionCard', { price, options }, []);
}
/** Bloom `SaleActionCard` at `price` (pre-formatted). */
export function SaleActionCard(
  price: string,
  options: SaleActionCardOptions = {},
): SaleActionCardView {
  return new Node('saleActionCard', { price, options }, []);
}

/** A card's `.loading()`: Bloom's `loading`. */
const loading = { own: (d: ControlDraw) => ({ loading: d.own('loading')?.value }) };

export const LISTING_ACTIONS: Record<ListingActionKind, ControlRenderer> = {
  listingActionBar: product(BloomActionBar, {
    lengths: ['bottomInset'],
    own: (d) => ({
      loading: d.own('loading')?.value,
      primaryDisabled: d.own('disabled')?.value,
    }),
  }),
  mortgageCalculator: product(BloomMortgageCalculator, {
    slots: ['disclaimer'],
    lengths: ['maxWidth'],
    own: (d) => ({ layout: d.own('style')?.value }),
  }),
  rentalActionCard: product(BloomRentalActionCard, { slots: ['note', 'footer'], ...loading }),
  saleActionCard: product(BloomSaleActionCard, { slots: ['note', 'footer'], ...loading }),
};
