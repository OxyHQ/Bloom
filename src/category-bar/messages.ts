import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The names of `CategoryBar`'s web scroll arrows, in each Bloom language. A
 * caller's `previousLabel`/`nextLabel` still wins.
 */
export interface CategoryBarMessages {
  previous: string;
  next: string;
}

export const CATEGORY_BAR_MESSAGES: MessageCatalog<CategoryBarMessages> = defineMessages<CategoryBarMessages>('CATEGORY_BAR_MESSAGES', { previous: 'Previous categories', next: 'Next categories' });
