import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { LeadScoreBand } from './types';

/**
 * The lead score card's fixed words in each Bloom language. `title`,
 * `factorsLabel` and `bandLabel` still win.
 */
export interface LeadScoreMessages {
  title: string;
  /** The heading over the factors. */
  factors: string;
  /** Each band's word, drawn under the score. */
  bands: Record<LeadScoreBand, string>;
}

export const LEAD_SCORE_MESSAGES: MessageCatalog<LeadScoreMessages> =
  defineMessages<LeadScoreMessages>('LEAD_SCORE_MESSAGES', {
    title: 'Lead score',
    factors: 'What it is made of',
    bands: { cold: 'Cold', warm: 'Warm', hot: 'Hot' },
  });
