import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * The columns a track table can draw, in the order they are laid out.
 *
 * `title` is the cover, the title and the artists. `actions` is the like
 * button (when `onLikedChange` is set) and the "More options" button (when the
 * row has a menu).
 */
export type TrackListColumn =
  | 'index'
  | 'title'
  | 'album'
  | 'dateAdded'
  | 'plays'
  | 'duration'
  | 'actions';

/** `comfortable` rows are 56 tall, `compact` rows 40. */
export type TrackListDensity = 'comfortable' | 'compact';

export interface TrackArtist {
  /** Handed back to `onArtistPress`. */
  id?: string;
  name: string;
}

export interface Track {
  /** Stable key: selection, `currentTrackId` and reordering all go by it. */
  id: string;
  title: string;
  artists: TrackArtist[];
  album?: string;
  /** Artwork: a URL, or an id the app's `ImageResolver` turns into one. */
  cover?: string;
  /** The number drawn in the index column (a disc's own track number). Default: position + 1. */
  number?: number;
  /** Length in seconds, drawn with `formatDuration`. */
  duration: number;
  /** Pre-formatted by the app ("3 days ago", "12 Mar 2026"). */
  dateAdded?: string;
  /** Pre-formatted by the app ("1,204,331"). */
  plays?: string;
  explicit?: boolean;
  liked?: boolean;
  /** Dimmed, not playable, not likeable. It can still be selected and opened. */
  unavailable?: boolean;
  /** Draws the downloaded mark before the artists when the list sets `showDownloaded`. */
  downloaded?: boolean;
}

/** An icon component from `@oxy.so/bloom/icons` (`RiPlayListAddLine`). */
export type TrackIconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;

