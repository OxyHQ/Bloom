import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiPlayList2Line } from '../icons/remix/RiPlayList2Line';
import { RiPlayListAddLine } from '../icons/remix/RiPlayListAddLine';
import { RiShareLine } from '../icons/remix/RiShareLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EpisodeList } from './EpisodeList';
import { SelectionBar } from './SelectionBar';
import { TrackList } from './TrackList';
import { TrackListEmpty } from './TrackListEmpty';
import { TrackRowSkeleton } from './TrackRowSkeleton';
import type { Episode, Track, TrackMenuItem } from './types';

const meta: Meta = {
  title: 'Blocks/Music/Track List',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** A generated two-stop gradient square — demo artwork with no external image. */
function art(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/></svg>`;
  // The plain `data:image/svg+xml,` prefix: react-native-web mangles the `;utf8,` form.
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const COVERS = [
  art('#f97316', '#7c3aed'),
  art('#0ea5e9', '#14b8a6'),
  art('#e11d48', '#facc15'),
  art('#22c55e', '#0f172a'),
  art('#a855f7', '#ec4899'),
  art('#64748b', '#f1f5f9'),
];

const ALBUM_COVER = COVERS[0]!;

const ALBUM: Track[] = [
  { id: 'al1', number: 1, title: 'Lanterns Over Kessel Bay', artists: [{ name: 'Mira Vale' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 214, plays: '4,812,330' },
  { id: 'al2', number: 2, title: 'Paper Moons', artists: [{ name: 'Mira Vale' }, { name: 'Oren Reed' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 187, explicit: true, liked: true, plays: '2,904,118' },
  { id: 'al3', number: 3, title: 'Slow Orbit', artists: [{ name: 'Mira Vale' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 243, plays: '1,377,052' },
  { id: 'al4', number: 4, title: 'The Salt Road', artists: [{ name: 'Mira Vale' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 305, plays: '988,410' },
  { id: 'al5', number: 1, title: 'Harbour Lights (Night Version)', artists: [{ name: 'Mira Vale' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 262, plays: '640,221' },
  { id: 'al6', number: 2, title: 'Undertow', artists: [{ name: 'Mira Vale' }, { name: 'Tessa Grove' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 199, explicit: true, plays: '512,904' },
  { id: 'al7', number: 3, title: 'Lost Signal (Demo)', artists: [{ name: 'Mira Vale' }], album: 'Low Tide Hymns', cover: ALBUM_COVER, duration: 176, unavailable: true, plays: '—' },
];

const PLAYLIST: Track[] = [
  { id: 'p1', title: 'Glass Harbour', artists: [{ name: 'Northbound Choir' }], album: 'Wide Open Weather', cover: COVERS[1], duration: 221, dateAdded: '2 days ago', liked: true, downloaded: true },
  { id: 'p2', title: 'Copper Skies', artists: [{ name: 'Juno Park' }], album: 'Copper Skies', cover: COVERS[2], duration: 198, dateAdded: '3 days ago', explicit: true, downloaded: true },
  { id: 'p3', title: 'Field Recording No. 4', artists: [{ name: 'Alder & Finch' }], album: 'Quiet Machines', cover: COVERS[3], duration: 264, dateAdded: '1 week ago' },
  { id: 'p4', title: 'Afterglow Avenue', artists: [{ name: 'Sunday Static' }, { name: 'Lio Marsh' }], album: 'City of Small Hours', cover: COVERS[4], duration: 232, dateAdded: '12 Mar 2026', downloaded: true },
  { id: 'p5', title: 'Soft Machinery', artists: [{ name: 'Alder & Finch' }], album: 'Quiet Machines', cover: COVERS[3], duration: 187, dateAdded: '9 Mar 2026' },
  { id: 'p6', title: 'Ferris Wheel in Winter', artists: [{ name: 'Juno Park' }], album: 'Copper Skies', cover: COVERS[2], duration: 276, dateAdded: '2 Mar 2026', liked: true },
];

function Page({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        alignSelf: 'stretch',
        width: '100%',
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: '100%',
      }}
    >
      <View style={{ width: '100%', maxWidth, alignSelf: 'center' }}>{children}</View>
    </View>
  );
}

function Heading({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="title-2-semibold" style={{ color: theme.colors.text, marginBottom: 16 }}>
      {children}
    </Text>
  );
}

function menuFor(extra: TrackMenuItem[] = []) {
  return (track: Track): TrackMenuItem[] => [
    { key: 'queue', label: 'Add to queue', icon: RiPlayListAddLine, onPress: () => console.log('queue', track.id) },
    { key: 'playlist', label: 'Add to playlist', icon: RiAddLine, onPress: () => console.log('playlist', track.id) },
    { key: 'share', label: 'Share', icon: RiShareLine, onPress: () => console.log('share', track.id) },
    ...extra,
  ];
}

function useLikes(initial: Track[]) {
  const [tracks, setTracks] = useState(initial);
  const onLikedChange = (track: Track, liked: boolean) =>
    setTracks((list) => list.map((t) => (t.id === track.id ? { ...t, liked } : t)));
  return [tracks, setTracks, onLikedChange] as const;
}

function usePlayer(firstId: string | null = null) {
  const [current, setCurrent] = useState<string | null>(firstId);
  const [playing, setPlaying] = useState(firstId !== null);
  return {
    currentTrackId: current,
    isPlaying: playing,
    onPlay: (track: Track) => {
      if (track.id === current) setPlaying(true);
      else {
        setCurrent(track.id);
        setPlaying(true);
      }
    },
    onPause: () => setPlaying(false),
  };
}

/** An album: two disc groups, track numbers per disc, plays, no date column; track 2 is playing. */
export const Album: Story = {
  render: function AlbumStory() {
    const [tracks, , onLikedChange] = useLikes(ALBUM);
    const player = usePlayer('al2');
    return (
      <Page maxWidth={1200}>
        <Heading>Low Tide Hymns</Heading>
        <TrackList
          tracks={tracks}
          columns={['index', 'title', 'plays', 'duration', 'actions']}
          groups={[
            { key: 'disc-1', title: 'Disc 1', startIndex: 0 },
            { key: 'disc-2', title: 'Disc 2', startIndex: 4 },
          ]}
          {...player}
          onLikedChange={onLikedChange}
          onArtistPress={(artist) => console.log('artist', artist.name)}
          menuItems={menuFor()}
          accessibilityLabel="Low Tide Hymns"
          testID="album"
        />
      </Page>
    );
  },
};

/** A playlist you own: drag to reorder (handle on hover), Move up/down in the menu, date added. */
export const PlaylistOwner: Story = {
  render: function PlaylistStory() {
    const [tracks, setTracks, onLikedChange] = useLikes(PLAYLIST);
    const player = usePlayer();
    return (
      <Page maxWidth={1200}>
        <Heading>Late Night Drive</Heading>
        <TrackList
          tracks={tracks}
          columns={['index', 'title', 'album', 'dateAdded', 'duration', 'actions']}
          {...player}
          reorderable
          onReorder={(from, to) =>
            setTracks((list) => {
              const next = [...list];
              const [moved] = next.splice(from, 1);
              if (moved) next.splice(to, 0, moved);
              return next;
            })
          }
          onLikedChange={onLikedChange}
          onArtistPress={(artist) => console.log('artist', artist.name)}
          onAlbumPress={(track) => console.log('album', track.album)}
          menuItems={menuFor([
            {
              key: 'remove',
              label: 'Remove from this playlist',
              icon: RiDeleteBinLine,
              destructive: true,
              onPress: () => {},
            },
          ])}
          showDownloaded
          accessibilityLabel="Late Night Drive"
          testID="playlist"
        />
      </Page>
    );
  },
};

/** Liked songs: click, Shift-click and Cmd/Ctrl-click select; the selection bar floats at the bottom. */
export const LikedSongsWithSelection: Story = {
  render: function LikedStory() {
    const [tracks, setTracks, onLikedChange] = useLikes(PLAYLIST.map((t) => ({ ...t, liked: true })));
    const [selected, setSelected] = useState<string[]>(['p2', 'p3', 'p4']);
    const player = usePlayer('p1');
    return (
      <View style={{ position: 'relative', minHeight: 640, alignSelf: 'stretch', width: '100%' }}>
        <Page maxWidth={1200}>
          <Heading>Liked Songs</Heading>
          <TrackList
            tracks={tracks}
            columns={['index', 'title', 'album', 'dateAdded', 'duration', 'actions']}
            {...player}
            isPlaying={false}
            selectedIds={selected}
            onSelectionChange={setSelected}
            onLikedChange={onLikedChange}
            menuItems={menuFor()}
            showDownloaded
            testID="liked"
          />
        </Page>
        <SelectionBar
          count={selected.length}
          onClear={() => setSelected([])}
          actions={[
            { key: 'playlist', label: 'Add to playlist', icon: RiAddLine, onPress: () => {} },
            { key: 'queue', label: 'Add to queue', icon: RiPlayListAddLine, onPress: () => {} },
            { key: 'download', label: 'Download', icon: RiDownload2Line, onPress: () => {} },
            {
              key: 'remove',
              label: 'Remove',
              icon: RiDeleteBinLine,
              destructive: true,
              onPress: () => {
                setTracks((list) => list.filter((t) => !selected.includes(t.id)));
                setSelected([]);
              },
            },
          ]}
          testID="selection-bar"
        />
      </View>
    );
  },
};

/** Search results: compact rows, album column, no header. */
export const SearchResultsCompact: Story = {
  render: function SearchStory() {
    const [tracks, , onLikedChange] = useLikes([...PLAYLIST, ...ALBUM.slice(0, 3)]);
    const player = usePlayer();
    return (
      <Page maxWidth={1000}>
        <Heading>Songs</Heading>
        <TrackList
          tracks={tracks}
          density="compact"
          columns={['index', 'title', 'album', 'duration', 'actions']}
          showHeader={false}
          {...player}
          onLikedChange={onLikedChange}
          menuItems={menuFor()}
          accessibilityLabel="Songs"
          testID="search"
        />
      </Page>
    );
  },
};

/** A phone-width list: cover, title/artists and the more button. */
export const Narrow390: Story = {
  render: function NarrowStory() {
    const [tracks] = useLikes(PLAYLIST);
    const player = usePlayer('p2');
    return (
      <View style={{ width: '100%', maxWidth: 390 }}>
        <Page>
          <Heading>Late Night Drive</Heading>
          <TrackList tracks={tracks} {...player} menuItems={menuFor()} showDownloaded testID="narrow" />
        </Page>
      </View>
    );
  },
};

const EPISODES: Episode[] = [
  {
    id: 'e1',
    title: 'Why cities hum at night',
    show: 'Field Notes',
    description:
      'We follow a sound engineer through a sleeping city to find the low, constant hum under everything — and what it tells us about the machines that keep a place alive after dark.',
    cover: COVERS[1],
    date: 'Today',
    duration: 47 * 60,
    progress: 35 * 60,
    saved: true,
  },
  {
    id: 'e2',
    title: 'The last lighthouse keeper',
    show: 'Field Notes',
    description: 'A conversation about solitude, weather logs and the day the lamp went automatic.',
    cover: COVERS[3],
    date: '12 Mar',
    duration: 72 * 60,
    downloaded: true,
  },
  {
    id: 'e3',
    title: 'A short history of the rain forecast',
    show: 'Field Notes',
    description: 'From barometers in shop windows to the numbers in your pocket.',
    cover: COVERS[5],
    date: '5 Mar',
    duration: 38 * 60,
    played: true,
    explicit: true,
  },
];

/** Podcast episodes, wide and narrow. */
export const Episodes: Story = {
  render: function EpisodesStory() {
    const [episodes, setEpisodes] = useState(EPISODES);
    const [current, setCurrent] = useState<string | null>('e1');
    const [playing, setPlaying] = useState(false);
    const update = (id: string, patch: Partial<Episode>) =>
      setEpisodes((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const props = {
      episodes,
      currentEpisodeId: current,
      isPlaying: playing,
      onPlay: (episode: Episode) => {
        setCurrent(episode.id);
        setPlaying(true);
      },
      onPause: () => setPlaying(false),
      onPress: (episode: Episode) => console.log('open', episode.id),
      onSavedChange: (episode: Episode, saved: boolean) => update(episode.id, { saved }),
      onDownloadedChange: (episode: Episode, downloaded: boolean) => update(episode.id, { downloaded }),
      menuItems: () => [
        { key: 'queue', label: 'Add to queue', icon: RiPlayListAddLine, onPress: () => {} },
        { key: 'share', label: 'Share episode', icon: RiShareLine, onPress: () => {} },
      ],
    };
    return (
      <Page maxWidth={900}>
        <Heading>Field Notes</Heading>
        <EpisodeList {...props} width={900} testID="episodes" />
        <View style={{ height: 32 }} />
        <View style={{ width: '100%', maxWidth: 390 }}>
          <EpisodeList {...props} width={390} testID="episodes-narrow" />
        </View>
      </Page>
    );
  },
};

/** An empty playlist, and the loading placeholders at both densities. */
export const EmptyAndLoading: Story = {
  render: () => (
    <Page maxWidth={1200}>
      <TrackListEmpty
        icon={RiPlayList2Line}
        title="Songs you add will appear here"
        description="Search for something you love, then use the menu on any song to add it to this playlist."
        actionLabel="Find songs"
        onAction={() => {}}
        testID="empty"
      />
      <TrackRowSkeleton count={4} testID="skeleton" />
      <View style={{ height: 24 }} />
      <TrackRowSkeleton count={4} density="compact" />
    </Page>
  ),
};

/** The playlist, forced dark. */
export const PlaylistDark: Story = {
  ...PlaylistOwner,
  globals: { theme: 'dark' },
};

/** Liked songs with selection, forced dark. */
export const LikedSongsDark: Story = {
  ...LikedSongsWithSelection,
  globals: { theme: 'dark' },
};
