import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { RiSearchLine } from '../../src/icons/remix';
import { GenreCard } from '../../src/media-card';
import { Shelf } from '../../src/media-shelf';
import {
  BrowseGrid,
  RecentSearches,
  SearchField,
  SearchResultTabs,
  TopResultCard,
  type RecentSearchEntry,
} from '../../src/music-library';
import { TrackList, TrackListEmpty } from '../../src/track-list';
import { Text } from '../../src/typography';
import { ALBUMS, ARTISTS, EPISODES, GENRES, PLAYLISTS, RECENT_SEARCHES, SHOWS, TRACKS, ARTIST_BY_ID } from './data';
import {
  AlbumTile,
  ArtistTile,
  EpisodeTile,
  PageBody,
  PageScroll,
  PlaylistTile,
  PodcastTile,
  SectionTitle,
  albumPlay,
  artistPlay,
  useContextPlay,
  useMusicLayout,
  usePageWidth,
} from './parts';
import { playableFromTrack, toListTrack, usePlayer, usePosition } from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * Search. Empty: recent searches and the browse grid of genres. With a query:
 * the result tabs, the top result beside the best songs, then artists, albums,
 * playlists and shows. On desktop the search pill lives in the frame's top bar;
 * on a phone it heads the page.
 */

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'artists', label: 'Artists' },
  { value: 'albums', label: 'Albums' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'podcasts', label: 'Podcasts & shows' },
];

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function SearchPage({ query = '' }: { query?: string }) {
  const router = useMusicRouter();
  const { mobile } = useMusicLayout();
  const [recent, setRecent] = useState<RecentSearchEntry[]>(RECENT_SEARCHES);
  const trimmed = query.trim();

  return (
    <PageScroll testID="music-search" back={false}>
      <View style={{ paddingTop: mobile ? 16 : 24 }}>
        <PageBody gap={24}>
          {mobile ? (
            <View style={{ gap: 16 }}>
              <Text role="heading" aria-level={1} variant="title-1-bold">
                Search
              </Text>
              <SearchField
                testID="music-search-field-mobile"
                value={query}
                onChangeText={(text) => router.replace({ name: 'search', query: text })}
                onClear={() => router.replace({ name: 'search', query: '' })}
              />
            </View>
          ) : null}
          {trimmed ? (
            <SearchResults key={trimmed} query={trimmed} />
          ) : (
            <>
              {recent.length > 0 ? (
                <RecentSearches
                  items={recent}
                  onItemPress={(item) => router.replace({ name: 'search', query: item.title })}
                  onRemove={(item) => setRecent((list) => list.filter((x) => x.id !== item.id))}
                  onClearAll={() => setRecent([])}
                  style={{ maxWidth: 640 }}
                />
              ) : null}
              <BrowseGrid title="Browse all" minTileWidth={mobile ? 150 : 180} gap={mobile ? 12 : 16}>
                {GENRES.map((genre) => (
                  <GenreCard
                    key={genre.id}
                    title={genre.title}
                    color={genre.color}
                    artwork={genre.artwork}
                    onPress={() =>
                      router.replace({ name: 'search', query: genre.title === 'Podcasts' ? 'Quiet' : 'Harbour' })
                    }
                    style={{ width: '100%' }}
                  />
                ))}
              </BrowseGrid>
            </>
          )}
        </PageBody>
      </View>
    </PageScroll>
  );
}

