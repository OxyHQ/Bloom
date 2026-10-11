import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the media-shelf family draws or announces, in each Bloom
 * language. Previous/next come from the common words; a caller's `*Label`
 * prop still wins over any entry.
 */
export interface MediaShelfMessages {
  /** `FilterChips`' group name. */
  filters: string;
  /** `Shelf`'s header link. */
  showAll: string;
}

export const MEDIA_SHELF_MESSAGES: MessageCatalog<MediaShelfMessages> =
  defineMessages<MediaShelfMessages>('MEDIA_SHELF_MESSAGES', {
    filters: 'Filters',
    showAll: 'Show all',
  });
