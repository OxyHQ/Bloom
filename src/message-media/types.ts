import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
//  Shared vocabulary
// ---------------------------------------------------------------------------

/**
 * Which side of the conversation the block is drawn on.
 *
 * `incoming` — the neutral bubble (a raised surface over the page).
 * `outgoing` — the accent bubble (`theme.colors.primary`, the 500 stop of the
 * accent ramp), whose on-colour is `primaryForeground`.
 *
 * EVERY block in this family takes it, because nothing here can be painted from
 * the page's own text colours: half of these surfaces sit on a saturated fill
 * where `textSecondary` falls below AA. The tone selects a palette
 * (`resolveMessageMediaPaint`) whose muted/secondary members are MIXED UP to
 * 4.5:1 against the bubble rather than read off the theme, so the same component
 * is legible on both bubbles in both modes.
 */
export type MessageTone = 'incoming' | 'outgoing';

/**
 * An image: a full URL (`https:`, `data:`, `blob:`, `file:`), a React Native
 * source object / `require()` result, or a bare Oxy file ID that the registered
 * {@link ImageResolver} turns into a URL. Same rule `Avatar` uses.
 */
export type MessageMediaSource = string | ImageSourcePropType;

/** Props every block in the family accepts. */
export interface MessageMediaToneProps {
  /** Default `incoming`. */
  tone?: MessageTone;
  /**
   * Overrides the foreground the tone resolved — pass the bubble's own
   * on-colour when the app paints a custom bubble. Everything derived from it
   * (muted text, rails, washes) is re-derived, so contrast is kept.
   */
  onColor?: string;
  /**
   * Overrides the bubble fill the block believes it is sitting on. Only
   * contrast maths reads it; no block paints its own bubble.
   */
  bubbleColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The sending / uploading state an outgoing attachment can be in. */
export type MessageMediaState = 'idle' | 'sending' | 'failed';

// ---------------------------------------------------------------------------
//  ImageMessage
// ---------------------------------------------------------------------------

export interface ImageMessageProps extends MessageMediaToneProps {
  source: MessageMediaSource;
  /** Rendition forwarded to the {@link ImageResolver} for a bare file ID. */
  sourceVariant?: string;
  /**
   * Intrinsic aspect ratio (`width / height`) of the photo. The frame keeps it
   * inside `maxWidth` × `maxHeight`, so a portrait photo is not letterboxed and
   * a panorama is not cropped. Default `1.4`.
   */
  aspectRatio?: number;
  /** Default 260. */
  maxWidth?: number;
  /** Default 320. */
  maxHeight?: number;
  /**
   * Corner radius. The BUBBLE owns the real corners (a photo flush with the
   * bubble's edge takes the bubble's radius on the side it touches), so this is
   * a prop rather than a constant. Default 16.
   */
  radius?: number;
  /**
   * A solid colour shown while the photo loads — the average colour of the
   * image, or a blurhash's average. Bloom does not decode blurhashes (that
   * needs a decoder dependency); pass the flat colour the decoder produces.
   */
  placeholderColor?: string;
  /** A caption rendered under the photo, inside the same frame. */
  caption?: ReactNode;
  /** Hides the photo behind a scrim until pressed. */
  spoiler?: boolean;
  /** Default "Tap to view". */
  spoilerLabel?: string;
  /** Called when a spoiler is revealed, before `onPress` starts working. */
  onReveal?: () => void;
  /** `sending` draws the progress ring; `failed` draws the retry affordance. */
  state?: MessageMediaState;
  /** 0..1 for a determinate ring. Omit while `state="sending"` for an indeterminate one. */
  progress?: number;
  /** Press handler. `index` is always `0` here, so one handler serves a photo and an album. */
  onPress?: (index: number) => void;
  /** Cancels an in-flight send. Draws an X inside the ring when set. */
  onCancel?: () => void;
  /** Retries a failed send. */
  onRetry?: () => void;
  /** The accessible name. Default "Photo". */
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  MediaAlbum
// ---------------------------------------------------------------------------

export interface MediaAlbumItem {
  /** Stable key. */
  id: string;
  source: MessageMediaSource;
  sourceVariant?: string;
  /** Default `image`. A `video` cell draws a play glyph and its duration pill. */
  kind?: 'image' | 'video';
  /** Seconds. Drawn as a pill on a `video` cell. */
  duration?: number;
  /** Overrides the formatted duration (for a pre-formatted string). */
  durationLabel?: string;
  placeholderColor?: string;
  /** Hides this cell behind a scrim until pressed. */
  spoiler?: boolean;
  /** Per-cell accessible name. Default "Photo n of m" / "Video n of m". */
  accessibilityLabel?: string;
}

export interface MediaAlbumProps extends MessageMediaToneProps {
  /** 2–10 cells are laid out; past `maxTiles` the last cell takes a "+N". */
  items: readonly MediaAlbumItem[];
  /** Frame width. Default 260. */
  width?: number;
  /** Outer corner radius of the GROUP; cells inside stay square. Default 16. */
  radius?: number;
  /** Gap between cells. Default 2. */
  gap?: number;
  /** How many cells are drawn before the last one becomes a "+N". Default 10. */
  maxTiles?: number;
  /** `(count) => string` for the overflow tile. Default `+N`. */
  formatOverflow?: (remaining: number) => string;
  onPress?: (index: number) => void;
  state?: MessageMediaState;
  /** 0..1, the whole album's upload. */
  progress?: number;
  onCancel?: () => void;
  onRetry?: () => void;
  /** Names the group. Default "Album, n items". */
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  VideoMessage
// ---------------------------------------------------------------------------

/**
 * `thumbnail` — a rectangular still with a centred play button.
 * `videoNote` — the round short-video note: a circle with a progress ring.
 */
export type VideoMessageVariant = 'thumbnail' | 'videoNote';

export interface VideoMessageProps extends MessageMediaToneProps {
  /** The poster frame. */
  source: MessageMediaSource;
  sourceVariant?: string;
  /** Seconds. */
  duration?: number;
  /** Overrides the formatted duration. */
  durationLabel?: string;
  /** Elapsed seconds — drives the `videoNote` ring and the "watched" reading. */
  position?: number;
  /** Whether the app is currently playing it (flips the button glyph). */
  playing?: boolean;
  /** Draws the watched mark and dims the duration pill. */
  watched?: boolean;
  /** e.g. "12.4 MB" — pre-formatted, or pass `sizeBytes`. */
  sizeLabel?: string;
  /** Formatted with the shared `formatFileSize` when `sizeLabel` is absent. */
  sizeBytes?: number;
  /** Default `thumbnail`. */
  variant?: VideoMessageVariant;
  /** `thumbnail`: frame width (default 260). `videoNote`: diameter (default 180). */
  width?: number;
  /** `thumbnail` only. Default `16 / 9`. */
  aspectRatio?: number;
  radius?: number;
  placeholderColor?: string;
  state?: MessageMediaState;
  progress?: number;
  onPress?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  VoiceMessage
// ---------------------------------------------------------------------------

/** The rates the speed pill cycles through. */
export type VoicePlaybackRate = 1 | 1.5 | 2;

export interface VoiceMessageProps extends MessageMediaToneProps {
  /**
   * Amplitudes, 0..1, oldest first. Any length: the component resamples to
   * `barCount`, so a 512-sample analysis and a 20-sample one both draw the same
   * waveform.
   */
  samples: readonly number[];
  /** Total length in seconds. */
  duration: number;
  /** Elapsed seconds. Default 0. */
  position?: number;
  playing?: boolean;
  onPlayPress?: () => void;
  /** Seconds the user dragged/tapped to. Omit to make the waveform read-only. */
  onSeek?: (seconds: number) => void;
  /** Bars drawn. Default 42. */
  barCount?: number;
  /** Draws the unplayed dot beside the duration. */
  unplayed?: boolean;
  /** Current rate. Omit to hide the speed pill. */
  rate?: VoicePlaybackRate;
  onRateChange?: (rate: VoicePlaybackRate) => void;
  /** The transcript text. Its presence is what enables the toggle. */
  transcript?: string;
  /** Controlled disclosure. Omit for uncontrolled. */
  transcriptOpen?: boolean;
  onTranscriptOpenChange?: (open: boolean) => void;
  /** Default "Transcribe". */
  transcribeLabel?: string;
  /** Default "Hide transcript". */
  hideTranscriptLabel?: string;
  /** Total width. Default 260. */
  width?: number;
  state?: MessageMediaState;
  onRetry?: () => void;
  /** Names the whole block. Default "Voice message, 0:14". */
  accessibilityLabel?: string;
  /** Names the waveform slider. Default "Seek". */
  seekLabel?: string;
}

// ---------------------------------------------------------------------------
//  FileMessage
// ---------------------------------------------------------------------------

/** The icon + colour family a file is drawn with. */
export type FileKind =
  | 'pdf'
  | 'doc'
  | 'sheet'
  | 'slides'
  | 'zip'
  | 'audio'
  | 'video'
  | 'image'
  | 'code'
  | 'other';

export interface FileMessageProps extends MessageMediaToneProps {
  /** File name WITH its extension — the extension picks the icon and the label. */
  name: string;
  /** Overrides the kind derived from the name / `mimeType`. */
  kind?: FileKind;
  /** A MIME type, used when the name has no usable extension. */
  mimeType?: string;
  /** Size in bytes. Formatted with the shared `formatFileSize`. */
  sizeBytes?: number;
  /** Pre-formatted size, overriding `sizeBytes`. */
  sizeLabel?: string;
  /** The type word after the size ("PDF"). Default: the uppercased extension. */
  typeLabel?: string;
  /** A third meta segment (a date, a sender). */
  metaLabel?: string;
  /** 0..1 while downloading / uploading. */
  progress?: number;
  /** `downloading` and `uploading` both draw the ring with a cancel X. */
  transfer?: 'idle' | 'downloading' | 'uploading' | 'done';
  onPress?: () => void;
  onDownload?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  state?: MessageMediaState;
  /** `compact` is the shared-files row: 36px icon, one line of meta, no card inset. */
  variant?: 'bubble' | 'compact';
  radius?: number;
  /** Default 260 for `bubble`; `compact` stretches. */
  width?: number;
  accessibilityLabel?: string;
  /** Default "Download". */
  downloadLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
}

// ---------------------------------------------------------------------------
//  LocationMessage
// ---------------------------------------------------------------------------

export interface LocationMessageProps extends MessageMediaToneProps {
  /** A place name / label above the address. */
  title?: string;
  /** The address line. */
  address?: string;
  /**
   * The map. Bloom ships no map engine, so the app renders its own tile view
   * into the frame; without it the frame draws a neutral placeholder grid.
   */
  renderMap?: (size: { width: number; height: number }) => ReactNode;
  /** Draws the pulsing dot, the "live until" line and the stop action. */
  live?: boolean;
  /** Pre-formatted, e.g. "Live until 18:30". A component never reads the clock. */
  liveUntilLabel?: string;
  /** Default "Stop sharing". */
  stopSharingLabel?: string;
  onStopSharing?: () => void;
  onPress?: () => void;
  /** Frame width. Default 260. */
  width?: number;
  /** Map height. Default 140. */
  mapHeight?: number;
  radius?: number;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  ContactMessage
// ---------------------------------------------------------------------------

export interface ContactMessageProps extends MessageMediaToneProps {
  name: string;
  /** Phone number or handle. */
  detail?: string;
  avatar?: MessageMediaSource;
  avatarVariant?: string;
  /** Initials for the avatar fallback. Derived from `name` when absent. */
  initials?: string;
  onMessage?: () => void;
  onAdd?: () => void;
  /** Default "Message". */
  messageLabel?: string;
  /** Default "Add". */
  addLabel?: string;
  width?: number;
  radius?: number;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  PollMessage
// ---------------------------------------------------------------------------

export interface PollOption {
  id: string;
  label: string;
  /** Votes for this option. Percentages are computed from the whole set. */
  votes?: number;
  /** The viewer picked this one. */
  selected?: boolean;
  /** Quiz only: this is the right answer. */
  correct?: boolean;
}

export interface PollMessageProps extends MessageMediaToneProps {
  question: string;
  options: readonly PollOption[];
  /** Total voters. Defaults to the sum of `votes`. */
  totalVotes?: number;
  /** Allows more than one pick, and switches the marks to checkboxes. */
  multiple?: boolean;
  /** Draws the "Anonymous voting" label. */
  anonymous?: boolean;
  /** Draws the "Quiz" label and the right/wrong marks once answered. */
  quiz?: boolean;
  /** The viewer has voted: results (bars + percentages) replace the marks. */
  voted?: boolean;
  /** Reveals the bars without the viewer having voted (a closed poll). */
  showResults?: boolean;
  /** Called with the ids the viewer picked. */
  onVote?: (ids: string[]) => void;
  onViewResults?: () => void;
  /** Default "Vote". */
  voteLabel?: string;
  /** Default "View results". */
  viewResultsLabel?: string;
  /** Default "Anonymous voting". */
  anonymousLabel?: string;
  /** Default "Quiz". */
  quizLabel?: string;
  /** `(n) => string` for the footer. Default "No votes" / "1 vote" / "n votes". */
  formatVotes?: (total: number) => string;
  /** Default "Select one" / "Select one or more". */
  hintLabel?: string;
  width?: number;
  radius?: number;
}

// ---------------------------------------------------------------------------
//  StickerMessage / GifMessage
// ---------------------------------------------------------------------------

export interface StickerMessageProps extends MessageMediaToneProps {
  source: MessageMediaSource;
  sourceVariant?: string;
  /** Square edge. Default 128. */
  size?: number;
  /** The accessible name — a sticker IS its meaning. Default "Sticker". */
  accessibilityLabel?: string;
  onPress?: () => void;
  state?: MessageMediaState;
  onRetry?: () => void;
}

export interface GifMessageProps extends MessageMediaToneProps {
  source: MessageMediaSource;
  sourceVariant?: string;
  aspectRatio?: number;
  /** Default 220. */
  maxWidth?: number;
  /** Default 260. */
  maxHeight?: number;
  radius?: number;
  placeholderColor?: string;
  /** Draws the pill. Default "GIF". */
  badgeLabel?: string;
  /** `false` shows the play affordance for a click-to-play GIF. */
  playing?: boolean;
  onPress?: () => void;
  state?: MessageMediaState;
  progress?: number;
  onRetry?: () => void;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  LinkPreviewMessage
// ---------------------------------------------------------------------------

export interface LinkPreviewMessageProps extends MessageMediaToneProps {
  url: string;
  siteName?: string;
  title?: string;
  description?: string;
  image?: MessageMediaSource;
  imageVariant?: string;
  /** `large` puts the image above the text; `inline` keeps a 56px thumb beside it. */
  layout?: 'large' | 'inline';
  width?: number;
  radius?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  SharedMediaGrid / DocumentGrid
// ---------------------------------------------------------------------------

export interface SharedMediaItem {
  id: string;
  source: MessageMediaSource;
  sourceVariant?: string;
  kind?: 'image' | 'video';
  duration?: number;
  durationLabel?: string;
  placeholderColor?: string;
  accessibilityLabel?: string;
}

export interface SharedMediaGridProps {
  items: readonly SharedMediaItem[];
  /** Default 3. */
  columns?: number;
  /** Total width the grid fills. Default 340. */
  width?: number;
  /** Default 2. */
  gap?: number;
  /** Tiles drawn before the last becomes a "+N more". Omit for all of them. */
  maxItems?: number;
  /** Default `+N more`. */
  formatOverflow?: (remaining: number) => string;
  /** Tile corner radius. Default 4 — a tight grid, not a row of cards. */
  radius?: number;
  onPressItem?: (index: number) => void;
  onPressOverflow?: () => void;
  /** Names the grid. Default "Shared media, n items". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DocumentGridItem
  extends Pick<
    FileMessageProps,
    | 'name'
    | 'kind'
    | 'mimeType'
    | 'sizeBytes'
    | 'sizeLabel'
    | 'typeLabel'
    | 'metaLabel'
    | 'progress'
    | 'transfer'
  > {
  id: string;
}

export interface DocumentGridProps {
  items: readonly DocumentGridItem[];
  onPressItem?: (index: number) => void;
  onDownloadItem?: (index: number) => void;
  onCancelItem?: (index: number) => void;
  /** Hairlines between rows. Default `true`. */
  divider?: boolean;
  /** Names the list. Default "Shared files, n items". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
