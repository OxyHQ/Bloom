import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { resolveButtonRamps } from '../button/shared';
import { BloomThemeProvider } from '../theme';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MapClusterMarker } from './MapClusterMarker';
import { MapListingPreview } from './MapListingPreview';
import { MapPriceMarker } from './MapPriceMarker';
import { MapSearchAreaButton } from './MapSearchAreaButton';

const meta: Meta<typeof MapPriceMarker> = {
  title: 'Blocks/Stays/Map Marker',
  component: MapPriceMarker,
};

export default meta;

type Story = StoryObj<typeof MapPriceMarker>;

/** An inline illustration so the story needs no network. */
function photo(sky: string, hill: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="654" height="400" viewBox="0 0 654 400"><rect width="654" height="400" fill="${sky}"/><circle cx="500" cy="110" r="46" fill="#FFF4D6"/><path d="M0 260 L150 150 L300 250 L420 170 L654 290 L654 400 L0 400 Z" fill="${hill}"/><rect y="310" width="654" height="90" fill="${ground}"/><rect x="250" y="230" width="140" height="100" fill="#F5F0E8"/><path d="M235 235 L320 175 L405 235 Z" fill="#8A4B3A"/><rect x="305" y="275" width="30" height="55" fill="#6B4A36"/></svg>`;
  // Raw markup: react-native-web percent-encodes a `;utf8,` SVG data URI itself.
  return `data:image/svg+xml;utf8,${svg}`;
}

interface Listing {
  id: string;
  kind: 'price' | 'cluster';
  label: string;
  x: number;
  y: number;
  saved?: boolean;
  title?: string;
  place?: string;
  subtitle?: string;
  rating?: number | null;
  reviews?: number;
  image?: string;
}

const LISTINGS: Listing[] = [
  { id: 'a', kind: 'price', label: '€120', x: 180, y: 140, title: 'Cabin by the pines', place: 'Valdoria', subtitle: 'Entire cabin · 2 beds', rating: 4.92, reviews: 128, image: photo('#BFD9EA', '#6E8F5E', '#9DB77F') },
  { id: 'b', kind: 'price', label: '€86', x: 320, y: 220, saved: true, title: 'Studio over the harbour', place: 'Porto Lenza', subtitle: 'Entire studio · 1 bed', rating: 4.81, reviews: 54, image: photo('#F2D7C4', '#A6785E', '#C9A58A') },
  { id: 'c', kind: 'price', label: '€245', x: 520, y: 120, title: 'Stone farmhouse', place: 'Monteverra', subtitle: 'Entire home · 4 beds', rating: 4.97, reviews: 312, image: photo('#CFE3D8', '#7FA37A', '#B3C98C') },
  { id: 'd', kind: 'cluster', label: '14', x: 660, y: 260 },
  { id: 'e', kind: 'price', label: '€64', x: 140, y: 330, title: 'Garden room', place: 'Brisella', subtitle: 'Private room · 1 bed', rating: null, image: photo('#E4E8F0', '#8C9AAE', '#AFBBA0') },
  { id: 'f', kind: 'price', label: '€310', x: 430, y: 380, saved: true, title: 'Cliffside villa', place: 'Aurelle', subtitle: 'Entire villa · 5 beds', rating: 4.88, reviews: 76, image: photo('#BCD6F0', '#5E7F9E', '#D8C8A8') },
  { id: 'g', kind: 'price', label: '€98', x: 760, y: 150, title: 'Loft near the old market', place: 'Castellum', subtitle: 'Entire loft · 2 beds', rating: 4.7, reviews: 211, image: photo('#EADFCF', '#9E8C74', '#C2B49A') },
  { id: 'h', kind: 'cluster', label: '6', x: 270, y: 480 },
  { id: 'i', kind: 'price', label: '€152', x: 600, y: 480, title: 'Lake house', place: 'Serrano Lake', subtitle: 'Entire home · 3 beds', rating: 4.9, reviews: 98, image: photo('#C7E0EC', '#5F8A8B', '#8FB5A5') },
  { id: 'j', kind: 'price', label: '€75', x: 840, y: 400, title: 'Treehouse', place: 'Bosco Alto', subtitle: 'Treehouse · 1 bed', rating: 4.95, reviews: 402, image: photo('#D6E8C8', '#557A46', '#86A86B') },
  { id: 'k', kind: 'cluster', label: '99+', x: 880, y: 540 },
  { id: 'l', kind: 'price', label: '€1,040', x: 90, y: 560, title: 'Estate with a vineyard', place: 'Ravenna Hills', subtitle: 'Entire estate · 9 beds', rating: 5, reviews: 23, image: photo('#E8D8C8', '#7A6A4E', '#A89060') },
];

const MAP_WIDTH = 980;
const MAP_HEIGHT = 640;

function MockMap({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  const line = theme.isDark ? n[800] : n[300];
  return (
    <View
      style={{
        width: MAP_WIDTH,
        maxWidth: '100%',
        height: MAP_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.isDark ? n[900] : n[200],
        position: 'relative',
      }}
    >
      {[110, 250, 410, 560].map((top) => (
        <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top, height: 6, backgroundColor: line }} />
      ))}
      {[210, 470, 720].map((left) => (
        <View key={`v${left}`} style={{ position: 'absolute', top: 0, bottom: 0, left, width: 6, backgroundColor: line }} />
      ))}
      {children}
    </View>
  );
}

function MapDemo() {
  const theme = useTheme();
  const [active, setActive] = useState<string | null>('c');
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['e', 'g']));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(['b', 'f']));
  const [follow, setFollow] = useState(true);

  const open = (id: string) => {
    if (active && active !== id) setVisited((v) => new Set(v).add(active));
    setActive(id);
  };
  const current = LISTINGS.find((listing) => listing.id === active);

  return (
    <View style={{ gap: 12, padding: 16, backgroundColor: theme.colors.background }}>
      <MockMap>
        {LISTINGS.map((listing) =>
          listing.kind === 'cluster' ? (
            <View
              key={listing.id}
              style={{ position: 'absolute', left: listing.x, top: listing.y, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] }}
            >
              <MapClusterMarker
                count={listing.label}
                state={active === listing.id ? 'active' : 'default'}
                onPress={() => open(listing.id)}
                testID={`marker-${listing.id}`}
              />
            </View>
          ) : (
            <View
              key={listing.id}
              style={{
                position: 'absolute',
                left: listing.x,
                top: listing.y,
                transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
              }}
            >
              <MapPriceMarker
                price={listing.label}
                saved={saved.has(listing.id)}
                state={active === listing.id ? 'active' : visited.has(listing.id) ? 'visited' : 'default'}
                onPress={() => open(listing.id)}
                accessibilityLabel={`${listing.label} per night, ${listing.place}`}
                testID={`marker-${listing.id}`}
              />
            </View>
          ),
        )}

        <View style={{ position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' }}>
          <MapSearchAreaButton variant="toggle" checked={follow} onCheckedChange={setFollow} testID="follow" />
        </View>

        {current && current.kind === 'price' ? (
          <View style={{ position: 'absolute', left: current.x - 163, top: current.y + 24 }}>
            <MapListingPreview
              image={current.image}
              title={current.title ?? ''}
              rating={current.rating}
              reviewCount={current.reviews}
              subtitle={current.subtitle}
              price={current.label}
              priceDetail="night"
              favorite={saved.has(current.id)}
              onFavoriteChange={(next) =>
                setSaved((s) => {
                  const copy = new Set(s);
                  if (next) copy.add(current.id);
                  else copy.delete(current.id);
                  return copy;
                })
              }
              onClose={() => {
                setVisited((v) => new Set(v).add(current.id));
                setActive(null);
              }}
              onPress={() => {}}
              testID="preview"
            />
          </View>
        ) : null}
      </MockMap>
      <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
        Press a marker to open its card; the previous one becomes visited. The heart saves.
      </Text>
    </View>
  );
}

/**
 * A mock map with twelve markers: prices at rest, visited and saved, three
 * clusters, and one active marker with its preview card. The map is a grey
 * placeholder — Bloom draws the pieces, the app's map places them.
 */
export const OnAMap: Story = {
  render: () => <MapDemo />,
};

/** Every piece in every state, side by side. */
export const States: Story = {
  render: () => <StatesBody />,
};

function StatesBody() {
  {
    const theme = useTheme();
    const [checked, setChecked] = useState(false);
    const [favorite, setFavorite] = useState(true);
    const caption = (text: string) => (
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {text}
      </Text>
    );
    return (
      <View style={{ gap: 20, padding: 16, backgroundColor: theme.colors.background }}>
        {caption('Price marker — default · active · visited · saved · saved active · saved visited')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <MapPriceMarker price="€120" accessibilityLabel="€120 per night, Valdoria" />
          <MapPriceMarker price="€86" state="active" accessibilityLabel="€86 per night, Porto Lenza" />
          <MapPriceMarker price="€245" state="visited" accessibilityLabel="€245 per night, Monteverra" />
          <MapPriceMarker price="€64" saved accessibilityLabel="€64 per night, Brisella, saved" />
          <MapPriceMarker price="€310" saved state="active" accessibilityLabel="€310 per night, Aurelle, saved" />
          <MapPriceMarker price="€1,040" saved state="visited" accessibilityLabel="€1,040 per night, Ravenna Hills, saved" />
        </View>
        {caption('Cluster marker — default · active · wide')}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <MapClusterMarker count={8} />
          <MapClusterMarker count={14} state="active" />
          <MapClusterMarker count="99+" />
        </View>
        {caption('Search pill — toggle · button · disabled')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <MapSearchAreaButton variant="toggle" checked={checked} onCheckedChange={setChecked} />
          <MapSearchAreaButton onPress={() => {}} />
          <MapSearchAreaButton onPress={() => {}} disabled />
        </View>
        {caption('Preview card — vertical · compact · no photo, new')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24 }}>
          <MapListingPreview
            image={photo('#BFD9EA', '#6E8F5E', '#9DB77F')}
            title="Cabin by the pines with a very long name"
            rating={4.92}
            reviewCount={128}
            subtitle="Entire cabin · 2 beds"
            originalPrice="€150"
            price="€120"
            priceDetail="night"
            favorite={favorite}
            onFavoriteChange={setFavorite}
            onClose={() => {}}
            onPress={() => {}}
          />
          <View style={{ gap: 24 }}>
            <MapListingPreview
              layout="compact"
              image={photo('#F2D7C4', '#A6785E', '#C9A58A')}
              title="Studio over the harbour"
              rating={4.81}
              reviewCount={54}
              subtitle="Entire studio · 1 bed"
              price="€86"
              priceDetail="night"
              favorite={favorite}
              onFavoriteChange={setFavorite}
              onClose={() => {}}
              onPress={() => {}}
            />
            <MapListingPreview
              layout="compact"
              title="Garden room"
              rating={null}
              subtitle="Private room · 1 bed"
              price="€64"
              priceDetail="night"
              onClose={() => {}}
              onPress={() => {}}
            />
          </View>
        </View>
      </View>
    );
  }
}

/** The map in dark mode. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <MapDemo />
    </BloomThemeProvider>
  ),
};

/** Every state in dark mode. */
export const DarkStates: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <StatesBody />
    </BloomThemeProvider>
  ),
};
