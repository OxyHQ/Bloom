import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiDownloadLine } from '../icons/remix/RiDownloadLine';
import { RiAddCircleLine } from '../icons/remix/RiAddCircleLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AlbumCard } from './AlbumCard';
import { ArtistCard } from './ArtistCard';
import { AudiobookCard } from './AudiobookCard';
import { EpisodeCard } from './EpisodeCard';
import { EventCard } from './EventCard';
import { FriendActivityCard } from './FriendActivityCard';
import { GenreCard } from './GenreCard';
import { MixCard } from './MixCard';
import { PlaylistCard } from './PlaylistCard';
import { PodcastCard } from './PodcastCard';
import { ProfileCard } from './ProfileCard';
import { QuickAccessTile } from './QuickAccessTile';
import { RecapCard } from './RecapCard';
import { ShareCard } from './ShareCard';
import { SongCard } from './SongCard';
import type { MediaCardMenuItem, MediaCardSize } from './types';

const meta: Meta = {
  title: 'Blocks/Music/Media Cards',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — generated covers, invented artists
// ---------------------------------------------------------------------------

/** A generated cover: a two-hue gradient with a few soft shapes. Offline and deterministic. */
function cover(h1: number, h2: number, shape: 'circle' | 'bars' | 'wave' = 'circle'): string {
  const shapes = {
    circle: `<circle cx="140" cy="90" r="60" fill="hsl(${h2} 90% 75%)" opacity="0.55"/><circle cx="60" cy="150" r="36" fill="hsl(${h1} 80% 85%)" opacity="0.5"/>`,
    bars: `<rect x="30" y="40" width="18" height="120" rx="9" fill="white" opacity="0.35"/><rect x="62" y="70" width="18" height="90" rx="9" fill="white" opacity="0.35"/><rect x="94" y="30" width="18" height="130" rx="9" fill="white" opacity="0.35"/><rect x="126" y="90" width="18" height="70" rx="9" fill="white" opacity="0.35"/>`,
    wave: `<path d="M0 130 C 50 90, 90 170, 200 110 L200 200 L0 200 Z" fill="hsl(${h2} 85% 70%)" opacity="0.6"/><circle cx="150" cy="55" r="22" fill="white" opacity="0.6"/>`,
  }[shape];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 70% 45%)"/><stop offset="1" stop-color="hsl(${h2} 70% 25%)"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>${shapes}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** A generated face: a head-and-shoulders silhouette on a tinted ground. */
function face(h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${h} 45% 70%)"/><circle cx="50" cy="40" r="20" fill="hsl(${h} 35% 35%)"/><ellipse cx="50" cy="96" rx="34" ry="28" fill="hsl(${h} 35% 35%)"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const noop = () => undefined;

const MENU: MediaCardMenuItem[] = [
  { label: 'Add to queue', onPress: noop },
  { label: 'Go to artist', onPress: noop },
  { label: 'Share', onPress: noop },
  { label: 'Remove from library', onPress: noop, destructive: true },
];

function Page({ children, width, testID }: { children: React.ReactNode; width?: number; testID?: string }) {
  const theme = useTheme();
  return (
    <View style={{ minHeight: '100%', backgroundColor: theme.colors.background, padding: 16 }} testID={testID}>
      <View style={{ width: width ?? '100%', maxWidth: '100%', alignSelf: 'center', gap: 28 }}>{children}</View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>{children}</View>;
}

function Shelf({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text variant="title-3-bold" style={{ paddingLeft: 12 }}>
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 0 }}>
        {children}
      </ScrollView>
    </View>
  );
}

