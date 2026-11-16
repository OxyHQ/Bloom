import { fn } from 'storybook/test';
import { Shelf } from '../media-shelf';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useContainerWidth } from '../hooks/use-container-width';

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
  id: 'blocks-music-media-cards',
  title: 'Patterns/Music/Media Cards',
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

const onDemoAction = fn().mockName('media-card.action');

const MENU: MediaCardMenuItem[] = [
  { label: 'Add to queue', onPress: onDemoAction },
  { label: 'Go to artist', onPress: onDemoAction },
  { label: 'Share', onPress: onDemoAction },
  { label: 'Remove from library', onPress: onDemoAction, destructive: true },
];

function Page({
  children,
  width,
  testID,
}: {
  children: React.ReactNode;
  width?: number;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{ width: '100%', maxWidth: width, alignSelf: 'center', padding: 16, gap: 28 }}
    >
      {children}
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
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
      {children}
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
                onPress={onDemoAction}
                onPlay={onDemoAction}
                menuItems={MENU}
                testID={`song-${size}`}
              />
            ))}
          </Wrap>
        </Section>
        <Section title="Playing · loading · no artwork · long title · artist links · selected">
          <Wrap>
            <SongCard
              title="Glass Harbour"
              artists={['Juno Park']}
              artwork={cover(190, 230, 'wave')}
              current
              playing
              onPlay={onDemoAction}
              onPress={onDemoAction}
              testID="song-playing"
            />
            <SongCard
              title="Paper Lanterns"
              artists={['Oren Kade']}
              artwork={cover(30, 350, 'bars')}
              loading
              onPlay={onDemoAction}
              onPress={onDemoAction}
              testID="song-loading"
            />
            <SongCard
              title="Untitled Demo"
              artists={['Lio Brandt']}
              onPlay={onDemoAction}
              onPress={onDemoAction}
              testID="song-no-artwork"
            />
            <SongCard
              title="A Very Long Song Title That Keeps Going Past the Edge of the Cover"
              artists={['Mara Vell', 'Juno Park', 'The Low Orchard']}
              artwork={cover(120, 200)}
              onPlay={onDemoAction}
              onPress={onDemoAction}
              testID="song-long"
            />
            <SongCard
              title="Two Rivers"
              artists={[
                { name: 'Mara Vell', id: 'mara' },
                { name: 'Oren Kade', id: 'oren' },
              ]}
              onPressArtist={onDemoAction}
              artwork={cover(90, 160, 'wave')}
              onPlay={onDemoAction}
              onPress={onDemoAction}
              testID="song-artist-links"
            />
            <SongCard
              title="Selected"
              artists={['Juno Park']}
              artwork={cover(300, 20)}
              selected
              onPress={onDemoAction}
              testID="song-selected"
            />
          </Wrap>
        </Section>
        <Section title="Row — like, duration, menu">
          <View style={{ maxWidth: 640 }}>
            {[
              {
                id: 'a',
                title: 'Night Drive',
                artists: ['Mara Vell'],
                album: 'Low Tide',
                duration: '3:45',
                artwork: cover(260, 320),
                explicit: true,
              },
              {
                id: 'b',
                title: 'Glass Harbour',
                artists: ['Juno Park', 'Oren Kade'],
                album: 'Harbour Lights',
                duration: '4:12',
                artwork: cover(190, 230, 'wave'),
              },
              {
                id: 'c',
                title: 'Paper Lanterns',
                artists: ['Oren Kade'],
                album: 'Festival of Small Things',
                duration: '2:58',
                artwork: cover(30, 350, 'bars'),
              },
              {
                id: 'd',
                title: 'A Very Long Song Title That Keeps Going and Going Until It Truncates',
                artists: ['The Low Orchard'],
                album: 'Orchard Sessions',
                duration: '6:03',
              },
            ].map(({ id, ...song }) => (
              <SongCard
                key={id}
                {...song}
                layout="row"
                current={playing === id}
                playing={playing === id}
                onPlay={() => setPlaying((p) => (p === id ? null : id))}
                onPress={onDemoAction}
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
          <AlbumCard
            title="Low Tide"
            artist="Mara Vell"
            year="2026"
            artwork={cover(260, 320)}
            onPress={onDemoAction}
            onPlay={onDemoAction}
            menuItems={MENU}
            testID="album"
          />
          <AlbumCard
            title="Harbour Lights"
            artist="Juno Park"
            year="2025"
            albumType="single"
            artwork={cover(190, 230, 'wave')}
            onPress={onDemoAction}
            onPlay={onDemoAction}
          />
          <AlbumCard
            title="Festival of Small Things"
            artist="Oren Kade"
            year="2024"
            albumType="ep"
            explicit
            artwork={cover(30, 350, 'bars')}
            onPress={onDemoAction}
            onPlay={onDemoAction}
          />
          <AlbumCard title="No Cover Yet" artist="Lio Brandt" year="2026" onPress={onDemoAction} />
          <AlbumCard title="" skeleton />
        </Wrap>
      </Section>
      <Section title="Artists — round, verified, followers">
        <Wrap>
          <ArtistCard
            name="Mara Vell"
            verified
            followers="1.2M followers"
            artwork={face(20)}
            onPress={onDemoAction}
            onPlay={onDemoAction}
            menuItems={MENU}
            testID="artist"
          />
          <ArtistCard
            name="Juno Park"
            artwork={face(200)}
            onPress={onDemoAction}
            onPlay={onDemoAction}
          />
          <ArtistCard
            name="The Low Orchard"
            size="small"
            artwork={face(120)}
            onPress={onDemoAction}
          />
          <ArtistCard name="Unknown" onPress={onDemoAction} />
          <ArtistCard name="" skeleton />
        </Wrap>
      </Section>
      <Section title="Rows">
        <View style={{ maxWidth: 560 }}>
          <AlbumCard
            layout="row"
            title="Low Tide"
            artist="Mara Vell"
            year="2026"
            artwork={cover(260, 320)}
            onPress={onDemoAction}
            onPlay={onDemoAction}
            menuItems={MENU}
            testID="album-row"
          />
          <ArtistCard
            layout="row"
            name="Mara Vell"
            verified
            followers="1.2M followers"
            artwork={face(20)}
            onPress={onDemoAction}
            onPlay={onDemoAction}
            menuItems={MENU}
            testID="artist-row"
          />
          <ArtistCard
            layout="row"
            size="small"
            name="Juno Park"
            artwork={face(200)}
            onPress={onDemoAction}
          />
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
        <PlaylistCard
          title="Late Hours"
          owner="Maya"
          trackCount="42 songs"
          artwork={cover(280, 330, 'wave')}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          menuItems={MENU}
          testID="playlist-artwork"
        />
        <PlaylistCard
          title="Road Trip"
          owner="Teo"
          trackCount="118 songs"
          mosaic={[
            cover(10, 40),
            cover(200, 240, 'wave'),
            cover(120, 160, 'bars'),
            cover(300, 330),
          ]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          testID="playlist-mosaic"
        />
        <PlaylistCard
          title="Two Tracks"
          owner="Ines"
          trackCount="2 songs"
          mosaic={[cover(60, 90), cover(220, 260, 'bars')]}
          onPress={onDemoAction}
          testID="playlist-mosaic-2"
        />
        <PlaylistCard
          title="Morning Pages"
          owner="Maya"
          trackCount="12 songs"
          artworkColor="#2f7d6d"
          collaborative
          onPress={onDemoAction}
          onPlay={onDemoAction}
          testID="playlist-generated"
        />
        <PlaylistCard
          title="New Playlist"
          owner="Maya"
          trackCount="0 songs"
          onPress={onDemoAction}
          testID="playlist-neutral"
        />
        <PlaylistCard
          title="Pale Colour"
          owner="Maya"
          artworkColor="#f5e9a8"
          onPress={onDemoAction}
          testID="playlist-pale"
        />
      </Wrap>
      <View style={{ maxWidth: 560 }}>
        <PlaylistCard
          layout="row"
          title="Late Hours"
          owner="Maya"
          trackCount="42 songs"
          artwork={cover(280, 330, 'wave')}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          menuItems={MENU}
        />
        <PlaylistCard
          layout="row"
          title="Morning Pages"
          owner="Maya"
          trackCount="12 songs"
          artworkColor="#2f7d6d"
          collaborative
          onPress={onDemoAction}
        />
        <PlaylistCard
          layout="row"
          title="Road Trip"
          owner="Teo"
          mosaic={[
            cover(10, 40),
            cover(200, 240, 'wave'),
            cover(120, 160, 'bars'),
            cover(300, 330),
          ]}
          onPress={onDemoAction}
        />
      </View>
    </Page>
  ),
};

/** Generated mixes in three colours and neutral, tiles and rows. */
export const Mixes: Story = {
  render: () => (
    <Page>
      <Wrap>
        <MixCard
          title="Daily Mix 1"
          description="Mara Vell, Juno Park, Oren Kade and more"
          artworkColor="#7c3aed"
          faces={[face(20), face(200), face(120)]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          menuItems={MENU}
          testID="mix"
        />
        <MixCard
          title="Daily Mix 2"
          description="The Low Orchard, Lio Brandt and more"
          artworkColor="#e0a800"
          faces={[face(40), face(300)]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          testID="mix-yellow"
        />
        <MixCard
          title="Night Radio"
          coverTitle="Night Radio"
          description="Based on Night Drive"
          artworkColor="#0e7490"
          faces={[face(180)]}
          size="large"
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <MixCard
          title="Discover"
          description="New music picked for you"
          size="small"
          onPress={onDemoAction}
          testID="mix-neutral"
        />
      </Wrap>
      <View style={{ maxWidth: 560 }}>
        <MixCard
          layout="row"
          title="Daily Mix 1"
          description="Mara Vell, Juno Park and more"
          artworkColor="#7c3aed"
          faces={[face(20), face(200)]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
          menuItems={MENU}
        />
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
        <Button
          size="sm"
          iconOnly
          leadingIcon={RiAddCircleLine}
          accessibilityLabel="Save episode"
          onPress={onDemoAction}
          tone="accent"
          appearance="subtle"
        />
        <Button
          size="sm"
          iconOnly
          leadingIcon={RiDownloadLine}
          accessibilityLabel="Download episode"
          onPress={onDemoAction}
          tone="accent"
          appearance="subtle"
        />
      </>
    );
    return (
      <Page>
        <Section title="Podcasts — radius 12">
          <Wrap>
            <PodcastCard
              title="Slow Signals"
              publisher="Harbor Audio"
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              menuItems={MENU}
              testID="podcast"
            />
            <PodcastCard
              title="The Long Walk Home"
              publisher="Wayfarer Studio"
              artwork={cover(20, 60)}
              onPress={onDemoAction}
            />
            <PodcastCard
              title="No Art"
              publisher="Independent"
              onPress={onDemoAction}
              size="small"
            />
          </Wrap>
        </Section>
        <Section title="Episodes — tile">
          <Wrap>
            <EpisodeCard
              title="Tide Tables and Other Clocks"
              show="Slow Signals"
              date="12 Sep"
              duration="48 min"
              description="Why coastal towns kept two kinds of time, and what happened when the railway arrived with a third."
              progress={0.62}
              remaining="18 min left"
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              testID="episode-progress"
            />
            <EpisodeCard
              title="Lanterns"
              show="Slow Signals"
              date="5 Sep"
              duration="36 min"
              description="A short one."
              played
              explicit
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              testID="episode-played"
            />
          </Wrap>
        </Section>
        <Section title="Episodes — row (play always visible, actions)">
          <View style={{ maxWidth: 720 }}>
            <EpisodeCard
              layout="row"
              title="Tide Tables and Other Clocks"
              show="Slow Signals"
              date="12 Sep"
              duration="48 min"
              description="Why coastal towns kept two kinds of time, and what happened when the railway arrived with a third that nobody had asked for."
              progress={0.62}
              remaining="18 min left"
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={() => setPlaying((p) => !p)}
              playing={playing}
              actions={actions}
              menuItems={MENU}
              testID="episode-row"
            />
            <EpisodeCard
              layout="row"
              title="Lanterns"
              show="Slow Signals"
              date="5 Sep"
              duration="36 min"
              description="A short one."
              played
              explicit
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              actions={actions}
              testID="episode-row-played"
            />
            <EpisodeCard
              layout="row"
              size="small"
              title="New Episode"
              date="Today"
              duration="52 min"
              artwork={cover(160, 200, 'bars')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              actions={actions}
            />
          </View>
        </Section>
        <Section title="Audiobooks — 2:3 cover">
          <Wrap>
            <AudiobookCard
              title="The Quiet Coast"
              author="Ines Calder"
              narrator="Teo Marsh"
              duration="11 h 20 min"
              progress={0.35}
              artwork={cover(350, 20, 'wave')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              testID="audiobook"
            />
            <AudiobookCard
              title="Salt and Iron"
              author="R. Okafor"
              duration="8 h 5 min"
              artwork={cover(210, 250)}
              onPress={onDemoAction}
              size="small"
            />
          </Wrap>
          <View style={{ maxWidth: 560 }}>
            <AudiobookCard
              layout="row"
              title="The Quiet Coast"
              author="Ines Calder"
              narrator="Teo Marsh"
              duration="11 h 20 min"
              progress={0.35}
              artwork={cover(350, 20, 'wave')}
              onPress={onDemoAction}
              onPlay={onDemoAction}
              menuItems={MENU}
            />
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
          <GenreCard
            title="Ambient"
            color="#0e7490"
            artwork={cover(180, 220, 'wave')}
            onPress={onDemoAction}
            testID="genre"
          />
          <GenreCard
            title="Folk & Acoustic"
            color="#e0a800"
            artwork={cover(40, 20)}
            onPress={onDemoAction}
            testID="genre-yellow"
          />
          <GenreCard
            title="Podcasts"
            color="#db2777"
            artwork={cover(300, 340, 'bars')}
            size="large"
            onPress={onDemoAction}
          />
          <GenreCard title="Neutral" size="small" onPress={onDemoAction} />
        </Wrap>
      </Section>
      <Section title="Events">
        <Wrap>
          <EventCard
            title="Mara Vell"
            month="Oct"
            day="14"
            venue="The Lantern Hall"
            city="Porto"
            time="Fri 20:00"
            image={cover(260, 320)}
            action={
              <Button size="sm" onPress={onDemoAction}>
                Tickets
              </Button>
            }
            onPress={onDemoAction}
            testID="event"
          />
          <EventCard
            title="Juno Park"
            month="Nov"
            day="2"
            venue="Pier Seven"
            city="Valmere"
            time="Sun 19:30"
            image={cover(190, 230, 'wave')}
            soldOut
            onPress={onDemoAction}
            testID="event-sold-out"
          />
        </Wrap>
        <View style={{ maxWidth: 560 }}>
          <EventCard
            layout="row"
            title="Mara Vell"
            month="Oct"
            day="14"
            venue="The Lantern Hall"
            city="Porto"
            time="Fri 20:00"
            action={
              <Button size="sm" onPress={onDemoAction} tone="neutral" appearance="outline">
                Tickets
              </Button>
            }
            onPress={onDemoAction}
            testID="event-row"
          />
          <EventCard
            layout="row"
            title="Juno Park"
            month="Nov"
            day="2"
            venue="Pier Seven"
            city="Valmere"
            soldOut
            onPress={onDemoAction}
          />
        </View>
      </Section>
      <Section title="Profiles">
        <Wrap>
          <ProfileCard
            name="Maya Ortiz"
            followsYou
            artwork={face(330)}
            action={
              <Button size="sm" onPress={onDemoAction} tone="neutral" appearance="outline">
                Follow
              </Button>
            }
            onPress={onDemoAction}
            testID="profile"
          />
          <ProfileCard
            name="Teo Marsh"
            followers="214 followers"
            artwork={face(90)}
            onPress={onDemoAction}
          />
        </Wrap>
        <View style={{ maxWidth: 560 }}>
          <ProfileCard
            layout="row"
            name="Maya Ortiz"
            followsYou
            artwork={face(330)}
            action={
              <Button size="sm" onPress={onDemoAction} tone="neutral" appearance="outline">
                Follow
              </Button>
            }
            onPress={onDemoAction}
          />
        </View>
      </Section>
      <Section title="Friend activity">
        <View style={{ maxWidth: 360 }}>
          <FriendActivityCard
            name="Maya Ortiz"
            avatar={face(330)}
            track="Night Drive"
            artist="Mara Vell"
            context="Late Hours"
            live
            onPress={onDemoAction}
            testID="friend-live"
          />
          <FriendActivityCard
            name="Teo Marsh"
            avatar={face(90)}
            track="Glass Harbour"
            artist="Juno Park"
            context="Harbour Lights"
            contextType="album"
            time="12 min"
            onPress={onDemoAction}
            testID="friend"
          />
          <FriendActivityCard
            name="Ines Calder"
            track="A Very Long Track Name That Truncates"
            artist="The Low Orchard"
            time="2 h"
            onPress={onDemoAction}
          />
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
          onShare={onDemoAction}
          style={{ width: 340 }}
          testID="recap"
        />
        <RecapCard
          eyebrow="September"
          value="3,904"
          unit="minutes"
          highlights={[{ label: 'Top genre', title: 'Ambient', artwork: cover(180, 220, 'wave') }]}
          onShare={onDemoAction}
          style={{ width: 300 }}
          testID="recap-neutral"
        />
        <ShareCard
          title="Night Drive"
          artist="Mara Vell"
          explicit
          artwork={cover(260, 320)}
          artworkColor="#be185d"
          lyrics={['And the road hums low,', 'every light a small hello']}
          testID="share"
        />
        <ShareCard
          title="Glass Harbour"
          artist="Juno Park"
          artwork={cover(190, 230, 'wave')}
          artworkColor="#bae6fd"
          style={{ width: 280 }}
        />
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
    {
      id: 'signals',
      title: 'Slow Signals',
      artwork: cover(160, 200, 'bars'),
      typeLabel: 'Podcast',
    },
    { id: 'mix', title: 'Daily Mix 1', artworkColor: '#0e7490', typeLabel: 'Mix' },
    {
      id: 'road',
      title: 'Road Trip with a Long Name That Wraps',
      artwork: cover(10, 40),
      typeLabel: 'Playlist',
    },
    {
      id: 'orchard',
      title: 'Orchard Sessions',
      artwork: cover(120, 160, 'bars'),
      typeLabel: 'Album',
    },
  ];
  return (
    <View style={{ gap: 24 }} testID={testID}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8, paddingRight: 8 }}>
        {quick.map(({ id, ...item }) => (
          <View
            key={id}
            style={{
              width: `${100 / columns}%`,
              paddingLeft: 4,
              paddingRight: 4,
              paddingBottom: 8,
            }}
          >
            <QuickAccessTile
              {...item}
              current={current === id}
              playing={current === id && playing}
              onPlay={toggle(id)}
              onPress={onDemoAction}
              testID={`quick-${id}`}
            />
          </View>
        ))}
      </View>
      <Shelf title="Made for you">
        <MixCard
          title="Daily Mix 1"
          description="Mara Vell, Juno Park and more"
          artworkColor="#7c3aed"
          faces={[face(20), face(200), face(120)]}
          onPress={onDemoAction}
          onPlay={toggle('mix')}
          playing={current === 'mix' && playing}
          menuItems={MENU}
          testID="home-mix"
        />
        <MixCard
          title="Daily Mix 2"
          description="The Low Orchard, Lio Brandt and more"
          artworkColor="#e0a800"
          faces={[face(40), face(300)]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <PlaylistCard
          title="Road Trip"
          owner="Teo"
          trackCount="118 songs"
          mosaic={[
            cover(10, 40),
            cover(200, 240, 'wave'),
            cover(120, 160, 'bars'),
            cover(300, 330),
          ]}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <PlaylistCard
          title="Morning Pages"
          owner="Maya"
          trackCount="12 songs"
          artworkColor="#2f7d6d"
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <PlaylistCard
          title="Late Hours"
          owner="Maya"
          trackCount="42 songs"
          artwork={cover(280, 330, 'wave')}
          onPress={onDemoAction}
          onPlay={toggle('late')}
          playing={current === 'late' && playing}
          current={current === 'late'}
        />
        <AlbumCard
          title="Low Tide"
          artist="Mara Vell"
          year="2026"
          artwork={cover(260, 320)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
      </Shelf>
      <Shelf title="Popular artists">
        <ArtistCard
          name="Mara Vell"
          verified
          artwork={face(20)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <ArtistCard
          name="Juno Park"
          artwork={face(200)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <ArtistCard
          name="Oren Kade"
          artwork={face(120)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <ArtistCard
          name="The Low Orchard"
          artwork={face(40)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <ArtistCard
          name="Lio Brandt"
          artwork={face(300)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
      </Shelf>
      <Shelf title="Shows to try">
        <PodcastCard
          title="Slow Signals"
          publisher="Harbor Audio"
          artwork={cover(160, 200, 'bars')}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <PodcastCard
          title="The Long Walk Home"
          publisher="Wayfarer Studio"
          artwork={cover(20, 60)}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <AudiobookCard
          title="The Quiet Coast"
          author="Ines Calder"
          duration="11 h 20 min"
          progress={0.35}
          artwork={cover(350, 20, 'wave')}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
        <EpisodeCard
          title="Tide Tables"
          show="Slow Signals"
          date="12 Sep"
          duration="48 min"
          progress={0.62}
          remaining="18 min left"
          artwork={cover(160, 200, 'bars')}
          onPress={onDemoAction}
          onPlay={onDemoAction}
        />
      </Shelf>
    </View>
  );
}

function HomePage() {
  const { width, onLayout } = useContainerWidth();
  return (
    <View
      onLayout={onLayout}
      style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingVertical: 16 }}
    >
      <Home columns={(width ?? 0) < 600 ? 2 : 4} testID="home" />
    </View>
  );
}

/** The responsive home screen: quick-access tiles over shelves of cards. */
export const HomeScreen: Story = { render: () => <HomePage /> };

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
