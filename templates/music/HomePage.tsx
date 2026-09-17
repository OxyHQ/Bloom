import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../../src/avatar';
import { AudiobookCard, QuickAccessTile } from '../../src/media-card';
import { gradientStyle, resolveMediaHeaderPaint } from '../../src/media-header/shared';
import { FilterChips, Shelf } from '../../src/media-shelf';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import {
  ALBUM_BY_ID,
  ALBUMS,
  ARTIST_BY_ID,
  ARTISTS,
  AUDIOBOOKS,
  EPISODES,
  EVENTS,
  GREETING,
  ME,
  MIXES,
  MIX_BY_ID,
  PLAYLIST_BY_ID,
  SHOW_BY_ID,
  SHOWS,
} from './data';
import {
  AlbumTile,
  ArtistTile,
  EpisodeTile,
  EventTile,
  MixTile,
  PageBody,
  PageScroll,
  PlaylistTile,
  PodcastTile,
  albumPlay,
  artistPlay,
  mixPlay,
  playlistPlay,
  showPlay,
  useContextPlay,
  useMusicLayout,
} from './parts';
import { usePlayer, usePosition, type PlayContext, type Playable } from './PlayerContext';
import { useMusicRouter, type MusicRoute } from './router';

/**
 * Home: a greeting over a band tinted from what is playing, the feed filter,
 * the quick-access grid and the shelves — mixes made for the listener,
 * episodes to finish, new releases, artists, shows, audiobooks and concerts
 * nearby. Every play button here drives the shared player.
 */

type HomeFilter = 'all' | 'music' | 'podcasts' | 'audiobooks';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'audiobooks', label: 'Audiobooks' },
];

interface QuickItem {
  id: string;
  title: string;
  artwork: string;
  artworkColor: string;
  round?: boolean;
  typeLabel: string;
  route: MusicRoute;
  play: { items: Playable[]; context: PlayContext };
}

function quickItems(): QuickItem[] {
  const liked = PLAYLIST_BY_ID['late-night-drive']!;
  const album = ALBUM_BY_ID['lanterns-over-kessel-bay']!;
  const artist = ARTIST_BY_ID['lumen-vale']!;
  const mix = MIX_BY_ID['evening-mix']!;
  const show = SHOW_BY_ID['quiet-cartography']!;
  const album2 = ALBUM_BY_ID['brass-and-honey']!;
  const focus = PLAYLIST_BY_ID['deep-focus']!;
  const thisWeek = MIX_BY_ID['this-week']!;
  return [
    {
      id: liked.id,
      title: liked.title,
      artwork: liked.artwork!,
      artworkColor: liked.artworkColor,
      typeLabel: 'Playlist',
      route: { name: 'playlist', id: liked.id },
      play: playlistPlay(liked),
    },
    {
      id: album.id,
      title: album.title,
      artwork: album.artwork,
      artworkColor: album.artworkColor,
      typeLabel: 'Album',
      route: { name: 'album', id: album.id },
      play: albumPlay(album),
    },
    {
      id: artist.id,
      title: artist.name,
      artwork: artist.photo,
      artworkColor: artist.artworkColor,
      round: true,
      typeLabel: 'Artist',
      route: { name: 'artist', id: artist.id },
      play: artistPlay(artist),
    },
    {
      id: mix.id,
      title: mix.title,
      artwork: ALBUMS[1]!.artwork,
      artworkColor: mix.artworkColor,
      typeLabel: 'Mix',
      route: { name: 'mix', id: mix.id },
      play: mixPlay(mix),
    },
    {
      id: show.id,
      title: show.title,
      artwork: show.artwork,
      artworkColor: show.artworkColor,
      typeLabel: 'Podcast',
      route: { name: 'podcast', id: show.id },
      play: showPlay(show),
    },
    {
      id: album2.id,
      title: album2.title,
      artwork: album2.artwork,
      artworkColor: album2.artworkColor,
      typeLabel: 'Album',
      route: { name: 'album', id: album2.id },
      play: albumPlay(album2),
    },
    {
      id: focus.id,
      title: focus.title,
      artwork: focus.artwork!,
      artworkColor: focus.artworkColor,
      typeLabel: 'Playlist',
      route: { name: 'playlist', id: focus.id },
      play: playlistPlay(focus),
    },
    {
      id: thisWeek.id,
      title: thisWeek.title,
      artwork: ALBUMS[6]!.artwork,
      artworkColor: thisWeek.artworkColor,
      typeLabel: 'Mix',
      route: { name: 'mix', id: thisWeek.id },
      play: mixPlay(thisWeek),
    },
  ];
}

const QUICK = quickItems();

function QuickTile({ item }: { item: QuickItem }) {
  const router = useMusicRouter();
  const { mobile } = useMusicLayout();
  const state = useContextPlay(item.play);
  return (
    <QuickAccessTile
      title={item.title}
      artwork={item.artwork}
      artworkColor={item.artworkColor}
      round={item.round}
      typeLabel={item.typeLabel}
      onPress={() => router.navigate(item.route)}
      current={state.current}
      playing={state.playing}
      // On a phone the title needs the tile's width: the play slot is drawn only for the playing item.
      onPlay={mobile && !state.current ? undefined : state.onPlay}
    />
  );
}

