import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the listing-details family draws or announces, in each
 * Bloom language. "Show more" / "Show less" come from `COMMON_MESSAGES`; a
 * component's own `*Label` props still win over any entry here.
 */
export interface ListingDetailsMessages {
  /** A star rating's name: "Rated 4.92 out of 5". */
  ratedOutOf5: (rating: string) => string;
  overallRating: string;
  unavailable: string;
  showAllAmenities: (count: number) => string;
  showAllFeatures: (count: number) => string;
  propertyFeatures: string;
  showAllPhotos: string;
  listingPhotos: string;
  /** A photo with no `alt`: "Photo 2 of 5". */
  photoOf: (position: number, total: number) => string;
  /** "Terrace, photo 2 of 5". */
  photoWithAlt: (alt: string, position: number, total: number) => string;
  /** "Ground floor, floor plan 1 of 2". */
  floorPlanOf: (name: string, position: number, total: number) => string;
  landlord: string;
  agent: string;
  agency: string;
  activeListings: (count: number) => string;
  verified: string;
  showPhone: string;
  call: string;
  messageHost: string;
  message: string;
}

export const LISTING_DETAILS_MESSAGES: MessageCatalog<ListingDetailsMessages> =
  defineMessages<ListingDetailsMessages>('LISTING_DETAILS_MESSAGES', {
    ratedOutOf5: (r) => `Rated ${r} out of 5`,
    overallRating: 'Overall rating',
    unavailable: 'Unavailable',
    showAllAmenities: (n) =>
      plural('en', n, { one: 'Show {n} amenity', other: 'Show all {n} amenities' }),
    showAllFeatures: (n) =>
      plural('en', n, { one: 'Show {n} feature', other: 'Show all {n} features' }),
    propertyFeatures: 'Property features',
    showAllPhotos: 'Show all photos',
    listingPhotos: 'Listing photos',
    photoOf: (p, t) => `Photo ${p} of ${t}`,
    photoWithAlt: (a, p, t) => `${a}, photo ${p} of ${t}`,
    floorPlanOf: (a, p, t) => `${a}, floor plan ${p} of ${t}`,
    landlord: 'Landlord',
    agent: 'Agent',
    agency: 'Agency',
    activeListings: (n) =>
      plural('en', n, { one: '{n} active listing', other: '{n} active listings' }),
    verified: 'Verified',
    showPhone: 'Show phone',
    call: 'Call',
    messageHost: 'Message host',
    message: 'Message',
  });
