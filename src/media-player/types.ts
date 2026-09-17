import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** `off` → `all` → `one` → `off`. */
export type RepeatMode = 'off' | 'all' | 'one';

/** `compact` (play 32, glyphs 16), `regular` (play 48, glyphs 20, default), `large` (play 56, glyphs 24). */
export type TransportControlsSize = 'compact' | 'regular' | 'large';

/** `music`: shuffle · previous · play · next · repeat. `podcast`: speed · back N · play · forward N · trailing. */
export type TransportControlsVariant = 'music' | 'podcast';

/** Every name the transport announces — translate them. */
export interface TransportControlsLabels {
  shuffle: string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  /** Name while repeat is `off` or `all`. */
  repeat: string;
  /** Name while repeat is `one`. */
  repeatOne: string;
  /** `(seconds) => "Back 15 seconds"`. */
  skipBack: (seconds: number) => string;
  /** `(seconds) => "Forward 30 seconds"`. */
  skipForward: (seconds: number) => string;
}

export interface TransportControlsProps {
  playing: boolean;
  onPlayPause: () => void;
  /** Draws the play button's loading ring. */
  loading?: boolean;
  /** Appended to the play button's name: "Play Night Drive". */
  subject?: string;
  /** Default `music`. */
  variant?: TransportControlsVariant;
  /** Default `regular`. */
  size?: TransportControlsSize;

  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;

  /** Music: the shuffle toggle shows when `onShuffleChange` is given. */
  shuffle?: boolean;
  onShuffleChange?: (shuffle: boolean) => void;
  /** Music: the repeat button shows when `onRepeatChange` is given. Default `off`. */
  repeat?: RepeatMode;
  /** Called with the NEXT mode of the cycle (`nextRepeatMode`). */
  onRepeatChange?: (repeat: RepeatMode) => void;

  /** Podcast: seconds the back button skips. Default `15`. */
  skipBackSeconds?: number;
  /** Podcast: seconds the forward button skips. Default `30`. */
  skipForwardSeconds?: number;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  /** Podcast: the speed button shows when `onPlaybackRateChange` is given. Default `1`. */
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  /** Podcast: what sits right of the forward button (a `SleepTimerMenu`, say). Its width is reserved either way. */
  trailing?: ReactNode;

  disabled?: boolean;
  labels?: Partial<TransportControlsLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** An artist credit. A string `artists` prop is one plain, unpressable credit. */
export interface MediaArtist {
  id?: string;
  name: string;
}

/** What is playing — shared by the bar, the mini player and the full-screen player. */
export interface MediaPlayerTrack {
  title: string;
  artists: string | MediaArtist[];
  /** A URL, or an `ImageResolver` id. */
  artwork?: string;
  explicit?: boolean;
}

export interface NowPlayingBarLabels {
  lyrics: string;
  queue: string;
  devices: string;
  fullscreen: string;
  /** Name of the title button. Default: the title. */
  openTrack?: string;
}

export interface NowPlayingBarProps {
  track: MediaPlayerTrack;
  onTitlePress?: () => void;
  onArtistPress?: (artist: MediaArtist, index: number) => void;

  liked?: boolean;
  /** The like button shows when this is given. */
  onLikedChange?: (liked: boolean) => void;

  /** Transport props, minus `size` (the bar sets `compact`). */
  transport: Omit<TransportControlsProps, 'size' | 'style' | 'testID'>;

  /** Seconds. */
  position: number;
  duration: number;
  buffered?: number;
  onSeek?: (seconds: number) => void;
  onSeekPreview?: (seconds: number) => void;

  lyricsActive?: boolean;
  /** The lyrics toggle shows when this is given. */
  onLyricsChange?: (active: boolean) => void;
  queueActive?: boolean;
  /** The queue toggle shows when this is given. */
  onQueueChange?: (active: boolean) => void;

  /** The device playback is going to, other than this one. Lights the device button. */
  deviceName?: string;
  /** Called by the device button when `devicePicker` is not given. */
  onDevicePress?: () => void;
  /** Content of the popover the device button opens (a `DevicePicker`). */
  devicePicker?: ReactNode;
  /** Controlled open state of that popover. */
  devicePickerOpen?: boolean;
  onDevicePickerOpenChange?: (open: boolean) => void;

  volume?: number;
  /** The volume control shows when this is given. */
  onVolumeChange?: (volume: number) => void;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;

  /** The fullscreen button shows when this is given. */
  onFullscreenPress?: () => void;

