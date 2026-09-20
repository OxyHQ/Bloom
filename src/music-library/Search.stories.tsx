import React, { useState } from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BrowseGrid } from './BrowseGrid';
import { RecentSearches } from './RecentSearches';
import { SearchField } from './SearchField';
import { SearchResultTabs } from './SearchResultTabs';
import { TopResultCard } from './TopResultCard';
import type { BrowseTile, RecentSearchEntry, SearchResultTab } from './types';

const meta: Meta = {
  title: 'Blocks/Music/Search',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists, songs and genres.
// ---------------------------------------------------------------------------

const img = (seed: string, size = 160) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

const TABS: SearchResultTab[] = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'artists', label: 'Artists' },
  { value: 'albums', label: 'Albums' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'profiles', label: 'Profiles' },
];

const RECENTS: RecentSearchEntry[] = [
  { id: 'r1', title: 'Lumen Vale', meta: 'Artist', cover: img('lumen-vale'), round: true },
  { id: 'r2', title: 'Paper Moons', meta: 'Album · Lumen Vale', cover: img('paper-moons') },
  { id: 'r3', title: 'Harbor Lights', meta: 'Song · Kaito Ferran', cover: img('harbor-lights') },
  { id: 'r4', title: 'Field Notes on Sound', meta: 'Podcast · Ines Marlow', cover: img('field-notes') },
];

const GENRES: BrowseTile[] = [
  { id: 'podcasts', title: 'Podcasts', color: '#1f6f5c', image: img('g-podcasts') },
  { id: 'live', title: 'Live Events', color: '#7a3cc3', image: img('g-live') },
  { id: 'new', title: 'New Releases', color: '#b8d65a', image: img('g-new') },
  { id: 'pop', title: 'Pop', color: '#4b72d6', image: img('g-pop') },
  { id: 'hip-hop', title: 'Hip-Hop', color: '#b5561f', image: img('g-hiphop') },
  { id: 'chill', title: 'Chill', color: '#f4c8d8', image: img('g-chill') },
  { id: 'focus', title: 'Focus', color: '#50535a', image: img('g-focus') },
  { id: 'rock', title: 'Rock', color: '#c2302f', image: img('g-rock') },
  { id: 'jazz', title: 'Jazz', color: '#f2d15c', image: img('g-jazz') },
  { id: 'sleep', title: 'Sleep', color: '#1d2b53', image: img('g-sleep') },
  { id: 'workout', title: 'Workout', color: '#777777', image: img('g-workout') },
  { id: 'indie', title: 'Indie', color: 'not-a-colour', image: img('g-indie') },
];

const SONGS = [
  { id: 's1', title: 'Harbor Lights', artist: 'Lumen Vale', length: '3:41' },
  { id: 's2', title: 'Paper Moons', artist: 'Lumen Vale', length: '4:05' },
  { id: 's3', title: 'Low Tide Choir', artist: 'Lumen Vale, Kaito Ferran', length: '2:58' },
  { id: 's4', title: 'Salt in the Static', artist: 'Lumen Vale', length: '3:22' },
];

// ---------------------------------------------------------------------------

function Canvas({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', padding: 16, gap: 24, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

function Heading({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="title-2-bold" role="heading" style={{ color: theme.colors.text }}>
      {children}
    </Text>
  );
}

/** A placeholder track row — the track list itself belongs to another family. */
function SongRow({ song }: { song: (typeof SONGS)[number] }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8 }}>
      <Image source={{ uri: img(song.id, 80) }} style={{ width: 40, height: 40, borderRadius: 4 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: theme.colors.text }}>
          {song.title}
        </Text>
        <Text variant="caption-1-regular" numberOfLines={1} style={{ color: theme.colors.textSecondary }}>
          {song.artist}
        </Text>
      </View>
      <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
        {song.length}
      </Text>
    </View>
  );
}