function QuickGrid() {
  const [width, setWidth] = useState(0);
  const columns = width >= 1060 ? 4 : width >= 700 ? 3 : 2;
  const gap = 8;
  const tile = width > 0 ? (width - gap * (columns - 1)) / columns : 0;
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}
      accessibilityLabel="Jump back in"
      role="list"
    >
      {width > 0
        ? QUICK.map((item) => (
            <View key={item.id} role="listitem" style={{ width: tile }}>
              <QuickTile item={item} />
            </View>
          ))
        : null}
    </View>
  );
}

/** Episodes in progress; its own component because the progress bars read the clock. */
function ContinueListening({ size }: { size: 'small' | 'medium' | 'large' }) {
  const position = usePosition();
  const { gutter } = useMusicLayout();
  const inProgress = EPISODES.filter((e) => e.progress !== undefined).slice(0, 6);
  return (
    <Shelf title="Continue listening" subtitle="Pick up where you left off" contentInset={gutter}>
      {inProgress.map((episode) => (
        <EpisodeTile key={episode.id} id={episode.id} size={size} position={position} />
      ))}
    </Shelf>
  );
}

export function HomePage() {
  const theme = useTheme();
  const player = usePlayer();
  const router = useMusicRouter();
  const { mobile, gutter, tileSize } = useMusicLayout();
  const [filter, setFilter] = useState<HomeFilter>('all');
  const paint = resolveMediaHeaderPaint(theme, player.current?.artworkColor ?? ME.artworkColor);
  const music = filter === 'all' || filter === 'music';
  const podcasts = filter === 'all' || filter === 'podcasts';
  const audiobooks = filter === 'all' || filter === 'audiobooks';

  return (
    <PageScroll testID="music-home" back={false}>
      <View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
          gradientStyle([paint.bandTop, theme.colors.background]),
        ]}
      />
      <View style={{ paddingTop: mobile ? 16 : 20, gap: 24 }}>
        <PageBody gap={20}>
          {mobile ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${ME.name}, profile`}
                onPress={() => router.navigate({ name: 'profile' })}
              >
                <Avatar source={ME.avatar} name={ME.name} size={32} />
              </Pressable>
              <FilterChips
                options={FILTERS}
                value={filter}
                onValueChange={(v) => setFilter((v ?? 'all') as HomeFilter)}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <>
              <FilterChips
                options={FILTERS}
                value={filter}
                onValueChange={(v) => setFilter((v ?? 'all') as HomeFilter)}
              />
              <Text role="heading" aria-level={1} variant="title-1-bold" style={{ color: paint.onBand }}>
                {GREETING}
              </Text>
            </>
          )}
          {mobile ? (
            <Text role="heading" aria-level={1} variant="title-2-bold" style={{ color: paint.onBand }}>
              {GREETING}
            </Text>
          ) : null}
          <QuickGrid />
        </PageBody>

        <PageBody gap={mobile ? 28 : 36}>
          {music ? (
            <Shelf
              title={ME.name}
              eyebrow="Made for"
              eyebrowAvatar={ME.avatar}
              onShowAll={() => {}}
              contentInset={gutter}
            >
              {MIXES.map((mix) => (
                <MixTile key={mix.id} id={mix.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {podcasts ? <ContinueListening size={tileSize} /> : null}
          {music ? (
            <Shelf title="New releases" subtitle="From artists you follow" onShowAll={() => {}} contentInset={gutter}>
              {ALBUMS.filter((a) => a.year === '2026').map((album) => (
                <AlbumTile key={album.id} id={album.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {music ? (
            <Shelf title="Your favourite artists" onShowAll={() => {}} contentInset={gutter}>
              {ARTISTS.map((artist) => (
                <ArtistTile key={artist.id} id={artist.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {music ? (
            <Shelf title="Playlists for tonight" contentInset={gutter}>
              {['late-night-drive', 'rainy-trams', 'kitchen-soul', 'deep-focus', 'sunday-market', 'harbour-run'].map(
                (id) => (
                  <PlaylistTile key={id} id={id} size={tileSize} />
                ),
              )}
            </Shelf>
          ) : null}
          {podcasts ? (
            <Shelf title="Shows you might like" onShowAll={() => {}} contentInset={gutter}>
              {SHOWS.map((show) => (
                <PodcastTile key={show.id} id={show.id} size={tileSize} />
              ))}
            </Shelf>
          ) : null}
          {audiobooks ? (
            <Shelf title="Audiobooks for you" contentInset={gutter}>
              {AUDIOBOOKS.map((book) => (
                <AudiobookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  narrator={book.narrator}
                  duration={book.duration}
                  progress={book.progress}
                  artwork={book.artwork}
                  artworkColor={book.artworkColor}
                  size={tileSize}
                />
              ))}
            </Shelf>
          ) : null}
          {music ? (
            <Shelf title="Live near you" subtitle="Port Aldern and nearby" onShowAll={() => {}} contentInset={gutter}>
              {EVENTS.map((event) => (
                <EventTile key={event.id} event={event} size={mobile ? 'medium' : 'large'} />
              ))}
            </Shelf>
          ) : null}
        </PageBody>
      </View>
    </PageScroll>
  );
}
