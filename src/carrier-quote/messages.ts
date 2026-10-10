import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { CarrierQuoteMark, CarrierQuoteSort } from './types';

/**
 * Every fixed string the carrier-quote card and list draw or announce, in each
 * Bloom language. `labels` has the shape of `CARRIER_QUOTE_LABELS` (the English
 * entry); a caller's `labels` / `emptyTitle` / `accessibilityLabel` still win.
 */
export interface CarrierQuoteMessages {
  labels: {
    accept: string;
    message: string;
    decline: string;
    pickup: string;
    eta: string;
    vehicle: string;
    jobs: (jobs: string) => string;
    verified: string;
    marks: Record<CarrierQuoteMark, string>;
    showPrice: string;
    hidePrice: string;
    /** Kept for the `labels.priceDetails` override; the default name is `priceDetailsFor`. */
    priceDetails: string;
    sort: string;
    sortOptions: Record<CarrierQuoteSort, string>;
    count: (count: number) => string;
    loading: string;
  };
  emptyTitle: string;
  emptyDescription: string;
  /** Names the list. */
  list: string;
  /** Names a card's price-breakdown toggle, as one phrase per language. */
  priceDetailsFor: (name: string) => string;
}

export const CARRIER_QUOTE_MESSAGES: MessageCatalog<CarrierQuoteMessages> =
  defineMessages<CarrierQuoteMessages>('CARRIER_QUOTE_MESSAGES', {
    labels: {
      accept: 'Accept',
      message: 'Message',
      decline: 'Decline',
      pickup: 'Pick-up',
      eta: 'Arrives',
      vehicle: 'Vehicle',
      jobs: (jobs) => `${jobs} jobs`,
      verified: 'Verified carrier',
      marks: { cheapest: 'Cheapest', fastest: 'Fastest' },
      showPrice: 'Show price details',
      hidePrice: 'Hide price details',
      priceDetails: 'Price details for',
      sort: 'Sort offers',
      sortOptions: { price: 'Cheapest', eta: 'Fastest', rating: 'Best rated' },
      count: (n) => plural('en', n, { one: '{n} offer', other: '{n} offers' }),
      loading: 'Loading offers',
    },
    emptyTitle: 'No offers yet',
    emptyDescription:
      'Carriers are looking at your job. The first offers usually arrive within a few minutes.',
    list: 'Offers',
    priceDetailsFor: (name) => `Price details for ${name}`,
  });