const SIZES: MediaCardSize[] = ['large', 'medium', 'small'];

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** Tracks: sizes, rows, playing, current, explicit, long titles, no artwork, artist links. */
export const Songs: Story = {
  render: function SongsStory() {
    const [playing, setPlaying] = useState<string | null>('b');
    const [liked, setLiked] = useState<Record<string, boolean>>({ a: true });
    return (
      <Page>
        <Section title="Tile — large, medium, small (hover to reveal play)">
          <Wrap>
            {SIZES.map((size) => (
              <SongCard
                key={size}
                size={size}
                title="Night Drive"
                artists={['Mara Vell']}
                artwork={cover(260, 320)}
                explicit
                onPress={noop}
                onPlay={noop}
                menuItems={MENU}
                testID={`song-${size}`}
              />
            ))}
          </Wrap>
        </Section>
        <Section title="Playing · loading · no artwork · long title · artist links · selected">
          <Wrap>
            <SongCard title="Glass Harbour" artists={['Juno Park']} artwork={cover(190, 230, 'wave')} current playing onPlay={noop} onPress={noop} testID="song-playing" />
            <SongCard title="Paper Lanterns" artists={['Oren Kade']} artwork={cover(30, 350, 'bars')} loading onPlay={noop} onPress={noop} testID="song-loading" />
            <SongCard title="Untitled Demo" artists={['Lio Brandt']} onPlay={noop} onPress={noop} testID="song-no-artwork" />
            <SongCard
              title="A Very Long Song Title That Keeps Going Past the Edge of the Cover"
              artists={['Mara Vell', 'Juno Park', 'The Low Orchard']}
              artwork={cover(120, 200)}
              onPlay={noop}
              onPress={noop}
              testID="song-long"
            />
            <SongCard
              title="Two Rivers"
              artists={[{ name: 'Mara Vell', id: 'mara' }, { name: 'Oren Kade', id: 'oren' }]}
              onPressArtist={noop}
              artwork={cover(90, 160, 'wave')}
              onPlay={noop}
              onPress={noop}
              testID="song-artist-links"
            />
            <SongCard title="Selected" artists={['Juno Park']} artwork={cover(300, 20)} selected onPress={noop} testID="song-selected" />
          </Wrap>
        </Section>
        <Section title="Row — like, duration, menu">
          <View style={{ maxWidth: 640 }}>
            {[
              { id: 'a', title: 'Night Drive', artists: ['Mara Vell'], album: 'Low Tide', duration: '3:45', artwork: cover(260, 320), explicit: true },
              { id: 'b', title: 'Glass Harbour', artists: ['Juno Park', 'Oren Kade'], album: 'Harbour Lights', duration: '4:12', artwork: cover(190, 230, 'wave') },
              { id: 'c', title: 'Paper Lanterns', artists: ['Oren Kade'], album: 'Festival of Small Things', duration: '2:58', artwork: cover(30, 350, 'bars') },
              { id: 'd', title: 'A Very Long Song Title That Keeps Going and Going Until It Truncates', artists: ['The Low Orchard'], album: 'Orchard Sessions', duration: '6:03' },
            ].map(({ id, ...song }) => (
              <SongCard
                key={id}
                {...song}
                layout="row"
                current={playing === id}
                playing={playing === id}
                onPlay={() => setPlaying((p) => (p === id ? null : id))}
                onPress={noop}
                liked={liked[id] ?? false}
                onLikedChange={(next) => setLiked((l) => ({ ...l, [id]: next }))}
                menuItems={MENU}
                testID={`song-row-${id}`}
              />
            ))}
            <SongCard title="" layout="row" skeleton />
          </View>
        </Section>
      </Page>
    );
  },
};

