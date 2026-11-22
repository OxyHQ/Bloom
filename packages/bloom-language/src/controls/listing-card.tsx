import {
  ListingCard as BloomListingCard,
  ListingCardGrid as BloomListingCardGrid,
  type ListingCardProps,
  WishlistCard as BloomWishlistCard,
  type WishlistCardProps,
} from '@oxy.so/bloom/listing-card';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ColorToken, ControlDensity, ListingCardLayout } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** A listing in a search's results: its card, the grid of cards, a wishlist. */
export type ListingCardKind = 'listingCard' | 'listingCardGrid' | 'wishlistCard';

/** What the node draws itself: its box, its name and press, its look. */
type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'onPress' | 'onLongPress';

export type ListingCardOptions = Omit<
  ListingCardProps,
  Drawn | 'title' | 'photos' | 'layout' | 'density' | 'loading' | 'badge'
> & { readonly badge?: Child };
export type WishlistCardOptions = Omit<
  WishlistCardProps,
  Drawn | 'name' | 'photos' | 'color' | 'empty'
> & { readonly empty?: Child };

/** Bloom `ListingCard`: a listing's photos, words and price; `.onPress()` opens it. */
export interface ListingCardView extends ViewModifiers<ListingCardView> {
  /** `vertical` (default): the photo over the words; `horizontal`: beside them. */
  style(value: ListingCardLayout): ListingCardView;
  /** `default` (Bloom's `comfortable`) or `compact`, for a dense list. */
  density(value: ControlDensity): ListingCardView;
  /** Its skeleton, while the listing loads. */
  loading(value?: boolean): ListingCardView;
}
/** Bloom `ListingCardGrid`: listing cards in the columns the window's width gives. */
export interface ListingCardGridView extends ViewModifiers<ListingCardGridView> {
  /** `default` (Bloom's `results`) or `compact`. */
  density(value: ControlDensity): ListingCardGridView;
}
/** Bloom `WishlistCard`: a saved list's cover and name; `.onPress()` opens it. */
export interface WishlistCardView extends ViewModifiers<WishlistCardView> {
  /** The list's colour: its glyph, and its cover while it is empty. */
  tint(value: ColorToken): WishlistCardView;
}

/** Bloom `ListingCard` of the listing titled `title`, its `photos` first to last. */
export function ListingCard(
  title: string,
  photos: readonly string[],
  options: ListingCardOptions = {},
): ListingCardView {
  return new Node('listingCard', { title, photos, options }, []);
}
/** Bloom `ListingCardGrid` of `cards` (a list of `ListingCard`s, keyed by `.id()`). */
export function ListingCardGrid(cards: Child): ListingCardGridView {
  return new Node('listingCardGrid', {}, [cards]);
}
/** Bloom `WishlistCard` of the list named `name`, its cover from `photos`. */
export function WishlistCard(
  name: string,
  photos: readonly string[],
  options: WishlistCardOptions = {},
): WishlistCardView {
  return new Node('wishlistCard', { name, photos, options }, []);
}

/** The language's density as Bloom names it for this component: `default` is `fallback`. */
const density = (d: ControlDraw, fallback: string) => {
  const value = d.own('density')?.value;
  return value === undefined ? undefined : value === 'default' ? fallback : value;
};

export const LISTING_CARDS: Record<ListingCardKind, ControlRenderer> = {
  listingCard: product(BloomListingCard, {
    slots: ['badge'],
    press: true,
    own: (d) => ({
      layout: d.own('style')?.value,
      density: density(d, 'comfortable'),
      loading: d.own('loading')?.value,
    }),
  }),
  listingCardGrid: product(BloomListingCardGrid, {
    own: (d) => ({ density: density(d, 'results') }),
  }),
  wishlistCard: product(BloomWishlistCard, {
    slots: ['empty'],
    press: true,
    colors: (d) => ({ color: d.own('tint')?.value as ColorToken | undefined }),
  }),
};
