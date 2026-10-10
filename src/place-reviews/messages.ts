import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the place-reviews family draws or announces, in each
 * Bloom language. A caller's `*Label` and `format*` props still win.
 */
export interface PlaceReviewsMessages {
  /** `PlaceReviewCard`'s chips. */
  depositReturned: string;
  depositNotReturned: string;
  recommend: string;
  notRecommend: string;
  /** `PlaceReviewCard`'s footer. */
  helpful: string;
  report: string;
  /** `WriteReviewPrompt`. */
  promptTitle: string;
  promptDescription: (building: string) => string;
  writeReview: string;
  /** `PlaceReviewSummary`'s lines. */
  reviewCount: (count: number) => string;
  depositRate: (percent: number) => string;
  recommendRate: (percent: number) => string;
}

export const PLACE_REVIEWS_MESSAGES: MessageCatalog<PlaceReviewsMessages> =
  defineMessages<PlaceReviewsMessages>('PLACE_REVIEWS_MESSAGES', {
    depositReturned: 'Deposit returned',
    depositNotReturned: 'Deposit not returned',
    recommend: 'Would recommend',
    notRecommend: "Wouldn't recommend",
    helpful: 'Helpful',
    report: 'Report',
    promptTitle: 'Did you live here?',
    promptDescription: (building) => `Help future tenants of ${building}. Reviews are anonymous.`,
    writeReview: 'Write a review',
    reviewCount: (n) => plural('en', n, { one: '{n} review', other: '{n} reviews' }),
    depositRate: (percent) => `Deposit returned in ${percent}% of tenancies`,
    recommendRate: (percent) => `${percent}% would recommend living here`,
  });
