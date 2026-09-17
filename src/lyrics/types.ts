import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** One line of lyrics. */
export interface LyricLine {
  /**
   * When the line starts, in seconds from the start of the track. Lines
   * without a time make the lyrics UNSYNCED: they draw as plain text, with no
   * active line, no auto-scroll and no seeking.
   */
  time?: number;
  /** The words. An empty string draws a short pause gap (an instrumental break). */
  text: string;
  /** A stable key. Default: the line's position. */
  key?: string;
}

export interface LyricsViewProps {
  /** The lines, in any order — synced lines are sorted by `time`. */
  lines?: readonly LyricLine[];
  /**
   * Plain, unsynced lyrics as one string (split on line breaks). Used when
   * `lines` is absent or empty.
   */
  text?: string;
  /** The playback position, in seconds. Drives the active line. */
  currentTime?: number;
  /**
   * Called when a synced line is pressed, with the line and its index in the
   * sorted lines. Seek the player to `line.time`. Without it lines are not
   * pressable.
   */
  onSeekLine?: (line: LyricLine, index: number) => void;
  /**
   * The artwork's colour (hex or `rgb()`), from the backend. The view paints a
   * deep shade of it and picks text colours that keep contrast. Absent or
   * unparseable: the theme's neutral surface.
   */
  artworkColor?: string | null;
  /** The footer line, e.g. "Lyrics provided by …". Omitted: no footer. */
  providerText?: string;
  /** Replaces the footer with your own node. */
  footer?: ReactNode;
  /** Drawn when there are no lyrics at all. Default "Lyrics aren’t available for this track". */
  emptyText?: string;
  /** The pill shown after the user scrolls away. Default "Back to current line". */
  backToCurrentLabel?: string;
  /** How long after the user's last scroll auto-scroll resumes, in ms. Default `3000`. */
  resumeDelay?: number;
  /** Where the active line's centre is kept, as a fraction of the height. Default `1/3`. */
  anchor?: number;
  /** Text size. Default by width: `large` from 720, `medium` from 480, `small` below. */
  size?: LyricsSize;
  /** The region's name. Default `"Lyrics"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Line type: `large` 32/44, `medium` 24/34, `small` 20/26. */
export type LyricsSize = 'large' | 'medium' | 'small';

export interface LyricsPreviewCardProps {
  lines?: readonly LyricLine[];
  /** Plain, unsynced lyrics — the card shows the first lines. */
  text?: string;
  currentTime?: number;
  artworkColor?: string | null;
  /** The card's heading. Default `"Lyrics"`. */
  title?: string;
  /** How many lines the card shows. Default `5`. */
  visibleLines?: 4 | 5;
  /** Called by the "Show lyrics" button. Without it the button is not drawn. */
  onShowLyrics?: () => void;
  /** Default `"Show lyrics"`. */
  showLyricsLabel?: string;
  /** Makes the lines pressable, as in {@link LyricsViewProps.onSeekLine}. */
  onSeekLine?: (line: LyricLine, index: number) => void;
  /** A small footer, e.g. "Lyrics provided by …". */
  providerText?: string;
  /** Drawn when there are no lyrics. Default "Lyrics aren’t available for this track". */
  emptyText?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Every colour the lyrics paint. */
export interface LyricsPalette {
  background: string;
  /** The active line, and every line of unsynced lyrics. */
  active: string;
  /** Lines still to come. */
  upcoming: string;
  /** Lines already sung. */
  past: string;
  /** The footer and small print. */
  muted: string;
  /** The pill buttons: a fill in the active colour, a label in the background colour. */
  pill: string;
  pillHover: string;
  onPill: string;
  ring: string;
  /** Whether the colours came from `artworkColor`. */
  fromArtwork: boolean;
}