export interface TrackMenuItem {
  key: string;
  label: string;
  icon?: TrackIconComponent;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

/** A header row ("Disc 2") drawn before the track at `startIndex`. */
export interface TrackListGroup {
  key: string;
  title: string;
  /** Index into `tracks` of the group's first track. */
  startIndex: number;
}

/** Every word the list draws or announces, for localisation. */
export interface TrackListLabels {
  /** Default `"#"`. */
  index?: string;
  /** Default `"Title"`. */
  title?: string;
  /** Default `"Album"`. */
  album?: string;
  /** Default `"Date added"`. */
  dateAdded?: string;
  /** Default `"Plays"`. */
  plays?: string;
  /** The clock icon's name. Default `"Duration"`. */
  duration?: string;
  /** Default `"More options"`; the button is named "More options for <title>". */
  moreOptions?: string;
  /** Default `"Move up"`. */
  moveUp?: string;
  /** Default `"Move down"`. */
  moveDown?: string;
  /** The drag handle. Default `"Reorder"`. */
  reorder?: string;
  /** Default `"Downloaded"`. */
  downloaded?: string;
  /** Default `"Unavailable"`, appended to the row's name. */
  unavailable?: string;
}

/** The modifier keys and click count of a press, as the row read them. */
export interface TrackRowPressEvent {
  shiftKey: boolean;
  /** Cmd on macOS, Ctrl elsewhere — either one is read as "toggle". */
  toggleKey: boolean;
  /** 2 for a double-click. Always 1 on native. */
  clickCount: number;
}

/** Where a row asks focus to go. `extend` is Shift held (grow the selection). */
export type TrackRowNavigation = 'previous' | 'next' | 'first' | 'last';

export interface TrackRowProps {
  track: Track;
  /** Position in the list: drawn as the number (unless `track.number`) and passed to every callback. */
  index: number;
  /** Visible columns, already collapsed for the width. Default: every column that fits `width`. */
  columns?: TrackListColumn[];
  /** Width the row is laid out for; collapses `columns`. Default: the window width. */
  width?: number;
  /** Default `comfortable`. */
  density?: TrackListDensity;
  /** This row is the loaded track: the title turns accent, the index shows the bars (playing) or an accent number. */
  current?: boolean;
  /** The loaded track is playing (only read with `current`). */
  playing?: boolean;
  selected?: boolean;
  /** Called by the index play button, a double-click, Enter/Space, and a press on native. */
  onPlay?: (track: Track, index: number) => void;
  /** Called by the index button of the current, playing row. Default: `onPlay`. */
  onPause?: (track: Track, index: number) => void;
  /**
   * A single press (web). Default: nothing on web, `onPlay` on native.
   * `TrackList` uses it for selection.
   */
  onPress?: (track: Track, index: number, event: TrackRowPressEvent) => void;
  /** Long press. Default: opens the menu when there is one. */
  onLongPress?: (track: Track, index: number) => void;
  /** Shows the like button. */
  onLikedChange?: (track: Track, liked: boolean) => void;
  /** Makes each artist name pressable. */
  onArtistPress?: (artist: TrackArtist, track: Track) => void;
  /** Makes the album name pressable. */
  onAlbumPress?: (track: Track) => void;
  /** The row's menu ("More options", long press, the Menu key). */
  menuItems?: (track: Track, index: number) => TrackMenuItem[];
  /** Draws the drag handle and adds "Move up"/"Move down" to the menu. */
  reorderable?: boolean;
  /** Menu and Alt+Arrow. Omitted: that direction is disabled. */
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  /** The drag handle's gesture, `dy` in px from where it started. `TrackList` owns the maths. */
  onDrag?: (phase: 'start' | 'move' | 'end' | 'cancel', index: number, dy: number) => void;
  /** Arrow keys, Home and End (web). */
  onNavigate?: (index: number, to: TrackRowNavigation, extend: boolean) => void;
  /** Draws the downloaded mark for `track.downloaded`. */
  showDownloaded?: boolean;
  /** 1-based row number within the grid (`aria-rowindex`). */
  rowIndex?: number;
  /** Roving tab stop: `0` for the one row Tab lands on, `-1` for the rest. Web only. */
  tabIndex?: 0 | -1;
  labels?: TrackListLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TrackListProps {
  tracks: Track[];
  /** Which columns to offer. Default: all. They still collapse by width. */
  columns?: TrackListColumn[];
  /** Default `comfortable`. */
  density?: TrackListDensity;
  /** Disc headers. Not combined with `reorderable`. */
  groups?: TrackListGroup[];
  /** The id of the loaded track. */
  currentTrackId?: string | null;
  /** Whether the loaded track is playing. */
  isPlaying?: boolean;
  onPlay?: (track: Track, index: number) => void;
  /** Default: `onPlay`. */
  onPause?: (track: Track, index: number) => void;
  /** Controlled selection. */
  selectedIds?: string[];
  /** Uncontrolled starting selection. */
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Turns selection off entirely (a press then does nothing on web but a double-click plays). Default `true`. */
  selectable?: boolean;
  onLikedChange?: (track: Track, liked: boolean) => void;
  onArtistPress?: (artist: TrackArtist, track: Track) => void;
  onAlbumPress?: (track: Track) => void;
  menuItems?: (track: Track, index: number) => TrackMenuItem[];
  /** Drag handle, Alt+Arrow and "Move up/down" menu rows. Needs `onReorder`. */
  reorderable?: boolean;
  /** `from` and `to` are indexes into `tracks`; the app moves the item. */
  onReorder?: (from: number, to: number) => void;
  showDownloaded?: boolean;
  /** Draws the column header row. Default `true` (never drawn in the narrow layout). */
  showHeader?: boolean;
  /** Pins the header to the top of the scrolling page on web. Default `true`. */
  stickyHeader?: boolean;
  /** Distance from the top the sticky header stops at (under an app bar). Default `0`. */
  stickyHeaderOffset?: number;
  /** The header's background, so rows scrolling under it are covered. Default: the page background. */
  headerBackground?: string;
  /** Width to lay out for. Default: measured (the window width until the first layout). */
  width?: number;
  /** The grid's accessible name. Default `"Tracks"`. */
  accessibilityLabel?: string;
  labels?: TrackListLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TrackListHeaderProps {
  /** Visible columns, already collapsed. */
  columns: TrackListColumn[];
  density?: TrackListDensity;
  /** Reserve the drag handle's gutter so labels line up with reorderable rows. */
  reorderable?: boolean;
  /** Reserve the like button's slot. */
  likeable?: boolean;
  /** Reserve the more button's slot. */
  hasMenu?: boolean;
  sticky?: boolean;
  stickyOffset?: number;
  background?: string;
  labels?: TrackListLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TrackRowSkeletonProps {
  columns?: TrackListColumn[];
  width?: number;
  density?: TrackListDensity;
  /** Draw this many rows. Default `1`. */
  count?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TrackListEmptyProps {
  /** Default: a note glyph. */
  icon?: TrackIconComponent;
  title: string;
  description?: string;
  /** Button label; drawn with `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SelectionBarAction {
  key: string;
  label: string;
  icon?: TrackIconComponent;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

/** `floating` sits absolutely at the bottom centre of the nearest positioned parent; `inline` flows. */
export type SelectionBarPlacement = 'floating' | 'inline';

export interface SelectionBarProps {
  /** Number of selected items. The bar renders nothing at 0. */
  count: number;
  actions: SelectionBarAction[];
  onClear: () => void;
  /** Default `"<n> selected"`. */
  formatCount?: (count: number) => string;
  /** Default `"Clear selection"`. */
  clearLabel?: string;
  /** Default `floating`. */
  placement?: SelectionBarPlacement;
  /** Width below which actions draw as icon buttons only. Default: the window width. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface Episode {
  id: string;
  title: string;
  /** The show's name. */
  show?: string;
  description?: string;
  /** URL or resolver id. */
  cover?: string;
  /** Pre-formatted ("12 Mar", "Yesterday"). */
  date?: string;
  /** Length in seconds. */
  duration: number;
  /** Seconds listened. Draws the progress bar and "12 min left" when between 0 and `duration`. */
  progress?: number;
  played?: boolean;
  saved?: boolean;
  downloaded?: boolean;
  explicit?: boolean;
}

export interface EpisodeRowLabels {
  /** Default `"Played"`. */
  played?: string;
  /** Default: "12 min left" / "1 hr 4 min left". */
  formatRemaining?: (seconds: number) => string;
  /** Default: "45 min" / "1 hr 12 min". */
  formatLength?: (seconds: number) => string;
  /** Default `"Save episode"` (toggle; state is aria-pressed). */
  save?: string;
  /** Default `"Download episode"` (toggle). */
  download?: string;
  /** Default `"More options"`. */
  moreOptions?: string;
  /** The progress bar's name. Default `"Listened"`. */
  progress?: string;
}

export interface EpisodeRowProps {
  episode: Episode;
  index?: number;
  /** Opens the episode. */
  onPress?: (episode: Episode) => void;
  current?: boolean;
  playing?: boolean;
  onPlay?: (episode: Episode) => void;
  onPause?: (episode: Episode) => void;
  /** Shows the save toggle. */
  onSavedChange?: (episode: Episode, saved: boolean) => void;
  /** Shows the download toggle. */
  onDownloadedChange?: (episode: Episode, downloaded: boolean) => void;
  menuItems?: (episode: Episode) => TrackMenuItem[];
  /** Below 560 the cover shrinks and the description is dropped. Default: the window width. */
  width?: number;
  /** Draws the hairline under the row. Default `false`. */
  divider?: boolean;
  labels?: EpisodeRowLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface EpisodeListProps
  extends Omit<EpisodeRowProps, 'episode' | 'index' | 'current' | 'playing' | 'divider' | 'style' | 'testID'> {
  episodes: Episode[];
  currentEpisodeId?: string | null;
  isPlaying?: boolean;
  /** Default `"Episodes"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
