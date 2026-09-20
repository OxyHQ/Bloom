import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../dropdown-menu';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ArtistAbout } from './ArtistAbout';
import { ArtistHero } from './ArtistHero';
import { ArtistPick } from './ArtistPick';
import { AudiobookHeader } from './AudiobookHeader';
import { CollectionHeader } from './CollectionHeader';
import { DiscographyFilter } from './DiscographyFilter';
import { EpisodeHeader } from './EpisodeHeader';
import { DownloadButton, FollowButton, MediaActionBar, MediaMoreButton, ShuffleButton } from './MediaActionBar';
import { PodcastShowHeader } from './PodcastShowHeader';
import { PopularTracks } from './PopularTracks';
import { ProfileHeader } from './ProfileHeader';
import { StickyMediaTopBar } from './StickyMediaTopBar';
import type { DownloadState, MediaViewMode, PopularTrack } from './types';
import { useMediaHeaderScroll } from './use-media-header-scroll';

const meta: Meta = {
  title: 'Blocks/Music/Media Headers',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists, albums and shows
// ---------------------------------------------------------------------------

/** A generated cover: a two-colour gradient with a few soft shapes. */
function art(from: string, to: string, shape: 'circles' | 'waves' | 'grid' = 'circles'): string {
  const shapes =
    shape === 'circles'
      ? `<circle cx="210" cy="90" r="70" fill="#fff" fill-opacity=".18"/><circle cx="90" cy="220" r="110" fill="#000" fill-opacity=".12"/>`
      : shape === 'waves'
        ? `<path d="M0 190 Q75 140 150 190 T300 190 V300 H0Z" fill="#fff" fill-opacity=".2"/><path d="M0 230 Q75 180 150 230 T300 230 V300 H0Z" fill="#000" fill-opacity=".15"/>`
        : `<g stroke="#fff" stroke-opacity=".22" stroke-width="2">${[50, 100, 150, 200, 250].map((v) => `<line x1="${v}" y1="0" x2="${v}" y2="300"/><line x1="0" y1="${v}" x2="300" y2="${v}"/>`).join('')}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/>${shapes}</svg>`;
  // react-native-web's Image encodes the part after `utf8,` itself — pass it raw.
  return `data:image/svg+xml;utf8,${svg}`;
}

const COVERS = {
  harbour: art('#1f3b73', '#e46a4f', 'waves'),
  moss: art('#2f5d3a', '#c8d96f', 'circles'),
  neon: art('#6b1d8f', '#ff5fa2', 'grid'),
  dune: art('#a0522d', '#f3c77a', 'waves'),
  ink: art('#101820', '#5c6b7a', 'grid'),
  tide: art('#0f5e73', '#7fd6d0', 'circles'),
};

const AVATARS = {
  mara: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  jun: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop',
  lio: 'https://picsum.photos/seed/lio-avatar/200/200',
};

const BANNER = 'https://picsum.photos/seed/velvet-harbour-stage/1600/700';

const TRACKS: PopularTrack[] = [
  { id: '1', title: 'Lanterns Over Kessel Bay', plays: '48,203,114', duration: '3:42', image: COVERS.harbour },
  { id: '2', title: 'Paper Satellites', plays: '31,977,020', duration: '4:05', image: COVERS.neon, explicit: true },
  { id: '3', title: 'Slow Current', plays: '22,410,338', duration: '2:58', image: COVERS.tide },
  { id: '4', title: 'Amber Signal', plays: '18,006,951', duration: '3:31', image: COVERS.dune },
  { id: '5', title: 'The Long Way to Orrin', plays: '12,884,203', duration: '5:12', image: COVERS.harbour },
  { id: '6', title: 'Glasshouse', plays: '9,120,448', duration: '3:17', image: COVERS.moss },
  { id: '7', title: 'Northbound Static', plays: '7,771,002', duration: '3:49', image: COVERS.ink, explicit: true },
  { id: '8', title: 'Weathervane', plays: '6,404,119', duration: '4:21', image: COVERS.tide },
  { id: '9', title: 'Salt and Copper', plays: '5,219,870', duration: '3:03', image: COVERS.dune },
  { id: '10', title: 'Low Tide Choir', plays: '4,006,332', duration: '6:40', image: COVERS.neon },
];

// ---------------------------------------------------------------------------
//  Frame
// ---------------------------------------------------------------------------

function Page({ children, width = 1280 }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, width: '100%', maxWidth: width, minHeight: '100%' }}>
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary, paddingLeft: 16, paddingTop: 16 }}>
      {children}
    </Text>
  );
}

