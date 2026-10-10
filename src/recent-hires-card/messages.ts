import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The recent-hires card's fixed words in each Bloom language. `title` still wins. */
export interface RecentHiresCardMessages {
  title: string;
}

export const RECENT_HIRES_CARD_MESSAGES: MessageCatalog<RecentHiresCardMessages> =
  defineMessages<RecentHiresCardMessages>('RECENT_HIRES_CARD_MESSAGES', { title: 'Recent hires' });
