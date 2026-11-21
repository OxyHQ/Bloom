import {
  BrowseGrid,
  LibraryItem,
  LibraryPanel,
  RecentSearches,
  SearchField,
  SearchResultTabs,
  TopResultCard,
} from '@oxy.so/bloom/music-library';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const COVER = 'https://cdn.oxy.so/cover.jpg';
const LIBRARY = [
  {
    id: 'liked',
    title: 'Liked Songs',
    kind: 'playlist' as const,
    meta: 'Playlist · 412 songs',
    cover: COVER,
    pinned: true,
    downloaded: true,
  },
  { id: 'night', title: 'Night Drive', kind: 'playlist' as const, subtitle: 'Maya', cover: COVER },
  { id: 'lumen', title: 'Lumen Vale', kind: 'artist' as const, cover: COVER },
  { id: 'tide', title: 'Tidewater Hymns', kind: 'album' as const, subtitle: 'The Quiet Orchard' },
];
const ENTRY = LIBRARY[1] as (typeof LIBRARY)[number];
const TABS = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'artists', label: 'Artists' },
];
const RECENT = [
  { id: 'a', title: 'Lumen Vale', meta: 'Artist', cover: COVER, round: true },
  { id: 'b', title: 'Night Drive', meta: 'Song · Lumen Vale', cover: COVER },
];
const TILES = [
  { id: 'pop', title: 'Pop', color: '#8d67ab' },
  { id: 'jazz', title: 'Jazz', color: '#1e3264', image: COVER },
];

export const MUSIC_LIBRARY_CASES: ParityCase[] = [
  {
    name: 'LibraryPanel',
    language: () =>
      toElement(
        L.LibraryPanel(LIBRARY, {
          selectedId: 'night',
          nowPlayingId: 'liked',
          onItemPress: press,
          onCreatePress: press,
          onExpandedChange: set,
          emptyState: L.Text('Nothing yet'),
        }),
      ),
    bloom: () => (
      <LibraryPanel
        items={LIBRARY}
        selectedId="night"
        nowPlayingId="liked"
        onItemPress={press}
        onCreatePress={press}
        onExpandedChange={set}
        emptyState={<Text>Nothing yet</Text>}
      />
    ),
  },
  {
    name: 'LibraryPanel collapsed, a grid',
    language: () =>
      toElement(L.LibraryPanel(LIBRARY, { collapsed: true, onCollapsedChange: set, view: 'grid' })),
    bloom: () => <LibraryPanel items={LIBRARY} collapsed onCollapsedChange={set} view="grid" />,
  },
  {
    name: 'LibraryPanel empty',
    language: () =>
      toElement(
        L.LibraryPanel([], { query: 'zzz', onQueryChange: set, emptyState: L.Text('None') }),
      ),
    bloom: () => (
      <LibraryPanel items={[]} query="zzz" onQueryChange={set} emptyState={<Text>None</Text>} />
    ),
  },
  ...ENUMS.libraryItemStyle.map((variant) => ({
    name: `LibraryItem ${variant}`,
    language: () =>
      toElement(L.LibraryItem(ENTRY, { selected: true }).style(variant).onPress(press)),
    bloom: () => <LibraryItem item={ENTRY} selected variant={variant} onPress={press} />,
  })),
  {
    name: 'LibraryItem now playing, paused',
    language: () => toElement(L.LibraryItem(ENTRY, { nowPlaying: true, paused: true })),
    bloom: () => <LibraryItem item={ENTRY} nowPlaying paused />,
  },
  {
    name: 'SearchField',
    language: () =>
      toElement(L.SearchField(['lumen', set], { onClear: press, onBrowsePress: press })),
    bloom: () => (
      <SearchField value="lumen" onChangeText={set} onClear={press} onBrowsePress={press} />
    ),
  },
  {
    name: 'SearchField empty, browsing, named',
    language: () =>
      toElement(
        L.SearchField(['', set], { onBrowsePress: press, browseActive: true }).label('Find'),
      ),
    bloom: () => (
      <SearchField
        value=""
        onChangeText={set}
        onBrowsePress={press}
        browseActive
        accessibilityLabel="Find"
      />
    ),
  },
  {
    name: 'TopResultCard',
    language: () =>
      toElement(
        L.TopResultCard('Lumen Vale', 'artist', { cover: COVER, onPlayPress: press }).onPress(
          press,
        ),
      ),
    bloom: () => (
      <TopResultCard
        title="Lumen Vale"
        kind="artist"
        cover={COVER}
        onPlayPress={press}
        onPress={press}
      />
    ),
  },
  {
    name: 'TopResultCard a song, playing',
    language: () =>
      toElement(
        L.TopResultCard('Night Drive', 'song', {
          subtitle: 'Lumen Vale',
          playing: true,
          onPlayPress: press,
        }),
      ),
    bloom: () => (
      <TopResultCard
        title="Night Drive"
        kind="song"
        subtitle="Lumen Vale"
        playing
        onPlayPress={press}
      />
    ),
  },
  {
    name: 'SearchResultTabs',
    language: () => toElement(L.SearchResultTabs(['songs', set], TABS)),
    bloom: () => <SearchResultTabs tabs={TABS} value="songs" onValueChange={set} />,
  },
  {
    name: 'RecentSearches',
    language: () =>
      toElement(
        L.RecentSearches(RECENT, { onItemPress: press, onRemove: press, onClearAll: press }),
      ),
    bloom: () => (
      <RecentSearches items={RECENT} onItemPress={press} onRemove={press} onClearAll={press} />
    ),
  },
  {
    name: 'BrowseGrid',
    language: () =>
      toElement(
        L.BrowseGrid(TILES, {
          title: 'Browse all',
          onItemPress: press,
          minTileWidth: '160',
        }).spacing('md'),
      ),
    bloom: () => (
      <BrowseGrid
        items={TILES}
        title="Browse all"
        onItemPress={press}
        minTileWidth={160}
        gap={12}
      />
    ),
  },
  {
    name: 'BrowseGrid of its own cells',
    language: () =>
      toElement(L.BrowseGrid([], { children: [L.Text('Pop').id('a'), L.Text('Jazz').id('b')] })),
    bloom: () => (
      <BrowseGrid items={[]}>
        <Text key="a">Pop</Text>
        <Text key="b">Jazz</Text>
      </BrowseGrid>
    ),
  },
];