  labels?: Partial<NowPlayingBarLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MiniPlayerProps {
  track: MediaPlayerTrack;
  playing: boolean;
  onPlayPause: () => void;
  /** Opens the full player. */
  onPress?: () => void;
  /** Seconds, for the 2px progress line. */
  position: number;
  duration: number;
  /** Background tint, a hex from the backend. Absent or too pale to hold text → darkened, or the neutral surface. */
  artworkColor?: string;
  liked?: boolean;
  onLikedChange?: (liked: boolean) => void;
  /** Replaces the artist line with the device playback is going to. */
  deviceName?: string;
  /** Native only: a horizontal swipe on the bar. */
  onNext?: () => void;
  onPrevious?: () => void;
  /** Name of the bar's open button. Default `"Open player"`. */
  openLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface LyricsPreview {
  lines: string[];
  /** Index of the line being sung; the lines before it dim. */
  activeIndex?: number;
  /** Default `"Lyrics"`. */
  title?: string;
  /** Opens the full lyrics. */
  onPress?: () => void;
  /** Name of the card's button. Default `"Show lyrics"`. */
  actionLabel?: string;
}

export interface FullScreenPlayerLabels {
  collapse: string;
  more: string;
  devices: string;
  share: string;
  queue: string;
}

export interface FullScreenPlayerProps {
  track: MediaPlayerTrack;
  /** Hex from the backend; the background runs from it to the dark surface. */
  artworkColor?: string;
  /** "Playing from playlist". */
  contextLabel?: string;
  /** "Night Drive". */
  contextName?: string;
  onCollapse?: () => void;
  onMore?: () => void;
  onArtistPress?: (artist: MediaArtist, index: number) => void;

  liked?: boolean;
  onLikedChange?: (liked: boolean) => void;

  transport: Omit<TransportControlsProps, 'size' | 'style' | 'testID'>;
  position: number;
  duration: number;
  buffered?: number;
  onSeek?: (seconds: number) => void;
  onSeekPreview?: (seconds: number) => void;

  deviceName?: string;
  onDevicePress?: () => void;
  onShare?: () => void;
  queueActive?: boolean;
  onQueuePress?: () => void;

  /** A card below the fold. */
  lyrics?: LyricsPreview;
  /** A slot below the fold, for the artist card. */
  aboutArtist?: ReactNode;

  labels?: Partial<FullScreenPlayerLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `off`, a number of minutes, or the end of the current episode / track. */
export type SleepTimerValue = 'off' | 'end' | number;

export interface PlaybackSpeedMenuProps {
  rate: number;
  onRateChange: (rate: number) => void;
  /** Default `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]`. */
  rates?: readonly number[];
  /** Default `(r) => "1.25×"`. */
  formatRate?: (rate: number) => string;
  /** The menu heading and the trigger's name. Default `"Playback speed"`. */
  label?: string;
  /** Replaces the default trigger (a text button showing the rate); passed through `asChild`. */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Size of the default trigger. Default `regular`. */
  size?: TransportControlsSize;
  disabled?: boolean;
  testID?: string;
}

export interface SleepTimerMenuProps {
  value: SleepTimerValue;
  onValueChange: (value: SleepTimerValue) => void;
  /** Minutes offered. Default `[5, 10, 15, 30, 45, 60]`. */
  minutes?: readonly number[];
  /** Pre-formatted time left ("12:04"); shown under the heading and in the trigger's name. */
  remaining?: string;
  /** Default `"Sleep timer"`. */
  label?: string;
  /** Default `"Off"`. */
  offLabel?: string;
  /** Default `"End of episode"`. Pass `"End of track"` for music. */
  endLabel?: string;
  /** Default `(m) => "15 minutes"`. */
  formatMinutes?: (minutes: number) => string;
  /** Default `(r) => "Stops in 12:04"`. */
  formatRemaining?: (remaining: string) => string;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: TransportControlsSize;
  disabled?: boolean;
  testID?: string;
}

/** Picks the device glyph. */
export type PlaybackDeviceKind = 'computer' | 'phone' | 'tablet' | 'speaker' | 'tv' | 'car' | 'headphones' | 'group';

export interface PlaybackDevice {
  id: string;
  name: string;
  kind: PlaybackDeviceKind;
  /** A second line: "Connected", "3 speakers". */
  description?: string;
  disabled?: boolean;
}

export interface DevicePickerProps {
  /** The device playing now. */
  current: PlaybackDevice;
  devices: PlaybackDevice[];
  onSelect: (device: PlaybackDevice) => void;
  /** Default `"Current device"`. */
  title?: string;
  /** Accent line on the current row. Default `"Listening on"`. */
  currentLabel?: string;
  /** Default `"Select a device"`. */
  devicesTitle?: string;
  /** Shown when `devices` is empty. Default `"No other devices found"`. */
  emptyLabel?: string;
  /** The help link text. Shown when `onHelpPress` is given. Default `"Don't see your device?"`. */
  helpLabel?: string;
  onHelpPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ConnectBannerProps {
  deviceName: string;
  /** Default `speaker`. */
  kind?: PlaybackDeviceKind;
  /** Default `"Listening on"`. */
  label?: string;
  /** Makes the banner a button (opens the device picker). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