/** Albums, singles, EPs and artists, as tiles and rows. */
export const AlbumsAndArtists: Story = {
  render: () => (
    <Page>
      <Section title="Albums">
        <Wrap>
          <AlbumCard title="Low Tide" artist="Mara Vell" year="2026" artwork={cover(260, 320)} onPress={noop} onPlay={noop} menuItems={MENU} testID="album" />
          <AlbumCard title="Harbour Lights" artist="Juno Park" year="2025" albumType="single" artwork={cover(190, 230, 'wave')} onPress={noop} onPlay={noop} />
          <AlbumCard title="Festival of Small Things" artist="Oren Kade" year="2024" albumType="ep" explicit artwork={cover(30, 350, 'bars')} onPress={noop} onPlay={noop} />
          <AlbumCard title="No Cover Yet" artist="Lio Brandt" year="2026" onPress={noop} />
          <AlbumCard title="" skeleton />
        </Wrap>
      </Section>
      <Section title="Artists — round, verified, followers">
        <Wrap>
          <ArtistCard name="Mara Vell" verified followers="1.2M followers" artwork={face(20)} onPress={noop} onPlay={noop} menuItems={MENU} testID="artist" />
          <ArtistCard name="Juno Park" artwork={face(200)} onPress={noop} onPlay={noop} />
          <ArtistCard name="The Low Orchard" size="small" artwork={face(120)} onPress={noop} />
          <ArtistCard name="Unknown" onPress={noop} />
          <ArtistCard name="" skeleton />
        </Wrap>
      </Section>
      <Section title="Rows">
        <View style={{ maxWidth: 560 }}>
          <AlbumCard layout="row" title="Low Tide" artist="Mara Vell" year="2026" artwork={cover(260, 320)} onPress={noop} onPlay={noop} menuItems={MENU} testID="album-row" />
          <ArtistCard layout="row" name="Mara Vell" verified followers="1.2M followers" artwork={face(20)} onPress={noop} onPlay={noop} menuItems={MENU} testID="artist-row" />
          <ArtistCard layout="row" size="small" name="Juno Park" artwork={face(200)} onPress={noop} />
        </View>
      </Section>
    </Page>
  ),
};

/** Playlists: artwork, a 2×2 mosaic, a partial mosaic, a generated cover, neutral, collaborative. */
export const Playlists: Story = {
  render: () => (
    <Page>
      <Wrap>
        <PlaylistCard title="Late Hours" owner="Maya" trackCount="42 songs" artwork={cover(280, 330, 'wave')} onPress={noop} onPlay={noop} menuItems={MENU} testID="playlist-artwork" />
        <PlaylistCard
          title="Road Trip"
          owner="Teo"
          trackCount="118 songs"
          mosaic={[cover(10, 40), cover(200, 240, 'wave'), cover(120, 160, 'bars'), cover(300, 330)]}
          onPress={noop}
          onPlay={noop}
          testID="playlist-mosaic"
        />
        <PlaylistCard title="Two Tracks" owner="Ines" trackCount="2 songs" mosaic={[cover(60, 90), cover(220, 260, 'bars')]} onPress={noop} testID="playlist-mosaic-2" />
        <PlaylistCard title="Morning Pages" owner="Maya" trackCount="12 songs" artworkColor="#2f7d6d" collaborative onPress={noop} onPlay={noop} testID="playlist-generated" />
        <PlaylistCard title="New Playlist" owner="Maya" trackCount="0 songs" onPress={noop} testID="playlist-neutral" />
        <PlaylistCard title="Pale Colour" owner="Maya" artworkColor="#f5e9a8" onPress={noop} testID="playlist-pale" />
      </Wrap>
      <View style={{ maxWidth: 560 }}>
        <PlaylistCard layout="row" title="Late Hours" owner="Maya" trackCount="42 songs" artwork={cover(280, 330, 'wave')} onPress={noop} onPlay={noop} menuItems={MENU} />
        <PlaylistCard layout="row" title="Morning Pages" owner="Maya" trackCount="12 songs" artworkColor="#2f7d6d" collaborative onPress={noop} />
        <PlaylistCard layout="row" title="Road Trip" owner="Teo" mosaic={[cover(10, 40), cover(200, 240, 'wave'), cover(120, 160, 'bars'), cover(300, 330)]} onPress={noop} />
      </View>
    </Page>
  ),
};

