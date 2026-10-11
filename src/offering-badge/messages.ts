import type { Offering } from '../listing-card/types';
import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The word each offering is drawn with, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface OfferingBadgeMessages {
  offerings: Record<Offering, string>;
}

export const OFFERING_BADGE_MESSAGES: MessageCatalog<OfferingBadgeMessages> =
  defineMessages<OfferingBadgeMessages>('OFFERING_BADGE_MESSAGES', {
    offerings: {
      long_term_rent: 'For rent',
      sale: 'For sale',
      short_term_rent: 'Vacation rental',
      exchange: 'Swap',
    },
  });
