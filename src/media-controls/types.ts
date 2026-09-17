import type { StyleProp, ViewStyle } from 'react-native';

/** `small` 32, `medium` 48 (default), `large` 56 — the diameter of the button. */
export type PlayButtonSize = 'small' | 'medium' | 'large';

/**
 * `accent` — a filled accent circle (the main transport button).
 * `inverse` — a circle in the text colour (black in light mode, white in dark).
 * `plain` — the glyph alone, for a row of tracks.
 */
export type PlayButtonVariant = 'accent' | 'inverse' | 'plain';

export interface PlayButtonProps {
  /**
   * `false` draws the disc without making it a control: no `role="button"`, no
   * focus stop, hidden from assistive tech unless `accessibilityLabel` names it.
   * For a play glyph that sits INSIDE a pressable poster frame or row — a
   * button inside a button is invalid HTML and a second stop for one action.
   */
  interactive?: boolean;
  /** Whether the media is playing: draws the pause glyph and is named "Pause". */
  playing: boolean;
  /** Called on press. The button does not toggle anything itself. */
  onPress?: () => void;
  /** Default `medium`. */
  size?: PlayButtonSize;
  /** Default `accent`. */
  variant?: PlayButtonVariant;
  /** Replaces the glyph with a spinning ring and sets `aria-busy`. Still pressable. */
  loading?: boolean;
  disabled?: boolean;
  /** What plays, appended to the name: `"Night Drive"` → "Play Night Drive". */
  subject?: string;
  /** Name while paused. Default `"Play"`. */
  playLabel?: string;
  /** Name while playing. Default `"Pause"`. */
  pauseLabel?: string;
  /** Replaces the composed name entirely. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Glyph size: `small` 16, `medium` 20 (default), `large` 24. The hit area is never under 32. */
export type LikeButtonSize = 'small' | 'medium' | 'large';

export interface LikeButtonProps {
  liked: boolean;
  /** Called with the next state. */
  onLikedChange: (liked: boolean) => void;
  /** Default `medium`. */
  size?: LikeButtonSize;
  /** The liked heart's colour. Default: the theme accent. */
  activeColor?: string;
  disabled?: boolean;
  /**
   * The toggle's name. Default `"Save to Your Library"`. It stays the same in
   * both states — `aria-pressed` carries the state; a name that also flipped
   * would be announced as "Remove from Your Library, pressed".
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `small` 14, `medium` 16 (default) square. */
export type ExplicitBadgeSize = 'small' | 'medium';

export interface ExplicitBadgeProps {
  /** Default `medium`. */
  size?: ExplicitBadgeSize;
  /** The drawn letter. Default `"E"`. */
  letter?: string;
  /** The accessible name. Default `"Explicit"`. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NowPlayingIndicatorProps {
  /** Animates the bars. `false` draws them still. Default `true`. */
  playing?: boolean;
  /** Width and height of the square it draws in. Default `16`. */
  size?: number;
  /** Number of bars. Default `4`. */
  bars?: 3 | 4;
  /** Bar colour. Default: the theme accent. */
  color?: string;
  /** The accessible name. Default `"Now playing"`. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Where `PlaybackProgress` draws its times: beside the track (default) or under both ends. */
export type PlaybackProgressTimes = 'inline' | 'below';

export interface PlaybackProgressProps {
  /** Position, in seconds. */
  value: number;
  /** Length, in seconds. */
  duration: number;
  /** How far the media has loaded, in seconds. */
  buffered?: number;
  /** Called once, with the position in seconds, when a drag is released or a key is pressed. */
  onSeek?: (seconds: number) => void;
  /** Called while dragging, with the position under the pointer. */
  onSeekPreview?: (seconds: number) => void;
  /** Draws the elapsed and total (or remaining) time. Default `false`. */
  showTimes?: boolean;
  /** The right-hand label counts down ("−2:22") instead of showing the length. */
  showRemaining?: boolean;
  /** Default `inline`. */
  timesPosition?: PlaybackProgressTimes;
  /** Seconds one arrow key moves. Default `5`. */
  keyboardStep?: number;
  disabled?: boolean;
  /** The slider's name. Default `"Seek"`. */
  accessibilityLabel?: string;
  /** The announced value. Default: "1:23 of 3:45". */
  formatValueText?: (seconds: number, duration: number) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `always` (default) or `hover`: on web the slider fades in on hover or keyboard focus. Native always shows it. */
export type VolumeSliderVisibility = 'always' | 'hover';

export interface VolumeControlProps {
  /** Level, `0`..`1`. */
  volume: number;
  /** Called while dragging and on each key press, with a level in `0`..`1`. */
  onVolumeChange: (volume: number) => void;
  /** Whether sound is muted. The slider draws 0 while muted. */
  muted?: boolean;
  /** Called by the speaker button, and with `false` when the slider is moved while muted. */
  onMutedChange?: (muted: boolean) => void;
  /** Width of the slider. Default `96`. */
  sliderWidth?: number;
  /** Default `always`. */
  sliderVisibility?: VolumeSliderVisibility;
  disabled?: boolean;
  /** Button name while sounding. Default `"Mute"`. */
  muteLabel?: string;
  /** Button name while muted. Default `"Unmute"`. */
  unmuteLabel?: string;
  /** The slider's name. Default `"Volume"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