function SearchResults({ query }: { query: string }) {
  const player = usePlayer();
  const router = useMusicRouter();
  const position = usePosition();
  const { mobile, gutter, tileSize } = useMusicLayout();
  const pageWidth = usePageWidth();
  const [tab, setTab] = useState('all');

  const results = useMemo(() => {
    const artists = ARTISTS.filter((a) => matches(a.name, query));
    const albums = ALBUMS.filter((a) => matches(a.title, query) || matches(ARTIST_BY_ID[a.artistId]!.name, query));
    const tracks = TRACKS.filter(
      (t) => matches(t.title, query) || t.artistIds.some((id) => matches(ARTIST_BY_ID[id]!.name, query)),
    );
    const playlists = PLAYLISTS.filter((p) => matches(p.title, query) || matches(p.description, query));
    const shows = SHOWS.filter((s) => matches(s.title, query) || matches(s.publisher, query));
    const episodes = EPISODES.filter((e) => matches(e.title, query));
    return { artists, albums, tracks, playlists, shows, episodes };
  }, [query]);

  const total = Object.values(results).reduce((n, list) => n + list.length, 0);
  const songIds = results.tracks.map((t) => t.id);
  const songContext = { id: `search-${query}`, name: `“${query}”`, type: 'search' };
  const songItems = useMemo(() => results.tracks.map(playableFromTrack), [results.tracks]);

  const topArtist = results.artists[0];
  const topAlbum = results.albums[0];
  const topPlay = topArtist
    ? artistPlay(topArtist)
    : topAlbum
      ? albumPlay(topAlbum)
      : { items: songItems.slice(0, 1), context: songContext };
  const topState = useContextPlay(topPlay);

  if (total === 0) {
    return (
      <TrackListEmpty
        icon={RiSearchLine}
        title={`No results found for “${query}”`}
        description="Check the spelling, or try fewer or different words."
      />
    );
  }

  const songsTable = (limit: number, compact: boolean) => (
    <TrackList
      testID="music-search-songs"
      tracks={results.tracks.slice(0, limit).map((t) => toListTrack(t, player.liked.has(t.id)))}
      columns={compact ? ['title', 'duration', 'actions'] : ['index', 'title', 'album', 'duration', 'actions']}
      density={compact ? 'compact' : 'comfortable'}
      showHeader={!compact}
      selectable={false}
      accessibilityLabel="Songs"
      currentTrackId={player.context?.id === songContext.id ? player.current?.id : undefined}
      isPlaying={player.playing}
      onPlay={(_, index) => player.play(songItems, index, songContext)}
      onPause={player.toggle}
      onLikedChange={(track, liked) => player.setLiked(track.id, liked)}
      onArtistPress={(artist) => artist.id && router.navigate({ name: 'artist', id: artist.id })}
    />
  );

  const side = pageWidth >= 900 && !mobile;

  return (
    <View style={{ gap: 28 }}>
      <SearchResultTabs tabs={TABS} value={tab} onValueChange={setTab} />

      {tab === 'all' ? (
        <>
          <View style={{ flexDirection: side ? 'row' : 'column', gap: 24 }}>
            <View style={{ width: side ? 380 : '100%', gap: 12 }}>
              <SectionTitle>Top result</SectionTitle>
              {topArtist ? (
                <TopResultCard
                  testID="music-top-result"
                  title={topArtist.name}
                  kind="artist"
                  subtitle={`${topArtist.listeners} monthly listeners`}
                  cover={topArtist.photo}
                  onPress={() => router.navigate({ name: 'artist', id: topArtist.id })}
                  onPlayPress={topState.onPlay}
                  playing={topState.playing}
                />
              ) : topAlbum ? (
                <TopResultCard
                  testID="music-top-result"
                  title={topAlbum.title}
                  kind="album"
                  subtitle={ARTIST_BY_ID[topAlbum.artistId]!.name}
                  cover={topAlbum.artwork}
                  onPress={() => router.navigate({ name: 'album', id: topAlbum.id })}
                  onPlayPress={topState.onPlay}
                  playing={topState.playing}
                />
              ) : results.shows[0] ? (
                <TopResultCard
                  testID="music-top-result"
                  title={results.shows[0].title}
                  kind="podcast"
                  subtitle={results.shows[0].publisher}
                  cover={results.shows[0].artwork}
                  onPress={() => router.navigate({ name: 'podcast', id: results.shows[0]!.id })}
                />
              ) : results.tracks[0] ? (
                <TopResultCard
                  testID="music-top-result"
                  title={results.tracks[0].title}
                  kind="song"
                  subtitle={ARTIST_BY_ID[results.tracks[0].artistIds[0]!]!.name}
                  cover={songItems[0]!.artwork}
                  onPlayPress={topState.onPlay}
                  playing={topState.playing}
                />
              ) : null}
            </View>
            {songIds.length > 0 ? (
              <View style={{ flex: side ? 1 : undefined, minWidth: 0, gap: 12 }}>
                <SectionTitle>Songs</SectionTitle>
                {songsTable(4, true)}
              </View>
            ) : null}
          </View>
          {results.artists.length > 0 ? (
            <Shelf title="Artists" onShowAll={() => setTab('artists')} contentInset={gutter}>
              {results.artists.map((a) => (
                <ArtistTile key={a.id} id={a.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {results.albums.length > 0 ? (
            <Shelf title="Albums" onShowAll={() => setTab('albums')} contentInset={gutter}>
              {results.albums.map((a) => (
                <AlbumTile key={a.id} id={a.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {results.playlists.length > 0 ? (
            <Shelf title="Playlists" onShowAll={() => setTab('playlists')} contentInset={gutter}>
              {results.playlists.map((p) => (
                <PlaylistTile key={p.id} id={p.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {results.shows.length > 0 ? (
            <Shelf title="Podcasts" onShowAll={() => setTab('podcasts')} contentInset={gutter}>
              {results.shows.map((s) => (
                <PodcastTile key={s.id} id={s.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {results.episodes.length > 0 ? (
            <Shelf title="Episodes" contentInset={gutter}>
              {results.episodes.slice(0, 8).map((e) => (
                <EpisodeTile key={e.id} id={e.id} size={tileSize} position={position} />
              ))}
            </Shelf>
          ) : null}
        </>
      ) : null}

      {tab === 'songs' ? songsTable(50, false) : null}
      {tab === 'artists' ? (
        <Shelf title="Artists" layout="grid" rows={Infinity} minItemWidth={mobile ? 140 : 184} contentInset={0}>
          {results.artists.map((a) => (
            <ArtistTile key={a.id} id={a.id} size={tileSize} />
          ))}
        </Shelf>
      ) : null}
      {tab === 'albums' ? (
        <Shelf title="Albums" layout="grid" rows={Infinity} minItemWidth={mobile ? 140 : 184}>
          {results.albums.map((a) => (
            <AlbumTile key={a.id} id={a.id} size={tileSize} />
          ))}
        </Shelf>
      ) : null}
      {tab === 'playlists' ? (
        <Shelf title="Playlists" layout="grid" rows={Infinity} minItemWidth={mobile ? 140 : 184}>
          {results.playlists.map((p) => (
            <PlaylistTile key={p.id} id={p.id} size={tileSize} />
          ))}
        </Shelf>
      ) : null}
      {tab === 'podcasts' ? (
        <Shelf title="Podcasts & shows" layout="grid" rows={Infinity} minItemWidth={mobile ? 140 : 184}>
          {results.shows.map((s) => (
            <PodcastTile key={s.id} id={s.id} size={tileSize} />
          ))}
        </Shelf>
      ) : null}
    </View>
  );
}