/** A full action bar with local state, for the header stories. */
function Actions({
  subject,
  follow,
  like = !follow,
  view = true,
  download = true,
}: {
  subject: string;
  follow?: { label: string; followingLabel: string };
  like?: boolean;
  view?: boolean;
  download?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [dl, setDl] = useState<DownloadState>('idle');
  const [viewMode, setViewMode] = useState<MediaViewMode>('list');
  return (
    <MediaActionBar
      playing={playing}
      onPlayPress={() => setPlaying((p) => !p)}
      playSubject={subject}
      shuffle={shuffle}
      onShuffleChange={setShuffle}
      liked={liked}
      onLikedChange={like ? setLiked : undefined}
      following={following}
      onFollowChange={follow ? setFollowing : undefined}
      followLabel={follow?.label}
      followingLabel={follow?.followingLabel}
      download={dl}
      downloadProgress={0.4}
      onDownloadPress={
        download ? () => setDl((d) => (d === 'idle' ? 'downloading' : d === 'downloading' ? 'downloaded' : 'idle')) : undefined
      }
      more={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MediaMoreButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Add to queue</DropdownMenuItem>
            <DropdownMenuItem>Go to artist radio</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      onSearchPress={view ? () => {} : undefined}
      view={viewMode}
      onViewChange={view ? setViewMode : undefined}
      testID="actions"
    />
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

export const Album: Story = {
  render: () => (
    <Page>
      <CollectionHeader
        typeLabel="Album"
        title="Lanterns Over Kessel Bay"
        cover={COVERS.harbour}
        artworkColor="#1f3b73"
        owners={[{ name: 'Velvet Harbour', avatar: AVATARS.mara, onPress: () => {} }]}
        year="2025"
        summary="12 songs, 48 min"
        actions={<Actions subject="Lanterns Over Kessel Bay" view={false} />}
        testID="album"
      />
    </Page>
  ),
};

export const Single: Story = {
  render: () => (
    <Page>
      <CollectionHeader
        typeLabel="Single"
        title="Moss"
        cover={COVERS.moss}
        artworkColor="#c8d96f"
        owners={[{ name: 'Orrin Vale', avatar: AVATARS.jun, onPress: () => {} }]}
        year="2026"
        summary="1 song, 3 min 12 sec"
        actions={<Actions subject="Moss" view={false} />}
      />
    </Page>
  ),
};

export const PlaylistOwnedEditable: Story = {
  render: function PlaylistOwned() {
    const [edits, setEdits] = useState(0);
    return (
      <Page>
        <CollectionHeader
          typeLabel="Public playlist"
          title="Night drive, windows down"
          description="Slow synths and warm bass for the empty coast road after midnight. Updated every Friday."
          cover={COVERS.neon}
          artworkColor="#6b1d8f"
          owners={[{ name: 'Mara Lind', avatar: AVATARS.mara, onPress: () => {} }]}
          summary="64 songs, about 4 hr"
          saves="1,204 saves"
          editable
          onEdit={() => setEdits((n) => n + 1)}
          actions={<Actions subject="Night drive, windows down" />}
          testID="playlist"
        />
        <Caption>{`onEdit called ${edits} times`}</Caption>
      </Page>
    );
  },
};

export const PlaylistCollaborative: Story = {
  render: () => (
    <Page>
      <CollectionHeader
        typeLabel="Collaborative playlist"
        title="Road trip to the northern lakes, summer edition"
        cover={COVERS.tide}
        artworkColor="#7fd6d0"
        owners={[
          { name: 'Mara Lind', avatar: AVATARS.mara, onPress: () => {} },
          { name: 'Jun Okafor', avatar: AVATARS.jun, onPress: () => {} },
          { name: 'Lio Brandt', avatar: AVATARS.lio, onPress: () => {} },
        ]}
        summary="118 songs, 7 hr 40 min"
        actions={<Actions subject="Road trip to the northern lakes" />}
      />
    </Page>
  ),
};

export const LikedSongs: Story = {
  render: () => (
    <Page>
      <CollectionHeader
        variant="liked"
        typeLabel="Playlist"
        title="Liked Songs"
        owners={[{ name: 'Mara Lind', avatar: AVATARS.mara }]}
        summary="842 songs"
        actions={<Actions subject="Liked Songs" like={false} />}
        testID="liked"
      />
    </Page>
  ),
};

export const NoArtworkColor: Story = {
  render: () => (
    <Page>
      <CollectionHeader
        typeLabel="Playlist"
        title="Untitled mix"
        owners={[{ name: 'Mara Lind' }]}
        summary="0 songs"
        actions={<Actions subject="Untitled mix" download={false} />}
      />
    </Page>
  ),
};

export const ArtistWithBanner: Story = {
  render: function ArtistBanner() {
    const [discography, setDiscography] = useState('albums');
    const [playing, setPlaying] = useState(false);
    const [following, setFollowing] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [active, setActive] = useState<string | undefined>('2');
    return (
      <Page>
        <ArtistHero
          name="Velvet Harbour"
          banner={BANNER}
          verified
          listeners="1,234,567 monthly listeners"
          artworkColor="#1f3b73"
          actions={
            <MediaActionBar
              playing={playing}
              onPlayPress={() => setPlaying((p) => !p)}
              playSubject="Velvet Harbour"
              shuffle={shuffle}
              onShuffleChange={setShuffle}
              following={following}
              onFollowChange={setFollowing}
              onMorePress={() => {}}
            />
          }
          testID="artist"
        />
        <View style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 48, gap: 40 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32 }}>
            <PopularTracks
              tracks={TRACKS}
              activeTrackId={active}
              playing={playing}
              onTrackPress={(t) => setActive(t.id)}
              style={{ flex: 2, minWidth: 320 }}
              testID="popular"
            />
            <ArtistPick
              image={COVERS.neon}
              title="Night drive, windows down"
              subtitle="Playlist"
              note="The songs we listened to while writing the record."
              avatar={AVATARS.mara}
              onPress={() => {}}
              style={{ flex: 1, minWidth: 280, alignSelf: 'flex-start' }}
            />
          </View>
          <DiscographyFilter value={discography} onValueChange={setDiscography} onShowAll={() => {}} />
          <ArtistAbout
            image="https://picsum.photos/seed/velvet-harbour-about/1200/700"
            bio="Velvet Harbour is a four-piece from the coastal town of Kessel, writing slow, bright songs about night ferries, lighthouses and the people who keep them running. Their second record was tracked in a disused boathouse over a single winter, with the tide audible under every take. They tour the northern coast every autumn and close each show with the whole room singing the last chorus."
            stats={[
              { value: '1,204,331', label: 'Followers' },
              { value: '1,234,567', label: 'Monthly listeners' },
            ]}
            cities={[
              { city: 'Kessel, NR', count: '84,120 listeners' },
              { city: 'Port Aldine, WS', count: '61,009 listeners' },
              { city: 'Orrin, LK', count: '40,556 listeners' },
            ]}
            style={{ maxWidth: 720 }}
          />
        </View>
      </Page>
    );
  },
};

export const ArtistWithoutBanner: Story = {
  render: function ArtistNoBanner() {
    const [following, setFollowing] = useState(true);
    const [playing, setPlaying] = useState(false);
    return (
      <Page>
        <ArtistHero
          name="Orrin Vale"
          avatar={AVATARS.jun}
          verified
          listeners="84,210 monthly listeners"
          artworkColor="#a0522d"
          actions={
            <MediaActionBar
              playing={playing}
              onPlayPress={() => setPlaying((p) => !p)}
              playSubject="Orrin Vale"
              following={following}
              onFollowChange={setFollowing}
              onMorePress={() => {}}
            />
          }
        />
      </Page>
    );
  },
};

export const PodcastShow: Story = {
  render: function Podcast() {
    const [following, setFollowing] = useState(false);
    const [playing, setPlaying] = useState(false);
    return (
      <Page>
        <PodcastShowHeader
          title="The Lighthouse Hours"
          cover={COVERS.tide}
          artworkColor="#0f5e73"
          publisher="Kessel Bay Audio"
          onPublisherPress={() => {}}
          rating={4.8}
          ratingCount="2.1k"
          categories={['History', 'Society', 'Documentary']}
          onCategoryPress={() => {}}
          following={following}
          onFollowChange={setFollowing}
          description="Every week, a keeper, a ferry pilot or a harbour cook tells the story of one night on the northern coast. Recorded on location, with the sea as the only soundtrack. New episodes on Tuesdays, with a bonus interview on the first Friday of every month for followers of the show."
          latestEpisode={{
            title: 'Episode 112: The fog bell at Orrin Point',
            date: 'Sep 15',
            duration: '48 min',
            description: 'A retired keeper remembers the winter the bell rang for eleven days straight.',
            onPress: () => {},
            playing,
            onPlayPress: () => setPlaying((p) => !p),
          }}
          testID="podcast"
        />
      </Page>
    );
  },
};

export const Episode: Story = {
  render: function EpisodeStory() {
    const [playing, setPlaying] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dl, setDl] = useState<DownloadState>('downloading');
    return (
      <Page>
        <EpisodeHeader
          title="Episode 112: The fog bell at Orrin Point"
          showTitle="The Lighthouse Hours"
          onShowPress={() => {}}
          cover={COVERS.tide}
          artworkColor="#0f5e73"
          date="Sep 15, 2026"
          duration="48 min"
          playing={playing}
          onPlayPress={() => setPlaying((p) => !p)}
          progress={0.52}
          remainingLabel="23 min left"
          saved={saved}
          onSavedChange={setSaved}
          onSharePress={() => {}}
          download={dl}
          downloadProgress={0.64}
          onDownloadPress={() => setDl((d) => (d === 'downloaded' ? 'idle' : 'downloaded'))}
          onMorePress={() => {}}
          testID="episode"
        />
      </Page>
    );
  },
};

export const Profile: Story = {
  render: function ProfileStory() {
    const [following, setFollowing] = useState(false);
    return (
      <Page>
        <ProfileHeader
          name="Jun Okafor"
          avatar={AVATARS.jun}
          artworkColor="#2f5d3a"
          stats={[
            { label: '12 public playlists', onPress: () => {} },
            { label: '48 followers', onPress: () => {} },
            { label: '30 following', onPress: () => {} },
          ]}
          following={following}
          onFollowChange={setFollowing}
          onMorePress={() => {}}
          testID="profile"
        />
      </Page>
    );
  },
};

export const OwnProfile: Story = {
  render: () => (
    <Page>
      <ProfileHeader
        name="Mara Lind"
        avatar={AVATARS.mara}
        stats={[{ label: '7 public playlists', onPress: () => {} }, { label: '212 followers' }, { label: '96 following', onPress: () => {} }]}
        onEditPress={() => {}}
        onMorePress={() => {}}
      />
    </Page>
  ),
};

export const Audiobook: Story = {
  render: () => (
    <Page>
      <AudiobookHeader
        title="The Cartographer of Low Tides"
        cover={COVERS.dune}
        artworkColor="#f3c77a"
        author="Wren Calloway"
        onAuthorPress={() => {}}
        narrator="Narrated by Ada Moss"
        duration="11 h 42 min"
        chapters="32 chapters"
        progress={0.35}
        progressLabel="7 h 36 min left"
        rating={4.6}
        ratingCount={913}
        actions={<Actions subject="The Cartographer of Low Tides" view={false} />}
        testID="audiobook"
      />
    </Page>
  ),
};

/** Scroll the frame: the top bar fades in as the header leaves. */
export const StickyTopBarOnScroll: Story = {
  render: function StickyDemo() {
    const [playing, setPlaying] = useState(false);
    const { progress, onScroll } = useMediaHeaderScroll({ start: 260, end: 340 });
    const theme = useTheme();
    return (
      <View style={{ height: 720, width: '100%', maxWidth: 1280, backgroundColor: theme.colors.background }}>
        <ScrollView onScroll={onScroll} scrollEventThrottle={16} testID="sticky-scroll">
          <CollectionHeader
            typeLabel="Album"
            title="Lanterns Over Kessel Bay"
            cover={COVERS.harbour}
            artworkColor="#1f3b73"
            owners={[{ name: 'Velvet Harbour', avatar: AVATARS.mara, onPress: () => {} }]}
            year="2025"
            summary="12 songs, 48 min"
            actions={<Actions subject="Lanterns Over Kessel Bay" view={false} />}
          />
          <View style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 600 }}>
            <PopularTracks tracks={TRACKS} title="Tracks" collapsedCount={10} />
          </View>
        </ScrollView>
        <StickyMediaTopBar
          title="Lanterns Over Kessel Bay"
          artworkColor="#1f3b73"
          playing={playing}
          onPlayPress={() => setPlaying((p) => !p)}
          progress={progress}
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
          testID="sticky"
        />
      </View>
    );
  },
};