/** Generated mixes in three colours and neutral, tiles and rows. */
export const Mixes: Story = {
  render: () => (
    <Page>
      <Wrap>
        <MixCard title="Daily Mix 1" description="Mara Vell, Juno Park, Oren Kade and more" artworkColor="#7c3aed" faces={[face(20), face(200), face(120)]} onPress={noop} onPlay={noop} menuItems={MENU} testID="mix" />
        <MixCard title="Daily Mix 2" description="The Low Orchard, Lio Brandt and more" artworkColor="#e0a800" faces={[face(40), face(300)]} onPress={noop} onPlay={noop} testID="mix-yellow" />
        <MixCard title="Night Radio" coverTitle="Night Radio" description="Based on Night Drive" artworkColor="#0e7490" faces={[face(180)]} size="large" onPress={noop} onPlay={noop} />
        <MixCard title="Discover" description="New music picked for you" size="small" onPress={noop} testID="mix-neutral" />
      </Wrap>
      <View style={{ maxWidth: 560 }}>
        <MixCard layout="row" title="Daily Mix 1" description="Mara Vell, Juno Park and more" artworkColor="#7c3aed" faces={[face(20), face(200)]} onPress={noop} onPlay={noop} menuItems={MENU} />
      </View>
    </Page>
  ),
};

/** Shows, episodes (progress, played, row with actions) and audiobooks. */
export const PodcastsAndBooks: Story = {
  render: function PodcastsStory() {
    const [playing, setPlaying] = useState(false);
    const actions = (
      <>
        <Button variant="ghost" size="small" iconOnly leadingIcon={RiAddCircleLine} accessibilityLabel="Save episode" onPress={noop} />
        <Button variant="ghost" size="small" iconOnly leadingIcon={RiDownloadLine} accessibilityLabel="Download episode" onPress={noop} />
      </>
    );
    return (
      <Page>
        <Section title="Podcasts — radius 12">
          <Wrap>
            <PodcastCard title="Slow Signals" publisher="Harbor Audio" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} menuItems={MENU} testID="podcast" />
            <PodcastCard title="The Long Walk Home" publisher="Wayfarer Studio" artwork={cover(20, 60)} onPress={noop} />
            <PodcastCard title="No Art" publisher="Independent" onPress={noop} size="small" />
          </Wrap>
        </Section>
        <Section title="Episodes — tile">
          <Wrap>
            <EpisodeCard title="Tide Tables and Other Clocks" show="Slow Signals" date="12 Sep" duration="48 min" description="Why coastal towns kept two kinds of time, and what happened when the railway arrived with a third." progress={0.62} remaining="18 min left" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} testID="episode-progress" />
            <EpisodeCard title="Lanterns" show="Slow Signals" date="5 Sep" duration="36 min" description="A short one." played explicit artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} testID="episode-played" />
          </Wrap>
        </Section>
        <Section title="Episodes — row (play always visible, actions)">
          <View style={{ maxWidth: 720 }}>
            <EpisodeCard layout="row" title="Tide Tables and Other Clocks" show="Slow Signals" date="12 Sep" duration="48 min" description="Why coastal towns kept two kinds of time, and what happened when the railway arrived with a third that nobody had asked for." progress={0.62} remaining="18 min left" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={() => setPlaying((p) => !p)} playing={playing} actions={actions} menuItems={MENU} testID="episode-row" />
            <EpisodeCard layout="row" title="Lanterns" show="Slow Signals" date="5 Sep" duration="36 min" description="A short one." played explicit artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} actions={actions} testID="episode-row-played" />
            <EpisodeCard layout="row" size="small" title="New Episode" date="Today" duration="52 min" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} actions={actions} />
          </View>
        </Section>
        <Section title="Audiobooks — 2:3 cover">
          <Wrap>
            <AudiobookCard title="The Quiet Coast" author="Ines Calder" narrator="Teo Marsh" duration="11 h 20 min" progress={0.35} artwork={cover(350, 20, 'wave')} onPress={noop} onPlay={noop} testID="audiobook" />
            <AudiobookCard title="Salt and Iron" author="R. Okafor" duration="8 h 5 min" artwork={cover(210, 250)} onPress={noop} size="small" />
          </Wrap>
          <View style={{ maxWidth: 560 }}>
            <AudiobookCard layout="row" title="The Quiet Coast" author="Ines Calder" narrator="Teo Marsh" duration="11 h 20 min" progress={0.35} artwork={cover(350, 20, 'wave')} onPress={noop} onPlay={noop} menuItems={MENU} />
          </View>
        </Section>
      </Page>
    );
  },
};

