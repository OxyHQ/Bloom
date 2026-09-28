import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the track-list family draws or announces, in each Bloom
 * language. "More options" (and "More options for <title>") come from the
 * common words; play/pause, the like button and the explicit badge from
 * `MEDIA_CONTROLS_MESSAGES`. A caller's `labels`/`*Label` prop still wins.
 */
export interface TrackListMessages {
  /** Column headers. */
  title: string;
  album: string;
  dateAdded: string;
  plays: string;
  duration: string;
  /** Row menu items and the drag handle. */
  moveUp: string;
  moveDown: string;
  reorder: string;
  /** The downloaded glyph's name. */
  downloaded: string;
  /** Appended to an unavailable row's name. */
  unavailable: string;
  /** `TrackList`'s grid name. */
  tracks: string;
  /** `EpisodeList`'s list name. */
  episodes: string;
  /** `SelectionBar`'s count. */
  selected: (count: number) => string;
  clearSelection: string;
  /** `EpisodeRow`. */
  played: string;
  listened: string;
  saveEpisode: string;
  downloadEpisode: string;
  /** Episode lengths: "45 min", "1 hr", "1 hr 12 min". */
  minutes: (minutes: number) => string;
  hours: (hours: number) => string;
  hoursMinutes: (hours: number, minutes: number) => string;
  /** "12 min left". */
  remaining: (length: string) => string;
}

export const TRACK_LIST_MESSAGES: MessageCatalog<TrackListMessages> = defineMessages<TrackListMessages>('TRACK_LIST_MESSAGES', {
  title: 'Title',
  album: 'Album',
  dateAdded: 'Date added',
  plays: 'Plays',
  duration: 'Duration',
  moveUp: 'Move up',
  moveDown: 'Move down',
  reorder: 'Reorder',
  downloaded: 'Downloaded',
  unavailable: 'Unavailable',
  tracks: 'Tracks',
  episodes: 'Episodes',
  selected: (n) => plural('en', n, { other: '{n} selected' }),
  clearSelection: 'Clear selection',
  played: 'Played',
  listened: 'Listened',
  saveEpisode: 'Save episode',
  downloadEpisode: 'Download episode',
  minutes: (m) => `${m} min`,
  hours: (h) => `${h} hr`,
  hoursMinutes: (h, m) => `${h} hr ${m} min`,
  remaining: (l) => `${l} left`,
});
