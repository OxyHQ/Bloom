import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { ListingStatus } from './types';

/**
 * Every fixed string the listing-card family draws or announces, in each Bloom
 * language. "Loading" comes from `COMMON_MESSAGES`; a caller's `*Label` props
 * still win over any entry here.
 */
export interface ListingCardMessages {
  /** The status pill. `available` draws nothing. */
  statuses: Record<Exclude<ListingStatus, 'available'>, string>;
  /** Appended to a price line's name: "originally €250,000". */
  originally: (price: string) => string;
  approximateLocation: string;
  /** The card's name for a rated stay: "Rated 4.92 out of 5". */
  rated: (rating: string) => string;
  /** The same with a review count, which may arrive pre-formatted ("1,204"). */
  ratedWithReviews: (rating: string, reviews: string) => string;
  /** An unrated stay. */
  newListing: string;
  previousPhoto: string;
  nextPhoto: string;
  saveToWishlist: string;
  removeFromWishlist: string;
}

export const LISTING_CARD_MESSAGES: MessageCatalog<ListingCardMessages> =
  defineMessages<ListingCardMessages>('LISTING_CARD_MESSAGES', {
    statuses: { reserved: 'Reserved', sold: 'Sold', rented: 'Rented', unavailable: 'Unavailable' },
    originally: (p) => `originally ${p}`,
    approximateLocation: 'Approximate location',
    rated: (r) => `Rated ${r} out of 5`,
    ratedWithReviews: (r, c) =>
      plural('en', c, {
        one: `Rated ${r} out of 5, ${c} review`,
        other: `Rated ${r} out of 5, ${c} reviews`,
      }),
    newListing: 'New',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    saveToWishlist: 'Save to wishlist',
    removeFromWishlist: 'Remove from wishlist',
  });
