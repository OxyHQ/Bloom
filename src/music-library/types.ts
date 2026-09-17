import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
//  Library data
// ---------------------------------------------------------------------------

/** What a library entry is. `artist` draws a round cover; everything else a rounded square. */
export type LibraryItemKind = 'playlist' | 'artist' | 'album' | 'podcast' | 'audiobook' | 'folder';

/** A library filter chip. `folder` entries count as playlists. */
export type LibraryFilter = 'playlists' | 'artists' | 'albums' | 'podcasts' | 'audiobooks';

/**
 * `recents` — last played first; `recently-added` — newest `addedAt` first;
 * `alphabetical` — by title; `creator` — by `creator` (or `subtitle`), then title.
 */
export type LibrarySort = 'recents' | 'recently-added' | 'alphabetical' | 'creator';

/** `compact` — text rows, no covers; `list` — 48 covers; `grid` — cover tiles. */
export type LibraryView = 'compact' | 'list' | 'grid';

export interface LibraryEntry {
  id: string;
  title: string;
  kind: LibraryItemKind;
  /** Who made it — the owner, artist, show or author. Drawn after the kind: "Playlist · Maya". */
  subtitle?: string;
  /** Replaces the composed "Playlist · Maya" line entirely. */
  meta?: string;
  /** A URL, or an ImageResolver id. Empty draws a neutral tile with the kind's glyph. */
  cover?: string | null;
  /** Pinned entries sort before everything else, whatever the sort. */
  pinned?: boolean;
  /** Draws the downloaded glyph and matches the Downloaded filter. */
  downloaded?: boolean;
  /** Epoch ms. Sort key for `recently-added`. */
  addedAt?: number;
  /** Epoch ms. Sort key for `recents`; never played sorts last. */
  lastPlayedAt?: number;
  /** Sort key for `creator`. Default: `subtitle`. */
  creator?: string;
}

/** The kind names drawn in meta lines. Translate them. */
export type LibraryKindLabels = Record<LibraryItemKind, string>;

// ---------------------------------------------------------------------------
//  LibraryItem
// ---------------------------------------------------------------------------

/** `rail` — the cover alone, for the collapsed panel. */
export type LibraryItemVariant = LibraryView | 'rail';

export interface LibraryItemProps {
  item: LibraryEntry;
  /** Default `list`. */
  variant?: LibraryItemVariant;
  /** The open page: a neutral fill and `aria-current="page"`. */
  selected?: boolean;
  /** This entry is the playing context: accent title and the now-playing bars. */
  nowPlaying?: boolean;
  /** With `nowPlaying`: the bars stand still. */
  paused?: boolean;
  onPress?: (item: LibraryEntry) => void;
  /** Context-menu rows (`ContextMenuItem`s). Right-click on web, long press on native. */
  contextMenu?: ReactNode;
  kindLabels?: Partial<LibraryKindLabels>;
  /** Appended to the name while pinned. Default `"Pinned"`. */
  pinnedLabel?: string;
  /** Appended to the name while downloaded. Default `"Downloaded"`. */
  downloadedLabel?: string;
  /** Appended to the name while now playing. Default `"Now playing"`. */
  nowPlayingLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  LibraryPanel
// ---------------------------------------------------------------------------

export interface LibraryPanelLabels {
  title: string;
  create: string;
  expand: string;
  collapse: string;
  collapseRail: string;
  expandRail: string;
  filters: string;
  clearFilters: string;
  filter: Record<LibraryFilter, string>;
  downloaded: string;
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  sortAndView: string;
  sortBy: string;
  viewAs: string;
  sort: Record<LibrarySort, string>;
  view: Record<LibraryView, string>;
  empty: string;
  kind: LibraryKindLabels;
}

export interface LibraryPanelProps {
  items: LibraryEntry[];

  /** The active kind filter, or `null`. Uncontrolled when omitted. */
  filter?: LibraryFilter | null;
  onFilterChange?: (filter: LibraryFilter | null) => void;
  /** The Downloaded chip. Uncontrolled when omitted. */
  downloadedOnly?: boolean;
  onDownloadedOnlyChange?: (downloadedOnly: boolean) => void;
  /** Default `recents`. Uncontrolled when omitted. */
  sort?: LibrarySort;
  onSortChange?: (sort: LibrarySort) => void;
  /** Default `list`. Uncontrolled when omitted. */
  view?: LibraryView;
  onViewChange?: (view: LibraryView) => void;
  /** The in-library search. Uncontrolled when omitted. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Which filter chips to draw, in order. Default: all five, then Downloaded. */
  filters?: LibraryFilter[];
  /** Hides the Downloaded chip. */
  hideDownloadedFilter?: boolean;

