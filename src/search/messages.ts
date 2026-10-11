import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * `Search`'s own words, in each Bloom language. The field's name is the
 * common "Search"; `label` still wins over it.
 */
export interface SearchMessages {
  /** The clear (✕) button's name. */
  clearQuery: string;
}

export const SEARCH_MESSAGES: MessageCatalog<SearchMessages> = defineMessages<SearchMessages>(
  'SEARCH_MESSAGES',
  { clearQuery: 'Clear search query' },
);