export const StickyTopBarVisible: Story = {
  render: function StickyVisible() {
    const [visible, setVisible] = useState(true);
    const [playing, setPlaying] = useState(true);
    return (
      <Page>
        <View style={{ padding: 16, gap: 12 }}>
          <FollowButton following={visible} onFollowChange={setVisible} label="Show bar" followingLabel="Hide bar" style={{ alignSelf: 'flex-start' }} />
          {(['#1f3b73', '#c8d96f', '#ff5fa2', null] as const).map((color) => (
            <StickyMediaTopBar
              key={String(color)}
              title="Lanterns Over Kessel Bay"
              artworkColor={color}
              playing={playing}
              onPlayPress={() => setPlaying((p) => !p)}
              visible={visible}
            />
          ))}
        </View>
      </Page>
    );
  },
};

export const ActionControls: Story = {
  render: function ActionMatrix() {
    const [shuffle, setShuffle] = useState(true);
    const [following, setFollowing] = useState(false);
    return (
      <Page>
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <ShuffleButton shuffle={false} onShuffleChange={() => {}} />
            <ShuffleButton shuffle={shuffle} onShuffleChange={setShuffle} testID="shuffle-on" />
            <DownloadButton state="idle" onPress={() => {}} />
            <DownloadButton state="downloading" progress={0.3} onPress={() => {}} />
            <DownloadButton state="downloading" progress={0.8} onPress={() => {}} />
            <DownloadButton state="downloaded" onPress={() => {}} />
            <FollowButton following={following} onFollowChange={setFollowing} />
            <FollowButton following onFollowChange={() => {}} label="Save" followingLabel="Saved" />
            <MediaMoreButton onPress={() => {}} />
          </View>
          <Actions subject="Night drive" follow={{ label: 'Save', followingLabel: 'Saved' }} like={false} />
        </View>
      </Page>
    );
  },
};