/** Browse categories, concerts, profiles and friend activity. */
export const BrowseAndSocial: Story = {
  render: () => (
    <Page>
      <Section title="Genres">
        <Wrap>
          <GenreCard title="Ambient" color="#0e7490" artwork={cover(180, 220, 'wave')} onPress={noop} testID="genre" />
          <GenreCard title="Folk & Acoustic" color="#e0a800" artwork={cover(40, 20)} onPress={noop} testID="genre-yellow" />
          <GenreCard title="Podcasts" color="#db2777" artwork={cover(300, 340, 'bars')} size="large" onPress={noop} />
          <GenreCard title="Neutral" size="small" onPress={noop} />
        </Wrap>
      </Section>
      <Section title="Events">
        <Wrap>
          <EventCard title="Mara Vell" month="Oct" day="14" venue="The Lantern Hall" city="Porto" time="Fri 20:00" image={cover(260, 320)} action={<Button size="small" onPress={noop}>Tickets</Button>} onPress={noop} testID="event" />
          <EventCard title="Juno Park" month="Nov" day="2" venue="Pier Seven" city="Valmere" time="Sun 19:30" image={cover(190, 230, 'wave')} soldOut onPress={noop} testID="event-sold-out" />
        </Wrap>
        <View style={{ maxWidth: 560 }}>
          <EventCard layout="row" title="Mara Vell" month="Oct" day="14" venue="The Lantern Hall" city="Porto" time="Fri 20:00" action={<Button size="small" variant="secondary" onPress={noop}>Tickets</Button>} onPress={noop} testID="event-row" />
          <EventCard layout="row" title="Juno Park" month="Nov" day="2" venue="Pier Seven" city="Valmere" soldOut onPress={noop} />
        </View>
      </Section>
      <Section title="Profiles">
        <Wrap>
          <ProfileCard name="Maya Ortiz" followsYou artwork={face(330)} action={<Button size="small" variant="secondary" onPress={noop}>Follow</Button>} onPress={noop} testID="profile" />
          <ProfileCard name="Teo Marsh" followers="214 followers" artwork={face(90)} onPress={noop} />
        </Wrap>
        <View style={{ maxWidth: 560 }}>
          <ProfileCard layout="row" name="Maya Ortiz" followsYou artwork={face(330)} action={<Button size="small" variant="secondary" onPress={noop}>Follow</Button>} onPress={noop} />
        </View>
      </Section>
      <Section title="Friend activity">
        <View style={{ maxWidth: 360 }}>
          <FriendActivityCard name="Maya Ortiz" avatar={face(330)} track="Night Drive" artist="Mara Vell" context="Late Hours" live onPress={noop} testID="friend-live" />
          <FriendActivityCard name="Teo Marsh" avatar={face(90)} track="Glass Harbour" artist="Juno Park" context="Harbour Lights" contextType="album" time="12 min" onPress={noop} testID="friend" />
          <FriendActivityCard name="Ines Calder" track="A Very Long Track Name That Truncates" artist="The Low Orchard" time="2 h" onPress={noop} />
          <FriendActivityCard name="" track="" artist="" skeleton />
        </View>
      </Section>
    </Page>
  ),
};

