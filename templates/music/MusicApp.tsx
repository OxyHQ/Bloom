import React from 'react';

import { ArtistPage } from './ArtistPage';
import { AlbumPage, PlaylistPage } from './CollectionPages';
import { ALBUM_BY_ID, EPISODE_BY_ID, LIBRARY, PLAYLIST_BY_ID, SHOW_BY_ID, TRACKS } from './data';
import { HomePage } from './HomePage';
import { MusicFrame, type SidePane } from './MusicFrame';
import { LibraryPanel } from '../../src/music-library';
import { PageScroll, albumPlay, showPlay, useMusicLayout } from './parts';
import { PlayerProvider, playablesFromTrackIds, type PlayContext, type Playable } from './PlayerContext';
import { PodcastPage, EpisodePage } from './PodcastPages';
import { ProfilePage } from './ProfilePage';
import { MusicRouterProvider, useMusicRouter, type MusicRoute } from './router';
import { SearchPage } from './SearchPage';

/**
 * The whole listening app: the player, the router, the frame and the page for
 * the current route. Each story mounts it at a different route and player state.
 */

export interface MusicAppProps {
  route?: MusicRoute;
  /** What the player has loaded. Default: track 3 of the new album, paused a minute in. */
  loaded?: 'album' | 'episode' | 'none';
  playing?: boolean;
  fullPlayerOpen?: boolean;
  sidePane?: SidePane;
  devicePickerOpen?: boolean;
  /** Playback on another device (the connect banner). */
  deviceId?: string;
}

function loadedState(loaded: MusicAppProps['loaded'], playing: boolean) {
  if (loaded === 'none') return undefined;
  if (loaded === 'episode') {
    const episode = EPISODE_BY_ID['quiet-cartography-ep-1']!;
    const play = showPlay(SHOW_BY_ID[episode.showId]!);
    return { items: play.items, index: 0, context: play.context, position: episode.progress ?? 0, playing } satisfies {
      items: Playable[];
      index: number;
      context: PlayContext;
      position: number;
      playing: boolean;
    };
  }
  const play = albumPlay(ALBUM_BY_ID['lanterns-over-kessel-bay']!);
  return { items: play.items, index: 2, context: play.context, position: 58, playing };
}

const INITIAL_LIKED = [
  ...TRACKS.filter((_, i) => i % 5 === 1)
    .map((t) => t.id)
    .slice(0, 18),
  'lanterns-over-kessel-bay-3',
  'lanterns-over-kessel-bay',
];

/** Two songs the listener queued by hand, so "Next in queue" has something in it. */
const INITIAL_QUEUE = playablesFromTrackIds(['brass-and-honey-2', 'ferry-songs-4']);

export function MusicApp({
  route = { name: 'home' },
  loaded = 'album',
  playing = false,
  fullPlayerOpen = false,
  sidePane,
  devicePickerOpen,
  deviceId,
}: MusicAppProps) {
  return (
    <PlayerProvider
      initial={loadedState(loaded, playing)}
      initialLiked={INITIAL_LIKED}
      initialQueue={INITIAL_QUEUE}
      initialDeviceId={deviceId}
    >
      <MusicRouterProvider initialRoute={route} initialFullPlayerOpen={fullPlayerOpen}>
        <MusicFrame initialSidePane={sidePane} initialDevicePickerOpen={devicePickerOpen}>
          <RoutePage />
        </MusicFrame>
      </MusicRouterProvider>
    </PlayerProvider>
  );
}

function RoutePage() {
  const { route } = useMusicRouter();
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'search':
      return <SearchPage query={route.query} />;
    case 'library':
      return <LibraryPage />;
    case 'album':
      return <AlbumPage key={route.id} id={route.id} />;
    case 'playlist':
      return <PlaylistPage key={route.id} id={route.id} />;
    case 'mix':
      return <PlaylistPage key={route.id} id={route.id} kind="mix" />;
    case 'artist':
      return <ArtistPage key={route.id} id={route.id} />;
    case 'podcast':
      return <PodcastPage key={route.id} id={route.id} />;
    case 'episode':
      return <EpisodePage key={route.id} id={route.id} />;
    case 'profile':
      return <ProfilePage />;
    default:
      return null;
  }
}

/** The phone's Library tab: the same panel as the desktop pane, full width. */
function LibraryPage() {
  const router = useMusicRouter();
  const { mobile } = useMusicLayout();
  return (
    <PageScroll testID="music-library-page" back={false}>
      <LibraryPanel
        items={LIBRARY}
        onCreatePress={() => {}}
        onItemPress={(entry) => {
          if (entry.kind === 'album') router.navigate({ name: 'album', id: entry.id });
          else if (entry.kind === 'artist') router.navigate({ name: 'artist', id: entry.id });
          else if (entry.kind === 'podcast') router.navigate({ name: 'podcast', id: entry.id });
          else if (entry.kind === 'playlist' && (entry.id === 'liked' || PLAYLIST_BY_ID[entry.id]))
            router.navigate({ name: 'playlist', id: entry.id });
        }}
        style={{ minHeight: mobile ? 700 : 600 }}
      />
    </PageScroll>
  );
}
