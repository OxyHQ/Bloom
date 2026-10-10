import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The alerts card's fixed words in each Bloom language. `title` and `countCaption` still win. */
export interface ImportantAlertsCardMessages {
  title: string;
  /** The caption after the count. */
  thisWeek: string;
}

export const IMPORTANT_ALERTS_CARD_MESSAGES: MessageCatalog<ImportantAlertsCardMessages> =
  defineMessages<ImportantAlertsCardMessages>('IMPORTANT_ALERTS_CARD_MESSAGES', {
    title: 'Important alerts',
    thisWeek: 'this week',
  });
