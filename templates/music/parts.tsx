import React, { createContext, useContext, useState } from 'react';
import { ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Button } from '../../src/button';
import { mixColor } from '../../src/button/shared';
import { RiArrowLeftSLine } from '../../src/icons/remix';
import {
  AlbumCard,
  ArtistCard,
  EpisodeCard,
  EventCard,
  MixCard,
  PlaylistCard,
  PodcastCard,
  type MediaCardSize,
} from '../../src/media-card';
import { BREAKPOINTS } from '../../src/styles/breakpoints';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import {
  ALBUM_BY_ID,
  ARTIST_BY_ID,
  EPISODE_BY_ID,
  MIX_BY_ID,
  PLAYLIST_BY_ID,
  SHOW_BY_ID,
  TRACK_BY_ID,
  episodesOf,
  popularTracksOf,
  type DemoAlbum,
  type DemoArtist,
  type DemoEpisode,
  type DemoMix,
  type DemoPlaylist,
  type DemoShow,
} from './data';
import {
  playableFromEpisode,
  playableFromTrack,
  playablesFromTrackIds,
  usePlayer,
  type PlayContext,
  type Playable,
} from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * The template's shared page pieces: the responsive layout numbers, the page
 * scroller, and each card wired to the player and the router — so a play
 * button anywhere in the template drives the one player, and a press opens the
 * page.
 */

// ---------------------------------------------------------------------------
//  Layout
// ---------------------------------------------------------------------------

export interface MusicLayout {
  width: number;
  /** Below 768: the phone layout. */
  mobile: boolean;
  /** Horizontal page padding. */
  gutter: number;
  /** Tile size for shelves. */
  tileSize: MediaCardSize;
}

export function useMusicLayout(): MusicLayout {
  const { width } = useWindowDimensions();
  const mobile = width < BREAKPOINTS.md;
  return { width, mobile, gutter: mobile ? 16 : 24, tileSize: mobile ? 'small' : 'medium' };
}

/**
 * The side panes' surface: the page background stepped toward the text colour,
 * the same step the library panel paints, so the three panes read as one set.
 */
export function usePaneSurface(): string {
  const theme = useTheme();
  return mixColor(theme.colors.background, theme.colors.text, theme.isDark ? 0.05 : 0.03);
}

/** Room the phone layout keeps under a page for the mini player and the tab bar. */
export const MOBILE_BOTTOM_CLEARANCE = 176;

export interface PageScrollProps {
  children: React.ReactNode;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Drawn over the top of the page (a sticky top bar). */
  overlay?: React.ReactNode;
  /** Phone: a floating back button over the top-left corner. Default `true`. */
  back?: boolean;
  testID?: string;
}

