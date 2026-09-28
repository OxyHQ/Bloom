import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the media-player family draws or announces, in each
 * Bloom language. Play/pause come from `MEDIA_CONTROLS_MESSAGES`; previous,
 * next and "More options" from the common words. A caller's `labels` or
 * `*Label` prop still wins over any entry.
 */
export interface MediaPlayerMessages {
  lyrics: string;
  queue: string;
  /** The device button's name. */
  devices: string;
  fullscreen: string;
  /** `MiniPlayer`'s open button, before the track: "Open player: …". */
  openPlayer: string;
  /** `DevicePicker`'s heading over the current device. */
  currentDevice: string;
  /** The accent line under the current device. */
  listeningOn: string;
  /** `ConnectBanner`'s sentence: "Listening on Kitchen speaker". */
  listeningOnDevice: (device: string) => string;
  selectDevice: string;
  noDevices: string;
  deviceHelp: string;
  playbackSpeed: string;
  sleepTimer: string;
  sleepOff: string;
  endOfEpisode: string;
  /** The sleep timer's 60-minute row. */
  oneHour: string;
  minutes: (minutes: number) => string;
  /** The sleep timer's time left: "Stops in 12:04". */
  stopsIn: (remaining: string) => string;
  shuffle: string;
  repeat: string;
  repeatOne: string;
  skipBack: (seconds: number) => string;
  skipForward: (seconds: number) => string;
  /** `FullScreenPlayer`'s collapse button. */
  closePlayer: string;
  share: string;
  /** The lyrics card's button. */
  showLyrics: string;
}

export const MEDIA_PLAYER_MESSAGES: MessageCatalog<MediaPlayerMessages> = defineMessages<MediaPlayerMessages>('MEDIA_PLAYER_MESSAGES', {
  lyrics: 'Lyrics',
  queue: 'Queue',
  devices: 'Connect to a device',
  fullscreen: 'Full screen',
  openPlayer: 'Open player',
  currentDevice: 'Current device',
  listeningOn: 'Listening on',
  listeningOnDevice: (d) => `Listening on ${d}`,
  selectDevice: 'Select a device',
  noDevices: 'No other devices found',
  deviceHelp: "Don't see your device?",
  playbackSpeed: 'Playback speed',
  sleepTimer: 'Sleep timer',
  sleepOff: 'Off',
  endOfEpisode: 'End of episode',
  oneHour: '1 hour',
  minutes: (n) => plural('en', n, { one: '{n} minute', other: '{n} minutes' }),
  stopsIn: (r) => `Stops in ${r}`,
  shuffle: 'Shuffle',
  repeat: 'Repeat',
  repeatOne: 'Repeat one',
  skipBack: (n) => plural('en', n, { one: 'Back {n} second', other: 'Back {n} seconds' }),
  skipForward: (n) => plural('en', n, { one: 'Forward {n} second', other: 'Forward {n} seconds' }),
  closePlayer: 'Close player',
  share: 'Share',
  showLyrics: 'Show lyrics',
});
