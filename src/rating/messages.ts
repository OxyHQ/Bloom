import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import { countForms } from './message-helpers';

/**
 * Every fixed string the rating family draws or announces, in each Bloom
 * language. `reviewsLabel`, `newLabel` and `formatStarLabel` still win.
 */
export interface RatingMessages {
  /** Drawn in place of the value when there is no rating yet. */
  newRating: string;
  /** The count and its word, "128 reviews". `count` is drawn exactly as given ("1.2k" too). */
  reviews: (count: number | string) => string;
  /** The accessible name of a rated `Rating`: "Rated 4.9 out of 5". */
  rated: (value: string) => string;
  /** The same with the count's words (`reviews(…)` or the caller's) appended. */
  ratedWithReviews: (value: string, reviews: string) => string;
  /** `RatingInput`'s name for one star: "4 stars". */
  star: (value: number, max: number) => string;
}

export const RATING_MESSAGES: MessageCatalog<RatingMessages> = defineMessages<RatingMessages>('RATING_MESSAGES', {
  newRating: 'New',
  reviews: (c) => countForms('en', c, { one: '{n} review', other: '{n} reviews' }),
  rated: (v) => `Rated ${v} out of 5`,
  ratedWithReviews: (v, r) => `Rated ${v} out of 5, ${r}`,
  star: (n) => plural('en', n, { one: '{n} star', other: '{n} stars' }),
});
