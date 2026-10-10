import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The pagination's own fixed strings, in each Bloom language; Previous and
 * Next are the common words. A caller's `accessibilityLabel` / `getPageLabel`
 * still wins.
 */
export interface PaginationMessages {
  /** Names the navigation landmark. */
  pagination: string;
  /** Names a page button. */
  goToPage: (page: number) => string;
}

export const PAGINATION_MESSAGES: MessageCatalog<PaginationMessages> =
  defineMessages<PaginationMessages>('PAGINATION_MESSAGES', {
    pagination: 'Pagination',
    goToPage: (page) => `Go to page ${page}`,
  });
