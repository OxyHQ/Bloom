import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiBuilding2Line, RiHotelBedLine, RiRulerLine, RiDropLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { ListingCard } from './ListingCard';
import { ListingCardGrid } from './ListingCardGrid';
import type { ListingCardProps, ListingFact } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Listing Card',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const photos = (seed: string, count: number) =>
  Array.from({ length: count }, (_, index) => `https://picsum.photos/seed/${seed}-${index}/800/760`);

function facts(beds: number | null, baths: number, area: number, floor?: number): ListingFact[] {
  const list: ListingFact[] = [];
  if (beds != null) list.push({ icon: RiHotelBedLine, label: String(beds), accessibilityLabel: `${beds} ${beds === 1 ? 'bedroom' : 'bedrooms'}` });
  list.push({ icon: RiDropLine, label: String(baths), accessibilityLabel: `${baths} ${baths === 1 ? 'bathroom' : 'bathrooms'}` });
  list.push({ icon: RiRulerLine, label: `${area} m²` });
  if (floor != null) list.push({ icon: RiBuilding2Line, label: `Floor ${floor}` });
  return list;
}

type Home = Omit<ListingCardProps, 'favorite' | 'onFavoriteChange'> & { id: string; saved?: boolean };

const HOMES: Home[] = [
  {
    id: 'rent',
    photos: photos('verlo-flat', 5),
    title: 'Bright flat near Plaza Orel',
    address: 'Calle Senra, Old Quarter',
    offerings: ['long_term_rent'],
    priceLines: [{ price: '€950', unit: '/ month' }],
    facts: facts(3, 2, 110, 4),
    rating: 4.6,
    reviewCount: 18,
  },
  {
    id: 'sale',
    photos: photos('talmar-house', 6),
    title: 'Townhouse with a patio',
    address: 'Talmar Hill',
    approximateLocation: true,
    offerings: ['sale'],
    priceLines: [{ price: '€240,000', secondary: '€3,200/m²', originalPrice: '€255,000' }],
    facts: facts(4, 2, 75),
    saved: true,
  },
  {
    id: 'stay',
    photos: photos('brova-harbour', 7),
    title: 'Brova Harbour, Kestrel Isles',
    subtitle: 'Sea view',
    dates: '20 – 25 Oct',
    offerings: ['short_term_rent'],
    rating: 4.81,
    reviewCount: 64,
    priceLines: [{ price: '€168', unit: 'night' }],
    total: '€840 total',
    badge: 'Guest favourite',
  },
  {
    id: 'swap',
    photos: photos('weyr-cottage', 4),
    title: 'Garden cottage for a summer swap',
    address: 'Weyr Valley, Hollin',
    approximateLocation: true,
    offerings: ['exchange'],
    dates: 'July – August',
    facts: facts(2, 1, 64),
    rating: null,
  },
  {
    id: 'multi',
    photos: photos('ondel-loft', 5),
    title: 'Loft above the Ondel market',
    address: 'Plaça Ferran, Ondel',
    offerings: ['long_term_rent', 'sale'],
    priceLines: [
      { price: '€1,250', unit: '/ month' },
      { price: '€310,000', secondary: '€4,130/m²' },
    ],
    facts: facts(2, 2, 75, 6),
  },
  {
    id: 'reserved',
    photos: photos('saltmere-dunes', 3),
    title: 'Dune house at Saltmere',
    address: 'Corvall coast',
    offerings: ['long_term_rent'],
    status: 'reserved',
    priceLines: [{ price: '€1,100', unit: '/ month' }],
    facts: facts(3, 1, 92),
  },
  {
    id: 'sold',
    photos: photos('pellin-bay', 4),
    title: 'Pellin Bay apartment',
    address: 'Marrow Coast',
    offerings: ['sale'],
    status: 'sold',
    priceLines: [{ price: '€189,000', secondary: '€2,700/m²' }],
    facts: facts(2, 1, 70, 2),
  },
  {
    id: 'room',
    photos: photos('quarry-room', 2),
    title: 'Room in a shared house, a long title that truncates',
    subtitle: 'Private room · 4 housemates',
    address: 'Quarry Lane, Eastwold',
    offerings: ['long_term_rent', 'short_term_rent', 'exchange'],
    priceLines: [{ price: '€420', unit: '/ month' }, { price: '€38', unit: 'night' }],
    facts: [
      { icon: RiHotelBedLine, label: 'Double bed' },
      { icon: RiDropLine, label: 'Shared bath' },
      { icon: RiRulerLine, label: '14 m²' },
      { icon: RiBuilding2Line, label: 'Floor 1 of 3' },
    ],
  },
];

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View style={{ alignSelf: 'stretch', minHeight: '100%', backgroundColor: theme.colors.background }}>
      <View style={{ width: '100%', maxWidth: width, alignSelf: 'center' }}>{children}</View>
    </View>
  );
}

function useSaved() {
  const [saved, setSaved] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(HOMES.map((home) => [home.id, home.saved ?? false])),
  );
  return {
    saved,
    toggle: (id: string) => (next: boolean) => setSaved((current) => ({ ...current, [id]: next })),
  };
}

function ResultsGrid({ width, loading = false }: { width?: number; loading?: boolean }) {
  const { saved, toggle } = useSaved();
  return (
    <Page width={width}>
      <ListingCardGrid>
        {HOMES.map(({ id, saved: _saved, ...home }) => (
          <ListingCard
            key={id}
            {...home}
            loading={loading}
            href={`#home-${id}`}
            favorite={saved[id]}
            onFavoriteChange={toggle(id)}
            testID={`home-${id}`}
          />
        ))}
      </ListingCardGrid>
    </Page>
  );
}

function CompactRows({ width }: { width?: number }) {
  const { saved, toggle } = useSaved();
  return (
    <Page width={width}>
      <View style={{ gap: 16 }}>
        {HOMES.map(({ id, saved: _saved, badge: _badge, ...home }) => (
          <ListingCard
            key={id}
            {...home}
            density="compact"
            href={`#home-${id}`}
            favorite={saved[id]}
            onFavoriteChange={toggle(id)}
            testID={`row-${id}`}
          />
        ))}
        <ListingCard photos={[]} title="" density="compact" loading />
      </View>
    </Page>
  );
}

/**
 * A mixed results grid: a rental, a sale with its price per m², a vacation
 * rental, a swap, a home offered two ways, reserved and sold homes, and a room
 * with three offerings and more facts than fit.
 */
export const Results: Story = {
  render: () => <ResultsGrid width={1280} />,
};

/** The results in a phone-width frame (view it at 375) — one column. */
export const ResultsNarrow: Story = {
  render: () => <ResultsGrid />,
};

/** The results, dark. */
export const ResultsDark: Story = {
  globals: { theme: 'dark' },
  render: () => <ResultsGrid width={1280} />,
};

/** The compact density: dense list rows, filling the frame (view it at 375), with a skeleton row. */
export const Compact: Story = {
  render: () => <CompactRows />,
};

/** Compact rows in a 640 column, dark. */
export const CompactDark: Story = {
  globals: { theme: 'dark' },
  render: () => <CompactRows width={640} />,
};