/** One page: it scrolls inside its pane, so the library, the side pane and the player stay put. */
export function PageScroll({ children, onScroll, overlay, back = true, testID }: PageScrollProps) {
  const { mobile, width: windowWidth } = useMusicLayout();
  const [width, setWidth] = useState(0);
  return (
    <View style={{ flex: 1, minHeight: 0 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <PageWidthContext.Provider value={width || windowWidth}>
        <ScrollView
          testID={testID}
          style={{ flex: 1 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: mobile ? MOBILE_BOTTOM_CLEARANCE : 32 }}
        >
          {children}
        </ScrollView>
        {mobile && back ? (
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <BackButton />
          </View>
        ) : null}
        {overlay ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            {overlay}
          </View>
        ) : null}
      </PageWidthContext.Provider>
    </View>
  );
}

const PageWidthContext = createContext<number>(0);

/** Renders `children` with the page pane's width, for a page component that sits above its own `PageScroll`. */
export function WithPageWidth({ children }: { children: (width: number) => React.ReactNode }) {
  return <>{children(usePageWidth())}</>;
}

/** The page pane's own width — narrower than the window beside the library and the side pane. */
export function usePageWidth(): number {
  const { width } = useMusicLayout();
  return useContext(PageWidthContext) || width;
}

/** Page padding plus the vertical rhythm between sections. */
export function PageBody({ children, gap = 32 }: { children: React.ReactNode; gap?: number }) {
  const { gutter } = useMusicLayout();
  return <View style={{ paddingLeft: gutter, paddingRight: gutter, gap }}>{children}</View>;
}

export function SectionTitle({ children, trailing }: { children: string; trailing?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text role="heading" aria-level={2} variant="title-2-bold" style={{ flex: 1 }}>
        {children}
      </Text>
      {trailing}
    </View>
  );
}

/** The round back button a phone page draws over its header. */
export function BackButton() {
  const router = useMusicRouter();
  if (!router.canGoBack) return null;
  return (
    <Button
      variant="secondary"
      size="small"
      iconOnly
      icon={RiArrowLeftSLine}
      accessibilityLabel="Back"
      onPress={router.back}
    />
  );
}

// ---------------------------------------------------------------------------
//  Playables per entity
// ---------------------------------------------------------------------------

export function albumPlay(album: DemoAlbum): { items: Playable[]; context: PlayContext } {
  return { items: playablesFromTrackIds(album.trackIds), context: { id: album.id, name: album.title, type: 'album' } };
}

export function playlistPlay(playlist: DemoPlaylist, trackIds = playlist.trackIds) {
  return {
    items: playablesFromTrackIds(trackIds),
    context: { id: playlist.id, name: playlist.title, type: 'playlist' } as PlayContext,
  };
}

export function mixPlay(mix: DemoMix) {
  return {
    items: playablesFromTrackIds(mix.trackIds),
    context: { id: mix.id, name: mix.title, type: 'playlist' } as PlayContext,
  };
}

export function artistPlay(artist: DemoArtist) {
  return {
    items: popularTracksOf(artist.id).map(playableFromTrack),
    context: { id: artist.id, name: artist.name, type: 'artist' } as PlayContext,
  };
}

export function showPlay(show: DemoShow) {
  return {
    items: episodesOf(show.id).map(playableFromEpisode),
    context: { id: show.id, name: show.title, type: 'podcast' } as PlayContext,
  };
}

/** Play/pause for a whole context, and whether it is the loaded one. */
export function useContextPlay(play: { items: Playable[]; context: PlayContext }) {
  const player = usePlayer();
  const current = player.context?.id === play.context.id && !!player.current;
  return {
    current,
    playing: current && player.playing,
    onPlay: () => player.playContext(play.items, play.context),
  };
}

// ---------------------------------------------------------------------------
//  Wired cards
// ---------------------------------------------------------------------------

export function AlbumTile({ id, size, showArtist = true }: { id: string; size?: MediaCardSize; showArtist?: boolean }) {
  const album = ALBUM_BY_ID[id]!;
  const router = useMusicRouter();
  const player = usePlayer();
  const state = useContextPlay(albumPlay(album));
  return (
    <AlbumCard
      title={album.title}
      artist={showArtist ? ARTIST_BY_ID[album.artistId]!.name : undefined}
      year={album.year}
      albumType={album.type}
      artwork={album.artwork}
      artworkColor={album.artworkColor}
      size={size}
      onPress={() => router.navigate({ name: 'album', id })}
      {...state}
      menuItems={[
        { label: 'Add to queue', onPress: () => player.addToQueue(albumPlay(album).items) },
        { label: 'Go to artist', onPress: () => router.navigate({ name: 'artist', id: album.artistId }) },
      ]}
    />
  );
}

export function PlaylistTile({ id, size }: { id: string; size?: MediaCardSize }) {
  const playlist = PLAYLIST_BY_ID[id]!;
  const router = useMusicRouter();
  const state = useContextPlay(playlistPlay(playlist));
  return (
    <PlaylistCard
      title={playlist.title}
      owner={playlist.owner}
      trackCount={`${playlist.trackIds.length} songs`}
      artwork={playlist.artwork}
      artworkColor={playlist.artworkColor}
      mosaic={
        playlist.artwork
          ? undefined
          : playlist.trackIds.slice(0, 4).map((t) => ALBUM_BY_ID[TRACK_BY_ID[t]!.albumId]!.artwork)
      }
      collaborative={playlist.collaborative}
      size={size}
      onPress={() => router.navigate({ name: 'playlist', id })}
      {...state}
    />
  );
}

export function MixTile({ id, size }: { id: string; size?: MediaCardSize }) {
  const mix = MIX_BY_ID[id]!;
  const router = useMusicRouter();
  const state = useContextPlay(mixPlay(mix));
  return (
    <MixCard
      title={mix.title}
      coverTitle={mix.coverTitle}
      artworkColor={mix.artworkColor}
      faces={mix.artistIds.map((a) => ARTIST_BY_ID[a]!.photo)}
      description={mix.description}
      size={size}
      onPress={() => router.navigate({ name: 'mix', id })}
      {...state}
    />
  );
}

export function ArtistTile({ id, size }: { id: string; size?: MediaCardSize }) {
  const artist = ARTIST_BY_ID[id]!;
  const router = useMusicRouter();
  const state = useContextPlay(artistPlay(artist));
  return (
    <ArtistCard
      name={artist.name}
      verified={artist.verified}
      artwork={artist.photo}
      artworkColor={artist.artworkColor}
      size={size}
      onPress={() => router.navigate({ name: 'artist', id })}
      {...state}
    />
  );
}

export function PodcastTile({ id, size }: { id: string; size?: MediaCardSize }) {
  const show = SHOW_BY_ID[id]!;
  const router = useMusicRouter();
  const state = useContextPlay(showPlay(show));
  return (
    <PodcastCard
      title={show.title}
      publisher={show.publisher}
      artwork={show.artwork}
      artworkColor={show.artworkColor}
      size={size}
      onPress={() => router.navigate({ name: 'podcast', id })}
      {...state}
    />
  );
}

/** Seconds listened: the live position while it is loaded, else the stored progress. */
export function episodeProgress(
  episode: DemoEpisode,
  currentId: string | undefined,
  position: number,
): number | undefined {
  return currentId === episode.id ? position : episode.progress;
}

export function EpisodeTile({
  id,
  size,
  layout,
  position,
}: {
  id: string;
  size?: MediaCardSize;
  layout?: 'tile' | 'row';
  /** The live position, passed by a parent that already reads the clock. */
  position: number;
}) {
  const episode = EPISODE_BY_ID[id]!;
  const show = SHOW_BY_ID[episode.showId]!;
  const router = useMusicRouter();
  const player = usePlayer();
  const current = player.current?.id === id;
  const listened = episodeProgress(episode, player.current?.id, position);
  const left = listened !== undefined ? Math.max(0, episode.duration - listened) : 0;
  return (
    <EpisodeCard
      title={episode.title}
      show={show.title}
      date={episode.date}
      duration={`${Math.round(episode.duration / 60)} min`}
      description={layout === 'row' ? episode.description : undefined}
      artwork={show.artwork}
      artworkColor={show.artworkColor}
      progress={listened !== undefined ? listened / episode.duration : undefined}
      remaining={listened !== undefined ? `${Math.max(1, Math.round(left / 60))} min left` : undefined}
      played={episode.played && !current}
      size={size}
      layout={layout}
      current={current}
      playing={current && player.playing}
      onPlay={() => {
        const play = showPlay(show);
        player.play(
          play.items,
          play.items.findIndex((p) => p.id === id),
          play.context,
        );
        if (listened && !current) setTimeout(() => player.seek(listened), 0);
      }}
      onPress={() => router.navigate({ name: 'episode', id })}
    />
  );
}

export function EventTile({
  event,
  size,
  layout,
}: {
  event: {
    id: string;
    title: string;
    month: string;
    day: string;
    venue: string;
    city: string;
    time: string;
    soldOut: boolean;
    image: string;
  };
  size?: MediaCardSize;
  layout?: 'tile' | 'row';
}) {
  return (
    <EventCard
      title={event.title}
      month={event.month}
      day={event.day}
      image={event.image}
      venue={event.venue}
      city={event.city}
      time={event.time}
      soldOut={event.soldOut}
      size={size}
      layout={layout}
      action={
        event.soldOut ? undefined : (
          <Button variant="secondary" size="xs">
            Tickets
          </Button>
        )
      }
    />
  );
}
