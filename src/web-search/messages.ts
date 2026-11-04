import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `WebSearch` draws or announces, in each Bloom language,
 * beside `COMMON_MESSAGES.working`. The `labels` and `working` props still win.
 */
export interface WebSearchMessages {
  /** The collapsible sources row. */
  sources: string;
}

export const WEB_SEARCH_MESSAGES: MessageCatalog<WebSearchMessages> =
  defineMessages<WebSearchMessages>('WEB_SEARCH_MESSAGES', {
    sources: 'Sources',
  });
