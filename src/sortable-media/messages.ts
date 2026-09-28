import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the sortable photo grid draws or announces, in each
 * Bloom language. The retry button's visible "Retry" is the common word. A
 * caller's `labels`/`accessibilityLabel` still wins over any entry.
 */
export interface SortableMediaMessages {
  photo: (position: number, total: number) => string;
  cover: string;
  moveEarlier: (position: number) => string;
  moveLater: (position: number) => string;
  remove: (position: number) => string;
  retry: (position: number) => string;
  uploading: (position: number) => string;
  failed: string;
  add: string;
  moved: (position: number, total: number) => string;
  photos: string;
}

export const SORTABLE_MEDIA_MESSAGES: MessageCatalog<SortableMediaMessages> = defineMessages<SortableMediaMessages>('SORTABLE_MEDIA_MESSAGES', {
  photo: (p, t) => `Photo ${p} of ${t}`,
  cover: 'Cover',
  moveEarlier: (p) => `Move photo ${p} earlier`,
  moveLater: (p) => `Move photo ${p} later`,
  remove: (p) => `Remove photo ${p}`,
  retry: (p) => `Retry uploading photo ${p}`,
  uploading: (p) => `Uploading photo ${p}`,
  failed: 'Upload failed',
  add: 'Add photos',
  moved: (p, t) => `Moved to position ${p} of ${t}`,
  photos: 'Photos',
});