export const Narrow: Story = {
  render: function NarrowStory() {
    const [discography, setDiscography] = useState('singles');
    return (
      <Page width={390}>
        <CollectionHeader
          typeLabel="Album"
          title="Lanterns Over Kessel Bay"
          cover={COVERS.harbour}
          artworkColor="#1f3b73"
          owners={[{ name: 'Velvet Harbour', avatar: AVATARS.mara, onPress: () => {} }]}
          year="2025"
          summary="12 songs, 48 min"
          actions={<Actions subject="Lanterns Over Kessel Bay" view={false} />}
        />
        <ArtistHero
          name="Velvet Harbour"
          banner={BANNER}
          verified
          listeners="1,234,567 monthly listeners"
          actions={<Actions subject="Velvet Harbour" follow={{ label: 'Follow', followingLabel: 'Following' }} view={false} download={false} />}
        />
        <View style={{ paddingLeft: 8, paddingRight: 8, gap: 24 }}>
          <PopularTracks tracks={TRACKS} activeTrackId="1" playing />
          <View style={{ paddingLeft: 8, paddingRight: 8 }}>
            <DiscographyFilter value={discography} onValueChange={setDiscography} />
          </View>
        </View>
        <ProfileHeader
          name="Jun Okafor"
          avatar={AVATARS.jun}
          artworkColor="#2f5d3a"
          stats={[{ label: '12 public playlists', onPress: () => {} }, { label: '48 followers' }, { label: '30 following' }]}
          following={false}
          onFollowChange={() => {}}
        />
        <AudiobookHeader
          title="The Cartographer of Low Tides"
          cover={COVERS.dune}
          artworkColor="#f3c77a"
          author="Wren Calloway"
          narrator="Narrated by Ada Moss"
          duration="11 h 42 min"
          chapters="32 chapters"
          progress={0.35}
          progressLabel="7 h 36 min left"
        />
        <EpisodeHeader
          title="Episode 112: The fog bell at Orrin Point"
          showTitle="The Lighthouse Hours"
          onShowPress={() => {}}
          cover={COVERS.tide}
          artworkColor="#0f5e73"
          date="Sep 15"
          duration="48 min"
          playing={false}
          onPlayPress={() => {}}
          onSavedChange={() => {}}
          onSharePress={() => {}}
          onDownloadPress={() => {}}
        />
      </Page>
    );
  },
};
