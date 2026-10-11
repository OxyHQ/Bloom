import { COMMON_MESSAGES } from '../locale/common-messages';
import { STAY_SEARCH_MESSAGES, type StaySearchMessages } from './messages';
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

/** A bar's labels in one language; the search button's word comes from the common catalog. */
export function staySearchBarLabels(
  messages: StaySearchMessages,
  search: string,
): StaySearchBarLabels {
  const {
    where,
    checkIn,
    checkOut,
    when,
    who,
    destinationPlaceholder,
    datesPlaceholder,
    guestsPlaceholder,
  } = messages;
  return {
    where,
    checkIn,
    checkOut,
    when,
    who,
    destinationPlaceholder,
    datesPlaceholder,
    guestsPlaceholder,
    search,
  };
}

/** The English labels. The components read the locale's catalog instead. */
export const DEFAULT_STAY_SEARCH_BAR_LABELS: StaySearchBarLabels = staySearchBarLabels(
  STAY_SEARCH_MESSAGES.en,
  COMMON_MESSAGES.en.search,
);

export const DEFAULT_GUEST_LABELS: Record<GuestKind, string> = STAY_SEARCH_MESSAGES.en.guests;

export const DEFAULT_GUEST_DESCRIPTIONS: Record<GuestKind, string> =
  STAY_SEARCH_MESSAGES.en.guestDescriptions;

export const GUEST_KINDS: readonly GuestKind[] = ['adults', 'children', 'infants', 'pets'];

/** Exact, ± 1, ± 2, ± 3, ± 7 days in one language. */
export function dateFlexibilityOptions(messages: StaySearchMessages): DateFlexibilityOption[] {
  return [
    { value: 'exact', label: messages.exactDates },
    ...[1, 2, 3, 7].map((n) => ({ value: String(n), label: messages.plusMinusDays(n) })),
  ];
}

export const DEFAULT_DATE_FLEXIBILITY_OPTIONS: readonly DateFlexibilityOption[] =
  dateFlexibilityOptions(STAY_SEARCH_MESSAGES.en);
