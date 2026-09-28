import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { AddressPrecision, OfferingEditorLabels, PropertyType } from './types';

/**
 * Every fixed string the listing-editor family draws or announces, in each
 * Bloom language. A caller's `labels`, `options`, `*Label`, `title`,
 * `description`, `footnote` and `summary` props still win over any entry here.
 */
export interface ListingEditorMessages {
  /** `OfferingEditor`'s whole copy; its `labels` prop overrides key by key. */
  offering: OfferingEditorLabels;
  /** `PropertyTypeSelector`'s built-in tiles. */
  propertyTypes: Record<PropertyType, string>;
  propertyType: string;
  /** `AddressPrecisionPicker`'s built-in cards. */
  addressPrecision: Record<AddressPrecision, { title: string; description: string }>;
  addressPrecisionLabel: string;
  addressPrecisionFootnote: string;
  /** `ListingQualityMeter`. */
  qualityTitle: string;
  qualityScore: string;
  tips: string;
  todo: string;
  /** The line under the title, by score: under 50, under 80, from 80. */
  needsWork: string;
  good: string;
  excellent: string;
  /** `ListingPreviewPane`. */
  previewTitle: string;
  previewDescription: string;
  card: string;
  page: string;
  previewAs: string;
  /**
   * The page preview's review count. `count` picks the plural form; `shown` is
   * what is drawn (the count itself, or an app's pre-formatted "1.2k").
   */
  reviews: (count: number, shown: string) => string;
}

export const LISTING_EDITOR_MESSAGES: MessageCatalog<ListingEditorMessages> = defineMessages<ListingEditorMessages>('LISTING_EDITOR_MESSAGES', {
  offering: {
    rent: { title: 'For rent', description: 'Long-term tenancy, priced by the month.' },
    sale: { title: 'For sale', description: 'Sell the home outright.' },
    stay: { title: 'Vacation rental', description: 'Short stays, priced by the night.' },
    swap: { title: 'Home swap', description: 'Exchange homes with other members.' },
    monthlyRent: 'Monthly rent',
    deposit: 'Deposit',
    depositOption: (months) => (months === 0 ? 'None' : plural('en', months, { one: '{n} month', other: '{n} months' })),
    availableFrom: 'Available from',
    minimumStay: 'Minimum stay',
    months: (months) => plural('en', months, { one: '{n} month', other: '{n} months' }),
    askingPrice: 'Asking price',
    pricePerArea: 'Price per m²',
    pricePerAreaEmpty: 'Add a price',
    nightlyRate: 'Nightly rate',
    cleaningFee: 'Cleaning fee',
    minimumNights: 'Minimum nights',
    nights: (nights) => plural('en', nights, { one: '{n} night', other: '{n} nights' }),
    swapMode: 'How would you like to exchange?',
    swapModes: { swap: 'Swap homes', host: 'Host only', both: 'Either' },
    group: 'How is the home offered?',
  },
  propertyTypes: {
    apartment: 'Apartment',
    house: 'House',
    room: 'Room',
    studio: 'Studio',
    duplex: 'Duplex',
    penthouse: 'Penthouse',
    coliving: 'Coliving',
    hostel: 'Hostel',
    other: 'Other',
  },
  propertyType: 'Property type',
  addressPrecision: {
    exact: {
      title: 'Exact address',
      description: 'The pin sits on the building. Best for homes that are easy to find anyway.',
    },
    street: {
      title: 'Street only',
      description: 'Shows the street, not the number. The exact address is shared after booking or signing.',
    },
    approximate: {
      title: 'Approximate area',
      description: 'Shows a circle of about 500 m. The most private option.',
    },
  },
  addressPrecisionLabel: 'Address precision',
  addressPrecisionFootnote:
    'The published map follows this choice. Your exact address is only shared with people you confirm.',
  qualityTitle: 'Listing quality',
  qualityScore: 'Listing quality score',
  tips: 'Tips',
  todo: 'To do',
  needsWork: 'Needs work',
  good: 'Good',
  excellent: 'Excellent',
  previewTitle: 'Preview',
  previewDescription: 'This is how guests will see your listing.',
  card: 'Card',
  page: 'Page',
  previewAs: 'Preview as',
  reviews: (n, shown) => plural('en', n, { one: '{s} review', other: '{s} reviews' }).replace('{s}', shown),
});
