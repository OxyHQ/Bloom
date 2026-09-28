import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { PlaceOpenState } from './types';
import { countOf, withReviews } from './message-helpers';

/**
 * Every fixed string the place-card family draws or announces, in each Bloom
 * language. A caller's `openLabel`/`newLabel`/`accessibilityLabel` still wins.
 */
export interface PlaceCardMessages {
  /** The state pill. */
  openStates: Readonly<Record<PlaceOpenState, string>>;
  /** An unrated place, in place of its rating. */
  new: string;
  /** Names `PlaceActions`' row. */
  actions: string;
  /** Names a card's action row after its place: "Forner de la Plaça actions". */
  actionsFor: (name: string) => string;
  /**
   * "Rated 4.6 out of 5, 318 reviews". `value` arrives formatted; `reviews` is
   * a count, or the app's own pre-formatted one ("1.2k").
   */
  rated: (value: string, reviews?: number | string) => string;
}

export const PLACE_CARD_MESSAGES: MessageCatalog<PlaceCardMessages> = defineMessages<PlaceCardMessages>('PLACE_CARD_MESSAGES', {
  openStates: {
    open: 'Open',
    'closing-soon': 'Closing soon',
    closed: 'Closed',
    'opening-soon': 'Opens soon',
  },
  new: 'New',
  actions: 'Actions',
  actionsFor: (name) => `${name} actions`,
  rated: (value, reviews) =>
    withReviews(
      `Rated ${value} out of 5`,
      reviews === undefined ? undefined : countOf('en', reviews, { one: '{n} review', other: '{n} reviews' }),
    ),
});
