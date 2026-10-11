import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { ZoomableMediaGalleryLabels } from './types';

/**
 * Every fixed string the media viewer announces, in each Bloom language. A
 * caller's `labels` still wins over any entry.
 */
export const ZOOMABLE_MEDIA_GALLERY_MESSAGES: MessageCatalog<ZoomableMediaGalleryLabels> =
  defineMessages<ZoomableMediaGalleryLabels>('ZOOMABLE_MEDIA_GALLERY_MESSAGES', {
    close: 'Close media viewer',
    previous: 'Previous item',
    next: 'Next item',
    goTo: (i, n) => `Go to item ${i} of ${n}`,
    share: 'Share media',
  });
