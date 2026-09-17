import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FilterChips } from './FilterChips';
import { Shelf } from './Shelf';
import { ShelfSkeleton } from './ShelfSkeleton';

const meta: Meta = {
  title: 'Blocks/Music/Shelf',
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

// ---------------------------------------------------------------------------
//  Placeholder tiles — simple image + text, standing in for the media cards.
// ---------------------------------------------------------------------------

function Tile({
  seed,
  title,
  meta: subtitle,
  round,
  width = 160,
  fill,
}: {
  fill?: boolean;
  seed: string;
  title: string;
  meta?: string;
  round?: boolean;
  width?: number;
}) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="link"
      accessibilityLabel={title}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ width: fill ? '100%' : width, gap: 8 }}
    >
      <Image
        source={{ uri: cover(seed) }}
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: round ? 9999 : 12,
        }}
      />
      <View style={{ gap: 2, alignItems: round ? 'center' : 'flex-start' }}>
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ color: theme.colors.text, textDecorationLine: hovered ? 'underline' : 'none' }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="body-2-regular"
            numberOfLines={2}
            style={{ color: theme.colors.textSecondary, textAlign: round ? 'center' : 'left' }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function CompactTile({ seed, title }: { seed: string; title: string }) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="link"
      accessibilityLabel={title}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 56,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: hovered ? theme.colors.border : theme.colors.backgroundSecondary,
      }}
    >
      <Image source={{ uri: cover(seed) }} style={{ width: 56, height: 56 }} />
      <Text
        variant="body-semibold"
        numberOfLines={1}
        style={{ color: theme.colors.text, flexShrink: 1, paddingRight: 8 }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: '100%',
        maxWidth: width,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 16,
        paddingRight: 16,
        gap: 32,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

const noop = () => {};

function HomeFeed({ width }: { width?: number }) {
  const [filter, setFilter] = useState<string | undefined>('all');
  const narrow = (width ?? 1280) < 600;
  const tile = narrow ? 128 : 160;
  return (
    <Page width={width}>
      <FilterChips options={FILTERS} value={filter} onValueChange={setFilter} />

      <Shelf title="Recently played" layout="grid" minItemWidth={narrow ? 150 : 240} rows={2} gap={8}>
        {RECENT.map((title, index) => (
          <CompactTile key={title} seed={`recent-${index}`} title={title} />
        ))}
      </Shelf>

      <Shelf
        title="Maya"
        eyebrow="Made for"
        eyebrowAvatar="https://picsum.photos/seed/maya-face/96/96"
        onTitlePress={noop}
        onShowAll={noop}
      >
        {MIXES.map((mix) => (
          <Tile key={mix.id} seed={mix.id} title={mix.title} meta={mix.meta} width={tile} />
        ))}
      </Shelf>

      <Shelf title="Your favourite artists" onShowAll={noop}>
        {ARTISTS.map((artist) => (
          <Tile key={artist.id} seed={artist.id} title={artist.title} meta="Artist" round width={tile} />
        ))}
      </Shelf>

      <Shelf
        title="Jump back in"
        subtitle="Albums and shows you left halfway through"
        layout="grid"
        minItemWidth={tile}
        onShowAll={noop}
      >
        {MIXES.slice().reverse().map((mix) => (
          <Tile key={mix.id} seed={`${mix.id}-b`} title={mix.title} meta={mix.meta} fill />
        ))}
      </Shelf>

      <ShelfSkeleton count={8} itemWidth={tile} />
    </Page>
  );
}

/** A home feed: filter chips, a two-row grid, row shelves with the header arrows, and a loading shelf. 1280 wide. */
export const HomeFeedWide: Story = {
  render: () => <HomeFeed width={1280} />,
};

/** The same feed at 390. On a touch screen (`hover: none`) the header arrows are hidden and rows scroll by swipe. */
export const HomeFeedNarrow: Story = {
  render: () => <HomeFeed width={390} />,
};

/** Dark mode at 1280 and 390. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <DarkCanvas />
    </BloomThemeProvider>
  ),
};

function DarkCanvas() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, gap: 24 }}>
      <HomeFeed width={1280} />
      <HomeFeed width={390} />
    </View>
  );
}

/** Loading placeholders: row, round, grid with eyebrow. */
export const Skeletons: Story = {
  render: () => (
    <Page width={1280}>
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
      <Page width={640}>
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
