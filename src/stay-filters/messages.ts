import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { FloorOption, HousingFeature, PropertyType } from './types';

/**
 * Every fixed string the stay-filters family draws or announces, in each Bloom
 * language: the built-in option labels, the groups' names, the field labels
 * and the energy-rating summary. "Show more" / "Show less" come from
 * `COMMON_MESSAGES`. A caller's `labels` / `*Label` props (and its own
 * `options`) still win over any entry here.
 */
export interface StayFiltersMessages {
  /** The eight built-in tiles (`penthouse` is a value, not a built-in tile). */
  propertyTypes: Record<Exclude<PropertyType, 'penthouse'>, string>;
  features: Record<HousingFeature, string>;
  floors: Record<FloorOption, string>;
  /** The lower and upper field of a range, and its thumbs' names. */
  minimum: string;
  maximum: string;
  priceRange: string;
  area: string;
  /** Group names. */
  featuresGroup: string;
  floor: string;
  propertyType: string;
  energyRating: string;
  /** `EnergyRatingFilter`'s line under the letters. */
  anyRating: string;
  ratingOnly: (rating: string) => string;
  ratingAndBetter: (rating: string) => string;
  /** `FilterTriggerButton`'s text, and its name while filters apply. */
  filters: string;
  filtersApplied: (label: string, count: number) => string;
  clearAll: string;
  /** `CountFilter`'s no-preference chip. */
  any: string;
  /** `AvailabilityFilter`. */
  availableNow: string;
  availableNowDescription: string;
  availableFrom: string;
  anyDate: string;
}

export const STAY_FILTERS_MESSAGES: MessageCatalog<StayFiltersMessages> =
  defineMessages<StayFiltersMessages>('STAY_FILTERS_MESSAGES', {
    propertyTypes: {
      apartment: 'Apartment',
      house: 'House',
      room: 'Room',
      studio: 'Studio',
      duplex: 'Duplex / Penthouse',
      coliving: 'Coliving',
      hostel: 'Hostel',
      other: 'Land / Other',
    },
    features: {
      elevator: 'Elevator',
      parking: 'Parking',
      terrace: 'Terrace',
      garden: 'Garden',
      pool: 'Pool',
      furnished: 'Furnished',
      pets: 'Pets allowed',
      airConditioning: 'Air conditioning',
      heating: 'Heating',
      accessible: 'Accessible',
      storage: 'Storage room',
    },
    floors: { ground: 'Ground', middle: 'Middle', top: 'Top', elevator: 'With elevator' },
    minimum: 'Minimum',
    maximum: 'Maximum',
    priceRange: 'Price range',
    area: 'Area',
    featuresGroup: 'Features',
    floor: 'Floor',
    propertyType: 'Property type',
    energyRating: 'Energy rating',
    anyRating: 'Any rating',
    ratingOnly: (r) => `${r} only`,
    ratingAndBetter: (r) => `${r} and better`,
    filters: 'Filters',
    filtersApplied: (label, n) => `${label}, ${n} applied`,
    clearAll: 'Clear all',
    any: 'Any',
    availableNow: 'Available now',
    availableNowDescription: 'Ready to move in today',
    availableFrom: 'Available from',
    anyDate: 'Any date',
  });
