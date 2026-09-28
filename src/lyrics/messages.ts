import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the lyrics family draws or announces, in each Bloom
 * language. A caller's `*Label` / `emptyText` / `title` prop still wins.
 */
export interface LyricsMessages {
  /** The region's name and the preview card's heading. */
  lyrics: string;
  showLyrics: string;
  backToCurrent: string;
  empty: string;
}

export const LYRICS_MESSAGES: MessageCatalog<LyricsMessages> = defineMessages<LyricsMessages>('LYRICS_MESSAGES', {
  lyrics: 'Lyrics',
  showLyrics: 'Show lyrics',
  backToCurrent: 'Back to current line',
  empty: 'Lyrics aren’t available for this track',
});
