import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomImage } from '../image';
import { Text } from '../typography';
import { FilterChips } from './FilterChips';
import { Shelf } from './Shelf';
import { ShelfSkeleton } from './ShelfSkeleton';

const meta: Meta = {
  id: 'blocks-music-shelf',
  title: 'Patterns/Music/Shelf',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists, albums and shows.
// ---------------------------------------------------------------------------

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/320/320`;

const MIXES = [
  { id: 'm1', title: 'Night Drive Mix', meta: 'Halden Lights, Mara Sol and more' },
  { id: 'm2', title: 'Slow Tide Mix', meta: 'Oren Vale, The Paper Kites Club' },
  { id: 'm3', title: 'Focus Flow', meta: 'Quiet keys for deep work' },
  { id: 'm4', title: 'Sunday Brunch', meta: 'Lina Dusk, Velvet Harbor' },
  { id: 'm5', title: 'Afterglow', meta: 'Soft synths and late walks' },
  { id: 'm6', title: 'Cloud Walk', meta: 'Mira Kest, North Hollow' },
  { id: 'm7', title: 'Rainy Window', meta: 'Piano and rain, all evening' },
  { id: 'm8', title: 'Road Songs', meta: 'Tessa Rowe, Blue Marrow' },
  { id: 'm9', title: 'Morning Light', meta: 'Acoustic, warm, unhurried' },
];

const ARTISTS = [
  { id: 'a1', title: 'Mara Sol' },
  { id: 'a2', title: 'Halden Lights' },
  { id: 'a3', title: 'Oren Vale' },
  { id: 'a4', title: 'Velvet Harbor' },
  { id: 'a5', title: 'Lina Dusk' },
  { id: 'a6', title: 'North Hollow' },
  { id: 'a7', title: 'Tessa Rowe' },
];

const RECENT = [
  'Liked Songs',
  'Night Drive',
  'Glass Rooms',
  'The Long Weekend',
  'Harbor Sessions',
  'Deep Focus',
  'Evening Radio',
  'Low Tide',
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'audiobooks', label: 'Audiobooks' },
];

/** A demo tile: the shelf lays out whatever an app puts in it. */
function DemoTile({
  artwork,
  title,
  subtitle,
  round = false,
  row = false,
}: {
  artwork: string;
  title: string;
  subtitle?: string;
  round?: boolean;
  row?: boolean;
}) {
  const size = row ? 48 : 160;
  return (
    <View
      style={
        row ? { flexDirection: 'row', alignItems: 'center', gap: 12 } : { width: size, gap: 8 }
      }
    >
      <BloomImage
        source={{ uri: artwork }}
        style={{ width: size, height: size, borderRadius: round ? size / 2 : 8 }}
      />
      <View style={{ flexShrink: 1 }}>
        <Text numberOfLines={1}>{title}</Text>
        {subtitle ? <Text numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** The canvas provides the viewport and theme; this only spaces the shelf content. */
function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', padding: 16, gap: 32 }}>{children}</View>;
}

function HomeFeedDemo() {
  const [filter, setFilter] = useState<string | undefined>('all');
  return (
    <Page>
      <FilterChips
        options={[
          { value: 'all', label: 'All' },
          { value: 'albums', label: 'Albums' },
          { value: 'artists', label: 'Artists' },
        ]}
        value={filter}
        onValueChange={setFilter}
      />

      {filter === 'all' && (
        <Shelf title="Recently played" layout="grid" minItemWidth={240} rows={2} gap={8}>
          {RECENT.map((title, index) => (
            <DemoTile key={title} artwork={cover(`recent-${index}`)} title={title} row />
          ))}
        </Shelf>
      )}

      {filter !== 'artists' && (
        <Shelf
          title="Maya"
          eyebrow="Made for"
          eyebrowAvatar="https://picsum.photos/seed/maya-face/96/96"
        >
          {MIXES.map((mix) => (
            <DemoTile key={mix.id} artwork={cover(mix.id)} title={mix.title} subtitle={mix.meta} />
          ))}
        </Shelf>
      )}

      {filter !== 'albums' && (
        <Shelf title="Your favourite artists">
          {ARTISTS.map((artist) => (
            <DemoTile key={artist.id} artwork={cover(artist.id)} title={artist.title} round />
          ))}
        </Shelf>
      )}

      {filter === 'all' && (
        <Shelf
          title="Jump back in"
          subtitle="Albums you left halfway through"
          layout="grid"
          minItemWidth={240}
          rows={2}
        >
          {MIXES.slice()
            .reverse()
            .map((mix) => (
              <DemoTile key={mix.id} artwork={cover(`${mix.id}-b`)} title={mix.title} row />
            ))}
        </Shelf>
      )}
    </Page>
  );
}

/** One responsive feed: Shelf owns column counts and scrolling; cards own artwork and interactions. */
export const HomeFeed: Story = { render: () => <HomeFeedDemo /> };

/** Loading placeholders: row, round, grid with eyebrow. */
export const Skeletons: Story = {
  render: () => (
    <Page>
      <ShelfSkeleton />
      <ShelfSkeleton round eyebrow />
      <ShelfSkeleton layout="grid" count={12} />
    </Page>
  ),
};

/** Filter chips: plain, deselectable. */
export const Chips: Story = {
  render: function ChipsStory() {
    const [a, setA] = useState<string | undefined>('all');
    const [b, setB] = useState<string | undefined>(undefined);
    return (
      <Page>
        <FilterChips options={FILTERS} value={a} onValueChange={setA} />
        <FilterChips
          options={FILTERS.slice(1)}
          value={b}
          onValueChange={setB}
          allowDeselect
          accessibilityLabel="Content type"
        />
      </Page>
    );
  },
};

/** Whole columns size themselves from the actual track, with a trailing peek. */
export const Paged: Story = {
  render: function PagedStory() {
    return (
      <Page>
        <Shelf title="Recently played" layout="paged" rows={2} minItemWidth={240} peek={32} gap={8}>
          {RECENT.map((title, index) => (
            <DemoTile key={title} artwork={cover(`paged-${index}`)} title={title} row />
          ))}
        </Shelf>
      </Page>
    );
  },
};
