import type { DateFlexibilityOption, GuestKind, StaySearchBarLabels } from './types';

/**
 * Geometry shared by the stay-search parts.
 *
 *   bar height              66 (1px hairline included), full pill
 *   segment padding-left    32 for the first segment, 24 for the rest
 *   separator               1 × 32, hidden beside a hovered or open segment
 *   search button           Button primary large (44), 10 from the bar's edge
 *   panel                   radius 32, 12 below the bar
 *   compact trigger         56 tall, full pill
 *   step card               radius 20; collapsed row 56 tall
 */
export const STAY_SEARCH_BAR_HEIGHT = 66;
export const STAY_SEARCH_SEPARATOR_HEIGHT = 32;
export const STAY_SEARCH_BUTTON_INSET = 10;
export const STAY_SEARCH_PANEL_RADIUS = 32;
export const STAY_SEARCH_PANEL_OFFSET = 12;
export const STAY_SEARCH_COMPACT_HEIGHT = 56;
export const STAY_SEARCH_STEP_RADIUS = 20;
export const STAY_SEARCH_TILE_SIZE = 48;
export const STAY_SEARCH_TILE_RADIUS = 12;

export const DEFAULT_STAY_SEARCH_BAR_LABELS: StaySearchBarLabels = {
  where: 'Where',
  checkIn: 'Check in',
  checkOut: 'Check out',
  when: 'When',
  who: 'Who',
  destinationPlaceholder: 'Search destinations',
  datesPlaceholder: 'Add dates',
  guestsPlaceholder: 'Add guests',
  search: 'Search',
};

export const DEFAULT_GUEST_LABELS: Record<GuestKind, string> = {
  adults: 'Adults',
  children: 'Children',
  infants: 'Infants',
  pets: 'Pets',
};

export const DEFAULT_GUEST_DESCRIPTIONS: Record<GuestKind, string> = {
  adults: 'Ages 13 or above',
  children: 'Ages 2 – 12',
  infants: 'Under 2',
  pets: 'Bringing a service animal?',
};

export const GUEST_KINDS: readonly GuestKind[] = ['adults', 'children', 'infants', 'pets'];

export const DEFAULT_DATE_FLEXIBILITY_OPTIONS: readonly DateFlexibilityOption[] = [
  { value: 'exact', label: 'Exact dates' },
  { value: '1', label: '± 1 day' },
  { value: '2', label: '± 2 days' },
  { value: '3', label: '± 3 days' },
  { value: '7', label: '± 7 days' },
];
