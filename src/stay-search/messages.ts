import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { GuestKind } from './types';

/**
 * Every fixed string the stay-search family draws or announces, in each Bloom
 * language. The search button's "Search" is `COMMON_MESSAGES.search`; a
 * caller's `labels` / `*Label` props still win over any entry here.
 */
export interface StaySearchMessages {
  /** `StaySearchBar`'s segment labels and placeholders (also `HOME_SEARCH_SEGMENTS.stays`). */
  where: string;
  checkIn: string;
  checkOut: string;
  when: string;
  who: string;
  destinationPlaceholder: string;
  datesPlaceholder: string;
  guestsPlaceholder: string;
  /** `GuestPicker`'s row titles and descriptions. */
  guests: Record<GuestKind, string>;
  guestDescriptions: Record<GuestKind, string>;
  /** `DateFlexibilityChips`: the group's name and its options. */
  dateFlexibility: string;
  exactDates: string;
  plusMinusDays: (days: number) => string;
  /** `DestinationSuggestions`' list name when there is no heading. */
  destinations: string;
  /** `StaySearchCompact`'s title and its filter button's name. */
  whereTo: string;
  filters: string;
}

export const STAY_SEARCH_MESSAGES: MessageCatalog<StaySearchMessages> =
  defineMessages<StaySearchMessages>('STAY_SEARCH_MESSAGES', {
    where: 'Where',
    checkIn: 'Check in',
    checkOut: 'Check out',
    when: 'When',
    who: 'Who',
    destinationPlaceholder: 'Search destinations',
    datesPlaceholder: 'Add dates',
    guestsPlaceholder: 'Add guests',
    guests: { adults: 'Adults', children: 'Children', infants: 'Infants', pets: 'Pets' },
    guestDescriptions: {
      adults: 'Ages 13 or above',
      children: 'Ages 2 – 12',
      infants: 'Under 2',
      pets: 'Bringing a service animal?',
    },
    dateFlexibility: 'Date flexibility',
    exactDates: 'Exact dates',
    plusMinusDays: (n) => plural('en', n, { one: '± {n} day', other: '± {n} days' }),
    destinations: 'Destinations',
    whereTo: 'Where to?',
    filters: 'Filters',
  });
