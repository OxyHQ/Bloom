import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { resolveButtonRamps } from '../button/shared';
import { RiBuilding2Line, RiHotelBedLine, RiRulerLine, RiDropLine } from '../icons/remix';
import type { ListingFact, ListingPriceLine, Offering } from '../listing-card/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MapAreaCircle } from './MapAreaCircle';
import { MapClusterMarker } from './MapClusterMarker';
import { MapListingPreview } from './MapListingPreview';
import { MapPriceMarker } from './MapPriceMarker';

const meta: Meta = {
  title: 'Blocks/Housing/Map',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** An inline illustration so the story needs no network. */
function photo(sky: string, wall: string, roof: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="654" height="400" viewBox="0 0 654 400"><rect width="654" height="400" fill="${sky}"/><rect x="170" y="150" width="320" height="250" fill="${wall}"/><path d="M150 160 L330 60 L510 160 Z" fill="${roof}"/><rect x="215" y="200" width="60" height="60" fill="#DDE8F0"/><rect x="385" y="200" width="60" height="60" fill="#DDE8F0"/><rect x="300" y="290" width="60" height="110" fill="#6B4A36"/><rect y="370" width="654" height="30" fill="#8FA877"/></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

interface Home {
  id: string;
  x: number;
  y: number;
  /** The short marker price. */
  short: string;
  title: string;
  place: string;
  offerings: Offering[];
  priceLines: ListingPriceLine[];
  facts: ListingFact[];
  image: string;
  /** Private address: an approximate-area circle instead of a pin-exact marker. */
  areaRadius?: number;
}

const bed = (n: number): ListingFact => ({ icon: RiHotelBedLine, label: String(n), accessibilityLabel: `${n} ${n === 1 ? 'bedroom' : 'bedrooms'}` });
const bath = (n: number): ListingFact => ({ icon: RiDropLine, label: String(n), accessibilityLabel: `${n} ${n === 1 ? 'bathroom' : 'bathrooms'}` });
const area = (n: number): ListingFact => ({ icon: RiRulerLine, label: `${n} m²` });
const floor = (n: number): ListingFact => ({ icon: RiBuilding2Line, label: `Floor ${n}` });

const HOMES: Home[] = [
  { id: 'a', x: 170, y: 150, short: '€950/mo', title: 'Bright flat near Plaza Orel', place: 'Old Quarter', offerings: ['long_term_rent'], priceLines: [{ price: '€950', unit: '/ month' }], facts: [bed(3), bath(2), area(110), floor(4)], image: photo('#BFD9EA', '#F1E6D6', '#9E5B45') },
  { id: 'b', x: 420, y: 250, short: '€240K', title: 'Townhouse with a patio', place: 'Talmar Hill', offerings: ['sale'], priceLines: [{ price: '€240,000', secondary: '€3,200/m²' }], facts: [bed(4), bath(2), area(75)], image: photo('#F2D7C4', '#E9DCC8', '#7A4E3A'), areaRadius: 70 },
  { id: 'c', x: 650, y: 140, short: '€168', title: 'Harbour studio', place: 'Brova', offerings: ['short_term_rent'], priceLines: [{ price: '€168', unit: 'night' }], facts: [bed(1), bath(1), area(38)], image: photo('#CFE3D8', '#F4F0E6', '#5E7F9E') },
  { id: 'd', x: 770, y: 400, short: '€1.2M', title: 'Villa above the bay', place: 'Aurelle', offerings: ['sale', 'long_term_rent'], priceLines: [{ price: '€4,800', unit: '/ month' }, { price: '€1,200,000', secondary: '€6,000/m²' }], facts: [bed(5), bath(4), area(200)], image: photo('#BCD6F0', '#FAF6EE', '#A0522D') },
  { id: 'e', x: 260, y: 420, short: 'Swap', title: 'Garden cottage', place: 'Weyr Valley', offerings: ['exchange'], priceLines: [], facts: [bed(2), bath(1), area(64)], image: photo('#D6E8C8', '#EFE6D2', '#557A46') },
  { id: 'f', x: 560, y: 520, short: '€720/mo', title: 'Room in a shared flat', place: 'Eastwold', offerings: ['long_term_rent'], priceLines: [{ price: '€720', unit: '/ month' }], facts: [bed(1), bath(1), area(16)], image: photo('#E4E8F0', '#F2EEE8', '#8C9AAE') },
];

const MAP_HEIGHT = 620;

function MockMap({ children, width }: { children: React.ReactNode; width: number }) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  const line = theme.isDark ? n[800] : n[300];
  return (
    <View
      style={{
        width,
        maxWidth: '100%',
        height: MAP_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.isDark ? n[900] : n[200],
        position: 'relative',
      }}
    >
      {[100, 260, 380, 560].map((top) => (
        <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top, height: 6, backgroundColor: line }} />
      ))}
      {[120, 340, 600, 860].map((left) => (
        <View key={`v${left}`} style={{ position: 'absolute', top: 0, bottom: 0, left, width: 6, backgroundColor: line }} />
      ))}
      {children}
    </View>
  );
}

const centred = (x: number, y: number) =>
  ({ position: 'absolute', left: x, top: y, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] }) as const;