function SearchPage({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [browse, setBrowse] = useState(false);
  const [tab, setTab] = useState('all');
  const [recents, setRecents] = useState(RECENTS);
  const [playing, setPlaying] = useState(false);
  const hasQuery = query.trim().length > 0;

  return (
    <Canvas>
      <SearchField
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        onBrowsePress={() => setBrowse((b) => !b)}
        browseActive={browse}
        style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}
        testID="search"
      />
      {hasQuery ? (
        <>
          <SearchResultTabs tabs={TABS} value={tab} onValueChange={setTab} testID="tabs" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            <View style={{ flexGrow: 1, flexBasis: 320, gap: 12 }}>
              <Heading>Top result</Heading>
              <TopResultCard
                title="Lumen Vale"
                kind="artist"
                subtitle="4.2M monthly listeners"
                cover={img('lumen-vale', 200)}
                onPress={() => {}}
                onPlayPress={() => setPlaying((p) => !p)}
                playing={playing}
                testID="top"
              />
            </View>
            <View style={{ flexGrow: 1.4, flexBasis: 320, gap: 12 }}>
              <Heading>Songs</Heading>
              <View>
                {SONGS.map((song) => (
                  <SongRow key={song.id} song={song} />
                ))}
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <RecentSearches
            items={recents}
            onItemPress={(item) => setQuery(item.title)}
            onRemove={(item) => setRecents((list) => list.filter((r) => r.id !== item.id))}
            onClearAll={() => setRecents([])}
            testID="recents"
          />
          <BrowseGrid title="Browse all" items={GENRES} onItemPress={() => {}} testID="browse" />
        </>
      )}
    </Canvas>
  );
}

/** Typing shows results; clear (×) returns to recent searches and the browse grid. */
export const Results: Story = {
  render: () => <SearchPage initialQuery="lumen" />,
};

export const RecentAndBrowse: Story = {
  render: () => <SearchPage initialQuery="" />,
};

/** Every part on its own: field states, top result kinds, tabs, the grid with children. */
export const Parts: Story = {
  render: function PartsStory() {
    const theme = useTheme();
    const [a, setA] = useState('');
    const [b, setB] = useState('night drive');
    const [tab, setTab] = useState('songs');
    return (
      <Canvas>
        <View style={{ gap: 12, maxWidth: 480 }}>
          <SearchField value={a} onChangeText={setA} onClear={() => setA('')} />
          <SearchField value={b} onChangeText={setB} onClear={() => setB('')} onBrowsePress={() => {}} browseActive />
        </View>
        <SearchResultTabs tabs={TABS} value={tab} onValueChange={setTab} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <TopResultCard title="Paper Moons" kind="album" subtitle="Lumen Vale" cover={img('paper-moons', 200)} onPress={() => {}} onPlayPress={() => {}} style={{ width: '100%', maxWidth: 420 }} />
          <TopResultCard title="Field Notes on Sound" kind="podcast" subtitle="Ines Marlow" onPress={() => {}} onPlayPress={() => {}} playing style={{ width: '100%', maxWidth: 420 }} />
          <TopResultCard title="maya.k" kind="profile" onPress={() => {}} style={{ width: '100%', maxWidth: 420 }} />
        </View>
        <BrowseGrid title="Your own tiles" minTileWidth={200}>
          {['Mood', 'Decades', 'Charts'].map((label) => (
            <View key={label} style={{ height: 100, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="headline-semibold" style={{ color: theme.colors.text }}>{label}</Text>
            </View>
          ))}
        </BrowseGrid>
      </Canvas>
    );
  },
};

export const Mobile: Story = {
  render: () => (
    <View style={{ width: '100%', maxWidth: 390 }}>
      <SearchPage initialQuery="" />
    </View>
  ),
};

export const MobileResults: Story = {
  render: () => (
    <View style={{ width: '100%', maxWidth: 390 }}>
      <SearchPage initialQuery="lumen" />
    </View>
  ),
};

export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <SearchPage initialQuery="lumen" />
      <SearchPage initialQuery="" />
    </BloomThemeProvider>
  ),
};
