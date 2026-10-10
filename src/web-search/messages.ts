import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `WebSearch` draws or announces, in each Bloom language.
 * The `labels` and `working` props still win over these.
 */
export interface WebSearchMessages {
  /** The collapsible sources row. */
  sources: string;
  /** The indicator trailing the log while it runs. */
  working: string;
}

export const WEB_SEARCH_MESSAGES: MessageCatalog<WebSearchMessages> =
  defineMessages<WebSearchMessages>('WEB_SEARCH_MESSAGES', {
    sources: 'Sources',
    working: 'Working',
  });