/** Beside the marker when the map has room (clear of an area circle), else along the bottom edge. */
function previewPosition(home: Home, scale: number, width: number, previewWidth: number) {
  const x = home.x * scale;
  const clearance = (home.areaRadius ?? 0) * scale + 16;
  const top = Math.max(16, Math.min(home.y - 160, MAP_HEIGHT - 340));
  if (x + clearance + previewWidth + 16 <= width) return { position: 'absolute', left: x + clearance, top } as const;
  if (x - clearance - previewWidth >= 16) return { position: 'absolute', left: x - clearance - previewWidth, top } as const;
  // A narrow map: a sheet-like card along the bottom edge.
  return { position: 'absolute', left: (width - previewWidth) / 2, bottom: 12 } as const;
}

function HousingMapDemo({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  // The frame's padding (24) and the page's (16) on both sides.
  const width = Math.min(980, useWindowDimensions().width - 80);
  const [active, setActive] = useState<string | null>('b');
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['e']));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(['d']));
  const current = HOMES.find((home) => home.id === active);
  const scale = Math.min(1, width / 980);
  const previewWidth = Math.min(327, width - 24);

  const open = (id: string) => {
    if (active && active !== id) setVisited((v) => new Set(v).add(active));
    setActive(id);
  };

  return (
    <View style={{ gap: 12, padding: 16, backgroundColor: theme.colors.background, minHeight: '100%' }}>
      <MockMap width={width}>
        {HOMES.filter((home) => home.areaRadius).map((home) => (
          <View key={`area-${home.id}`} style={centred(home.x * scale, home.y)}>
            <MapAreaCircle
              radius={(home.areaRadius ?? 0) * scale}
              accessibilityLabel={`Approximate location of ${home.title}`}
              testID={`area-${home.id}`}
            />
          </View>
        ))}
        {HOMES.map((home) => (
          <View key={home.id} style={centred(home.x * scale, home.y)}>
            <MapPriceMarker
              price={home.short}
              size={compact ? 'compact' : 'default'}
              saved={saved.has(home.id)}
              state={active === home.id ? 'active' : visited.has(home.id) ? 'visited' : 'default'}
              onPress={() => open(home.id)}
              accessibilityLabel={`${home.short}, ${home.title}, ${home.place}`}
              testID={`marker-${home.id}`}
            />
          </View>
        ))}
        <View style={centred(880 * scale, 240)}>
          <MapClusterMarker count={23} accessibilityLabel="23 homes" />
        </View>
        <View style={centred(120 * scale + 40, 560)}>
          <MapAreaCircle radius={48 * scale} label="~300 m" testID="area-labelled" />
        </View>

        {current ? (
          <View
            style={previewPosition(current, scale, width, previewWidth)}
          >
            <MapListingPreview
              width={previewWidth}
              image={current.image}
              title={current.title}
              subtitle={current.place}
              offerings={current.offerings}
              priceLines={current.priceLines}
              facts={current.facts}
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
        Short prices on the markers; the townhouse's address is private, so an approximate-area circle sits under
        its marker.
      </Text>
    </View>
  );
}

/** Rent, sale, vacation rental and swap markers with short prices, an approximate area and the open preview. */
export const HousingMap: Story = {
  render: () => <HousingMapDemo />,
};

/** The same map, dark. */
export const HousingMapDark: Story = {
  globals: { theme: 'dark' },
  render: () => <HousingMapDemo />,
};

/** Compact markers; the map fits the window (view it at 375). */
export const HousingMapNarrow: Story = {
  render: () => <HousingMapDemo compact />,
};

function PiecesBody() {
  const theme = useTheme();
  const caption = (text: string) => (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {text}
    </Text>
  );
  return (
    <View style={{ gap: 20, padding: 16, backgroundColor: theme.colors.background }}>
      {caption('Price marker sizes — default · compact, at rest · active · visited · saved')}
      {(['default', 'compact'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <MapPriceMarker size={size} price="€950/mo" accessibilityLabel="€950 a month" />
          <MapPriceMarker size={size} price="€240K" state="active" accessibilityLabel="€240,000" />
          <MapPriceMarker size={size} price="€1.2M" state="visited" accessibilityLabel="€1,200,000" />
          <MapPriceMarker size={size} price="€168" saved accessibilityLabel="€168 a night, saved" />
        </View>
      ))}
      {caption('Approximate area — radius 40 · 64 with a label')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <MapAreaCircle radius={40} />
        <MapAreaCircle radius={64} label="Approximate area" />
      </View>
      {caption('Preview — vertical · compact')}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24 }}>
        <MapListingPreview
          image={HOMES[3]?.image}
          title="Villa above the bay"
          subtitle="Aurelle"
          offerings={['sale', 'long_term_rent']}
          priceLines={HOMES[3]?.priceLines}
          facts={HOMES[3]?.facts}
          onClose={() => {}}
          onPress={() => {}}
        />
        <MapListingPreview
          layout="compact"
          image={HOMES[0]?.image}
          title="Bright flat near Plaza Orel"
          offerings={['long_term_rent']}
          priceLines={HOMES[0]?.priceLines}
          facts={HOMES[0]?.facts}
          onClose={() => {}}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

/** Each housing piece on its own. */
export const Pieces: Story = {
  render: () => <PiecesBody />,
};

/** The pieces, dark. */
export const PiecesDark: Story = {
  globals: { theme: 'dark' },
  render: () => <PiecesBody />,
};