/** Recap and share cards. */
export const RecapAndShare: Story = {
  render: () => (
    <Page>
      <Wrap>
        <RecapCard
          eyebrow="Your 2026 in sound"
          value="48,210"
          unit="minutes listened"
          artworkColor="#7c3aed"
          highlights={[
            { label: 'Top artist', title: 'Mara Vell', artwork: face(20), round: true },
            { label: 'Top song', title: 'Night Drive', artwork: cover(260, 320) },
          ]}
          onShare={noop}
          style={{ width: 340 }}
          testID="recap"
        />
        <RecapCard eyebrow="September" value="3,904" unit="minutes" highlights={[{ label: 'Top genre', title: 'Ambient', artwork: cover(180, 220, 'wave') }]} onShare={noop} style={{ width: 300 }} testID="recap-neutral" />
        <ShareCard
          title="Night Drive"
          artist="Mara Vell"
          explicit
          artwork={cover(260, 320)}
          artworkColor="#be185d"
          lyrics={['And the road hums low,', 'every light a small hello']}
          testID="share"
        />
        <ShareCard title="Glass Harbour" artist="Juno Park" artwork={cover(190, 230, 'wave')} artworkColor="#bae6fd" style={{ width: 280 }} />
      </Wrap>
    </Page>
  ),
};

function Home({ columns, testID }: { columns: number; testID?: string }) {
  const [current, setCurrent] = useState('late');
  const [playing, setPlaying] = useState(true);
  const toggle = (id: string) => () => {
    if (current === id) setPlaying((p) => !p);
    else {
      setCurrent(id);
      setPlaying(true);
    }
  };
  const quick = [
    { id: 'late', title: 'Late Hours', artwork: cover(280, 330, 'wave'), typeLabel: 'Playlist' },
    { id: 'liked', title: 'Liked Songs', artworkColor: '#6d28d9', typeLabel: 'Playlist' },
    { id: 'mara', title: 'Mara Vell', artwork: face(20), round: true, typeLabel: 'Artist' },
    { id: 'low', title: 'Low Tide', artwork: cover(260, 320), typeLabel: 'Album' },
    { id: 'signals', title: 'Slow Signals', artwork: cover(160, 200, 'bars'), typeLabel: 'Podcast' },
    { id: 'mix', title: 'Daily Mix 1', artworkColor: '#0e7490', typeLabel: 'Mix' },
    { id: 'road', title: 'Road Trip with a Long Name That Wraps', artwork: cover(10, 40), typeLabel: 'Playlist' },
    { id: 'orchard', title: 'Orchard Sessions', artwork: cover(120, 160, 'bars'), typeLabel: 'Album' },
  ];
  return (
    <View style={{ gap: 24 }} testID={testID}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8, paddingRight: 8 }}>
        {quick.map(({ id, ...item }) => (
          <View key={id} style={{ width: `${100 / columns}%`, paddingLeft: 4, paddingRight: 4, paddingBottom: 8 }}>
            <QuickAccessTile
              {...item}
              current={current === id}
              playing={current === id && playing}
              onPlay={toggle(id)}
              onPress={noop}
              testID={`quick-${id}`}
            />
          </View>
        ))}
      </View>
      <Shelf title="Made for you">
        <MixCard title="Daily Mix 1" description="Mara Vell, Juno Park and more" artworkColor="#7c3aed" faces={[face(20), face(200), face(120)]} onPress={noop} onPlay={toggle('mix')} playing={current === 'mix' && playing} menuItems={MENU} testID="home-mix" />
        <MixCard title="Daily Mix 2" description="The Low Orchard, Lio Brandt and more" artworkColor="#e0a800" faces={[face(40), face(300)]} onPress={noop} onPlay={noop} />
        <PlaylistCard title="Road Trip" owner="Teo" trackCount="118 songs" mosaic={[cover(10, 40), cover(200, 240, 'wave'), cover(120, 160, 'bars'), cover(300, 330)]} onPress={noop} onPlay={noop} />
        <PlaylistCard title="Morning Pages" owner="Maya" trackCount="12 songs" artworkColor="#2f7d6d" onPress={noop} onPlay={noop} />
        <PlaylistCard title="Late Hours" owner="Maya" trackCount="42 songs" artwork={cover(280, 330, 'wave')} onPress={noop} onPlay={toggle('late')} playing={current === 'late' && playing} current={current === 'late'} />
        <AlbumCard title="Low Tide" artist="Mara Vell" year="2026" artwork={cover(260, 320)} onPress={noop} onPlay={noop} />
      </Shelf>
      <Shelf title="Popular artists">
        <ArtistCard name="Mara Vell" verified artwork={face(20)} onPress={noop} onPlay={noop} />
        <ArtistCard name="Juno Park" artwork={face(200)} onPress={noop} onPlay={noop} />
        <ArtistCard name="Oren Kade" artwork={face(120)} onPress={noop} onPlay={noop} />
        <ArtistCard name="The Low Orchard" artwork={face(40)} onPress={noop} onPlay={noop} />
        <ArtistCard name="Lio Brandt" artwork={face(300)} onPress={noop} onPlay={noop} />
      </Shelf>
      <Shelf title="Shows to try">
        <PodcastCard title="Slow Signals" publisher="Harbor Audio" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} />
        <PodcastCard title="The Long Walk Home" publisher="Wayfarer Studio" artwork={cover(20, 60)} onPress={noop} onPlay={noop} />
        <AudiobookCard title="The Quiet Coast" author="Ines Calder" duration="11 h 20 min" progress={0.35} artwork={cover(350, 20, 'wave')} onPress={noop} onPlay={noop} />
        <EpisodeCard title="Tide Tables" show="Slow Signals" date="12 Sep" duration="48 min" progress={0.62} remaining="18 min left" artwork={cover(160, 200, 'bars')} onPress={noop} onPlay={noop} />
      </Shelf>
    </View>
  );
}

