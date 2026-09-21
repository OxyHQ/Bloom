import { RADIUS } from '../design-tokens/scales';
import type { AccentTone } from '../theme/accent-colors';
import type { CarrierQuoteLabels, CarrierQuoteMark, CarrierQuoteSort } from './types';

/** Every default word the card and the list draw. */
export const CARRIER_QUOTE_LABELS: Required<
  Omit<CarrierQuoteLabels, 'marks' | 'sortOptions'>
> & {
  marks: Record<CarrierQuoteMark, string>;
  sortOptions: Record<CarrierQuoteSort, string>;
} = {
  accept: 'Accept',
  message: 'Message',
  decline: 'Decline',
  pickup: 'Pick-up',
  eta: 'Arrives',
  vehicle: 'Vehicle',
  jobs: (jobs: string) => `${jobs} jobs`,
  verified: 'Verified carrier',
  marks: { cheapest: 'Cheapest', fastest: 'Fastest' },
  showPrice: 'Show price details',
  hidePrice: 'Hide price details',
  priceDetails: 'Price details for',
  sort: 'Sort offers',
  sortOptions: { price: 'Cheapest', eta: 'Fastest', rating: 'Best rated' },
  count: (count: number) => (count === 1 ? '1 offer' : `${count} offers`),
  loading: 'Loading offers',
};

/**
 * The tone each mark is painted in.
 *
 * Two marks, two different things: money is `success` because a lower number is
 * unambiguously in the reader's favour, time is `info` because "fastest" is a
 * fact rather than a recommendation — a reader who is not in a hurry should not
 * see it painted as the good answer.
 */
export const CARRIER_QUOTE_MARK_TONE: Record<CarrierQuoteMark, AccentTone> = {
  cheapest: 'success',
  fastest: 'info',
};

/** The order the marks are drawn in, so two marked quotes never disagree. */
export const CARRIER_QUOTE_MARK_ORDER: readonly CarrierQuoteMark[] = ['cheapest', 'fastest'];

/** The three orders a list offers, in the order they are drawn. */
export const CARRIER_QUOTE_SORTS: readonly CarrierQuoteSort[] = ['price', 'eta', 'rating'];

/**
 * The card's geometry, as numbers rather than as prose.
 *
 * `narrowWidth` is the card's OWN width under which the actions drop their
 * labels to glyphs and the tiles stack two by two — one measurement for both,
 * because a card too narrow for three tiles is too narrow for three labelled
 * buttons beside a 48 mark. `avatar` is the mark: 48 on the card, 36 in a
 * compact row, which is the rung a list item uses everywhere else in Bloom.
 */
export const CARRIER_QUOTE_GEOMETRY = {
  padding: 16,
  gap: 16,
  tileGap: 8,
  tilePadding: 12,
  tileRadius: RADIUS['radius-12'],
  radius: RADIUS['radius-20'],
  narrowWidth: 420,
  avatar: { comfortable: 48, compact: 36 },
  rowMinHeight: 64,
  /** The drawn size of an action; a `hitSlop` takes it to 44 for a thumb. */
  actionHit: { top: 6, bottom: 6, left: 6, right: 6 },
} as const;

export type CarrierQuoteGeometry = typeof CARRIER_QUOTE_GEOMETRY;
