import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { LibraryKindLabels, LibraryPanelLabels, TopResultKind } from './types';

/**
 * Every fixed string the music-library family draws or announces, in each
 * Bloom language. A caller's `labels` (or `*Label`) prop still wins over any
 * entry here; "Show more" / "Show less" come from `COMMON_MESSAGES`.
 */
export interface MusicLibraryMessages {
  /** The kind names in a meta line ("Playlist · Maya"). */
  kinds: LibraryKindLabels;
  /** `LibraryPanel`'s strings, less the kinds and the common expand / collapse words. */
  library: Omit<LibraryPanelLabels, 'kind' | 'expand' | 'collapse'>;
  /** `LibraryItem`'s spoken states. */
  item: { pinned: string; downloaded: string; nowPlaying: string };
  /** `SearchField`. */
  search: { placeholder: string; clear: string; browse: string };
  /** `SearchResultTabs`' name. */
  resultTypes: string;
  /** `TopResultCard`'s type pill. */
  topResultKinds: Record<TopResultKind, string>;
  /** `RecentSearches`. */
  recent: { title: string; clearAll: string; remove: (title: string) => string };
}

export const MUSIC_LIBRARY_MESSAGES: MessageCatalog<MusicLibraryMessages> =
  defineMessages<MusicLibraryMessages>('MUSIC_LIBRARY_MESSAGES', {
    kinds: {
      playlist: 'Playlist',
      artist: 'Artist',
      album: 'Album',
      podcast: 'Podcast',
      audiobook: 'Audiobook',
      folder: 'Folder',
    },
    library: {
      title: 'Your Library',
      create: 'Create playlist or folder',
      collapseRail: 'Collapse Your Library',
      expandRail: 'Open Your Library',
      filters: 'Filters',
      clearFilters: 'Clear filters',
      filter: {
        playlists: 'Playlists',
        artists: 'Artists',
        albums: 'Albums',
        podcasts: 'Podcasts',
        audiobooks: 'Audiobooks',
      },
      downloaded: 'Downloaded',
      search: 'Search in Your Library',
      searchPlaceholder: 'Search in Your Library',
      clearSearch: 'Clear search',
      sortAndView: 'Sort and view',
      sortBy: 'Sort by',
      viewAs: 'View as',
      sort: {
        recents: 'Recents',
        'recently-added': 'Recently added',
        alphabetical: 'Alphabetical',
        creator: 'Creator',
      },
      view: { compact: 'Compact', list: 'List', grid: 'Grid' },
      empty: 'Nothing here yet',
    },
    item: { pinned: 'Pinned', downloaded: 'Downloaded', nowPlaying: 'Now playing' },
    search: { placeholder: 'What do you want to play?', clear: 'Clear search', browse: 'Browse' },
    resultTypes: 'Result types',
    topResultKinds: {
      song: 'Song',
      artist: 'Artist',
      album: 'Album',
      playlist: 'Playlist',
      podcast: 'Podcast',
      episode: 'Episode',
      audiobook: 'Audiobook',
      profile: 'Profile',
    },
    recent: {
      title: 'Recent searches',
      clearAll: 'Clear recent searches',
      remove: (title) => `Remove ${title}`,
    },
  });
