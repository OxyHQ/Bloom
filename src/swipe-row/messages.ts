import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The swipe row's fixed strings, in each Bloom language. A caller's
 * `closeLabel` still wins.
 */
export interface SwipeRowMessages {
  /** Names the tap target that closes an open pane. */
  closeActions: string;
}

export const SWIPE_ROW_MESSAGES: MessageCatalog<SwipeRowMessages> = defineMessages<SwipeRowMessages>('SWIPE_ROW_MESSAGES', {
  closeActions: 'Close actions',
});