  /** The rail: covers only, with tooltips on web. */
  collapsed?: boolean;
  /** Draws the rail toggle (the library glyph) and reports it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Whether the panel is widened. Draws the expand toggle when `onExpandedChange` is set. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Draws the + button. */
  onCreatePress?: () => void;

  /** The open page's entry. */
  selectedId?: string;
  /** The playing context's entry. */
  nowPlayingId?: string;
  /** With `nowPlayingId`: the bars stand still. */
  paused?: boolean;
  onItemPress?: (item: LibraryEntry) => void;
  /** Context-menu rows for an entry. */
  renderContextMenu?: (item: LibraryEntry) => ReactNode;

  /** Every string the panel draws. Merged over the English defaults. */
  labels?: Partial<Omit<LibraryPanelLabels, 'filter' | 'sort' | 'view' | 'kind'>> & {
    filter?: Partial<Record<LibraryFilter, string>>;
    sort?: Partial<Record<LibrarySort, string>>;
    view?: Partial<Record<LibraryView, string>>;
    kind?: Partial<LibraryKindLabels>;
  };
  /** Replaces the "Nothing here" line when the filtered list is empty. */
  emptyState?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Search
// ---------------------------------------------------------------------------

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Called by the clear button. The field is controlled — clear `value` here. */
  onClear?: () => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Draws the browse button on the right. */
  onBrowsePress?: () => void;
  /** The browse page is open: the button is filled and `aria-pressed`. */
  browseActive?: boolean;
  /** Default `"What do you want to play?"`. */
  placeholder?: string;
  /** The field's name. Default `"Search"`. */
  accessibilityLabel?: string;
  /** Default `"Clear search"`. */
  clearLabel?: string;
  /** Default `"Browse"`. */
  browseLabel?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type TopResultKind = 'song' | 'artist' | 'album' | 'playlist' | 'podcast' | 'episode' | 'audiobook' | 'profile';

export interface TopResultCardProps {
  title: string;
  /** Round cover for `artist` and `profile`. */
  kind: TopResultKind;
  /** The type pill's text. Default: the kind, capitalised in English ("Artist"). */
  kindLabel?: string;
  /** The line beside the pill — an artist, an owner. */
  subtitle?: string;
  /** A URL or an ImageResolver id. */
  cover?: string | null;
  onPress?: () => void;
  /** Draws the play button (on web it appears on hover and focus). */
  onPlayPress?: () => void;
  /** The play button draws pause. */
  playing?: boolean;
  /** The card's name. Default: `"<title>, <kindLabel>"` plus the subtitle. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SearchResultTab {
  value: string;
  label: string;
}

export interface SearchResultTabsProps {
  tabs: SearchResultTab[];
  value: string;
  onValueChange: (value: string) => void;
  /** The tablist's name. Default `"Result types"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface RecentSearchEntry {
  id: string;
  title: string;
  /** "Artist", "Song · Lumen Vale". */
  meta?: string;
  cover?: string | null;
  /** Round cover. */
  round?: boolean;
}

export interface RecentSearchesProps {
  items: RecentSearchEntry[];
  onItemPress?: (item: RecentSearchEntry) => void;
  onRemove?: (item: RecentSearchEntry) => void;
  /** Draws the "Clear recent searches" button. */
  onClearAll?: () => void;
  /** Default `"Recent searches"`. */
  title?: string;
  /** Default `"Clear recent searches"`. */
  clearAllLabel?: string;
  /** The remove button's name, given the entry. Default `"Remove <title>"`. */
  removeLabel?: (item: RecentSearchEntry) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BrowseTile {
  id: string;
  title: string;
  /** The tile's colour (hex or rgb). The title picks white or near-black for contrast. */
  color: string;
  /** Drawn tilted in the bottom-right corner. */
  image?: string | null;
}

export interface BrowseGridProps {
  /** Colour tiles. Ignored when `children` is given. */
  items?: BrowseTile[];
  /** Your own tiles (a genre card from another family); each child becomes one cell. */
  children?: ReactNode;
  onItemPress?: (item: BrowseTile) => void;
  /** Columns are as many as fit at this width. Default `128` (two columns on a phone). */
  minTileWidth?: number;
  /** Default `16` (12 under 480 wide). */
  gap?: number;
  /** A heading above the grid, e.g. "Browse all". */
  title?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
