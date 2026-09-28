import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the media-controls family announces, in each Bloom
 * language. The media families built on these controls (player, cards,
 * headers, lists, queue) read the same words from here. A caller's
 * `*Label`/`label` prop still wins over any entry.
 */
export interface MediaControlsMessages {
  /** `PlayButton`'s name while paused, and a transport's play button. */
  play: string;
  /** `PlayButton`'s name while playing. */
  pause: string;
  /** `PlayButton` with a `subject`: "Play Night Drive". */
  playSubject: (subject: string) => string;
  pauseSubject: (subject: string) => string;
  /** `LikeButton`'s name. */
  saveToLibrary: string;
  /** A `LikeButton` about one item: "Save Night Drive to Your Library". */
  saveSubjectToLibrary: (subject: string) => string;
  /** `ExplicitBadge`'s name, and the word a card adds to its own name. */
  explicit: string;
  /** `PlaybackProgress`'s name. */
  seek: string;
  /** `PlaybackProgress`'s announced value: "1:23 of 3:45". */
  seekValue: (elapsed: string, total: string) => string;
  mute: string;
  unmute: string;
  volume: string;
  /** `NowPlayingIndicator`'s name, and the word a row adds while it plays. */
  nowPlaying: string;
}

export const MEDIA_CONTROLS_MESSAGES: MessageCatalog<MediaControlsMessages> = defineMessages<MediaControlsMessages>('MEDIA_CONTROLS_MESSAGES', {
  play: 'Play',
  pause: 'Pause',
  playSubject: (s) => `Play ${s}`,
  pauseSubject: (s) => `Pause ${s}`,
  saveToLibrary: 'Save to Your Library',
  saveSubjectToLibrary: (s) => `Save ${s} to Your Library`,
  explicit: 'Explicit',
  seek: 'Seek',
  seekValue: (a, b) => `${a} of ${b}`,
  mute: 'Mute',
  unmute: 'Unmute',
  volume: 'Volume',
  nowPlaying: 'Now playing',
});