function HomePage({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, paddingTop: 16, paddingBottom: 16, minHeight: '100%' }}>
      <View style={{ width, maxWidth: '100%', alignSelf: 'center' }}>
        <Home columns={width < 600 ? 2 : 4} testID="home" />
      </View>
    </View>
  );
}

/** The home screen at 1280: quick-access tiles over shelves of cards. */
export const HomeWide: Story = { render: () => <HomePage width={1280} /> };

/** The home screen at 1280 in dark mode. */
export const HomeWideDark: Story = { globals: { theme: 'dark' }, render: () => <HomePage width={1280} /> };

/** The home screen at 390. */
export const HomeNarrow: Story = { render: () => <HomePage width={390} /> };

/** The home screen at 390 in dark mode. */
export const HomeNarrowDark: Story = { globals: { theme: 'dark' }, render: () => <HomePage width={390} /> };

/** Every skeleton. */
export const Loading: Story = {
  render: () => (
    <Page>
      <Wrap>
        {SIZES.map((size) => (
          <AlbumCard key={size} title="" size={size} skeleton />
        ))}
        <ArtistCard name="" skeleton />
        <AudiobookCard title="" skeleton />
        <GenreCard title="" skeleton />
      </Wrap>
      <View style={{ maxWidth: 560, gap: 8 }}>
        <SongCard title="" layout="row" skeleton />
        <ArtistCard name="" layout="row" skeleton />
        <QuickAccessTile title="" skeleton />
        <FriendActivityCard name="" track="" artist="" skeleton />
        <RecapCard value="" skeleton style={{ width: 320 }} />
      </View>
    </Page>
  ),
};

/** Tracks in dark mode. */
export const SongsDark: Story = { globals: { theme: 'dark' }, render: Songs.render };

/** Browse, events, profiles and friend activity in dark mode. */
export const BrowseAndSocialDark: Story = { globals: { theme: 'dark' }, render: BrowseAndSocial.render };

/** Recap and share cards in dark mode. */
export const RecapAndShareDark: Story = { globals: { theme: 'dark' }, render: RecapAndShare.render };
