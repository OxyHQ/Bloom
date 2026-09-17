import React, { useState } from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FavoriteButton } from './FavoriteButton';
import { ListingCard } from './ListingCard';
import { ListingCardGrid } from './ListingCardGrid';
import { WishlistCard } from './WishlistCard';
import type { ListingCardProps } from './types';

const meta: Meta = {
  title: 'Blocks/Stays/Listing Card',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/800/760`;
const photos = (seed: string, count: number) =>
  Array.from({ length: count }, (_, index) => photo(`${seed}-${index}`));

type Stay = Omit<ListingCardProps, 'favorite' | 'onFavoriteChange'> & { id: string; saved?: boolean };

const STAYS: Stay[] = [
  {
    id: 'alvora',
    photos: photos('alvora', 7),
    title: 'Alvora, Coast of Merin',
    subtitle: 'Hosted by Ilse',
    dates: '12 – 17 Oct',
    rating: 4.92,
    reviewCount: 128,
    price: '€124',
    priceUnit: 'night',
    badge: 'Guest favourite',
  },
  {
    id: 'tessaly',
    photos: photos('tessaly', 4),
    title: 'Tessaly Hills, Varnholm',
    subtitle: 'Cabin by the lake',
    dates: '3 – 8 Nov',
    rating: null,
    price: '€88',
    priceUnit: 'night',
  },
  {
    id: 'brova',
    photos: photos('brova', 9),
    title: 'Brova Harbour, Kestrel Isles',
    subtitle: 'Sea view',
    dates: '20 – 25 Oct',
    rating: 4.81,
    reviewCount: 64,
    originalPrice: '€210',
    price: '€168',
    priceUnit: 'night',
    total: '€840 total',
    saved: true,
  },
  {
    id: 'ondel',
    photos: photos('ondel', 3),
    title: 'Ondel Old Town, Rasmark',
    subtitle: 'Loft near the square',
    dates: '1 – 4 Dec',
    rating: 4.7,
    reviewCount: 312,
    price: '€96',
    priceUnit: 'night',
  },
  {
    id: 'saltmere',
    photos: photos('saltmere', 5),
    title: 'Saltmere Dunes, Corvall',
    subtitle: 'Hosted by Pim',
    dates: '14 – 19 Jan',
    rating: 5,
    reviewCount: 18,
    total: '€1,020 total',
    badge: 'Guest favourite',
    saved: true,
  },
  {
    id: 'weyr',
    photos: photos('weyr', 6),
    title: 'Weyr Valley, Hollin',
    subtitle: 'Farmhouse with a garden and a very long description that truncates',
    dates: '9 – 12 Feb',
    rating: 4.88,
    reviewCount: '1.2k',
    price: '€142',
    priceUnit: 'night',
  },
  {
    id: 'pellin',
    photos: photos('pellin', 2),
    title: 'Pellin Bay, Marrow Coast',
    dates: '22 – 27 Mar',
    rating: 4.65,
    reviewCount: 41,
    originalPrice: '€130',
    price: '€99',
    priceUnit: 'night',
  },
  {
    id: 'quarry',
    photos: photos('quarry', 8),
    title: 'Quarry Lane, Eastwold',
    subtitle: 'Studio above the bakery',
    dates: '5 – 9 Apr',
    rating: 4.95,
    reviewCount: 207,
    price: '€71',
    priceUnit: 'night',
  },
];

function useSaved() {
  const [saved, setSaved] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STAYS.map((stay) => [stay.id, stay.saved ?? false])),
  );
  return {
    saved,
    toggle: (id: string) => (next: boolean) => setSaved((current) => ({ ...current, [id]: next })),
  };
}

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View style={{ minHeight: '100%', backgroundColor: theme.colors.background, padding: 24 }}>
      <View style={{ width: width ?? '100%', maxWidth: '100%', alignSelf: 'center' }}>{children}</View>
    </View>
  );
}

function StayGrid({ width, loading = false }: { width?: number; loading?: boolean }) {
  const { saved, toggle } = useSaved();
  return (
    <Page width={width}>
      <ListingCardGrid testID="grid">
        {STAYS.map(({ id, saved: _saved, ...stay }) => (
          <ListingCard
            key={id}
            {...stay}
            testID={`stay-${id}`}
            loading={loading}
            href={`#stay-${id}`}
            favorite={saved[id]}
            onFavoriteChange={toggle(id)}
          />
        ))}
      </ListingCardGrid>
    </Page>
  );
}

/** Eight stays in the responsive grid: a badge, an unrated stay, discounts, a total, saved hearts. */
export const Grid: Story = {
  render: () => <StayGrid />,
};

/** The grid in a 375 frame — one column. */
export const Narrow: Story = {
  render: () => <StayGrid width={375} />,
};

/** The grid at 1440 — four columns. */
export const Wide: Story = {
  render: () => <StayGrid width={1440} />,
};

/** The grid, forced dark. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => <StayGrid />,
};

/** Skeletons in the same geometry, vertical and horizontal. */
export const Loading: Story = {
  render: () => (
    <View style={{ gap: 40 }}>
      <StayGrid loading />
      <Page width={420}>
        <View style={{ gap: 20 }}>
          <ListingCard photos={[]} title="" layout="horizontal" loading testID="skeleton-horizontal" />
          <ListingCard photos={[]} title="" layout="horizontal" loading />
        </View>
      </Page>
    </View>
  ),
};

/** The horizontal layout for a list or a map sheet, at 375 and 560. */
export const Horizontal: Story = {
  render: function HorizontalStory() {
    const { saved, toggle } = useSaved();
    return (
      <View style={{ gap: 32 }}>
        {[375, 560].map((width) => (
          <Page key={width} width={width}>
            <View style={{ gap: 20 }}>
              {STAYS.slice(0, 3).map(({ id, saved: _saved, ...stay }) => (
                <ListingCard
                  key={id}
                  {...stay}
                  layout="horizontal"
                  testID={`h${width}-${id}`}
                  onPress={() => undefined}
                  favorite={saved[id]}
                  onFavoriteChange={toggle(id)}
                />
              ))}
            </View>
          </Page>
        ))}
      </View>
    );
  },
};

/** The heart on its own over light and dark imagery. */
export const Favorite: Story = {
  render: function FavoriteStory() {
    const [a, setA] = useState(false);
    const [b, setB] = useState(true);
    const theme = useTheme();
    return (
      <Page>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[
            { seed: 'snowfield', value: a, set: setA, id: 'fav-a' },
            { seed: 'nightsky', value: b, set: setB, id: 'fav-b' },
          ].map(({ seed, value, set, id }) => (
            <View
              key={id}
              style={{ width: 120, height: 120, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
            >
              <Image source={{ uri: photo(seed) }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <FavoriteButton favorite={value} onFavoriteChange={set} testID={id} />
            </View>
          ))}
        </View>
        <Text variant="caption-1-regular" style={{ marginTop: 12, color: theme.colors.textSecondary }}>
          Press to toggle.
        </Text>
      </Page>
    );
  },
};

/** Saved collections: one, two, three and four covers. */
export const Wishlists: Story = {
  render: () => (
    <Page>
      <ListingCardGrid columns={4} columnGap={20} rowGap={32}>
        <WishlistCard name="Coast weekends" description="12 saved" photos={photos('coast', 4)} onPress={() => undefined} testID="wish-4" />
        <WishlistCard name="Cabins" description="3 saved" photos={photos('cabin', 3)} onPress={() => undefined} testID="wish-3" />
        <WishlistCard name="City breaks" description="2 saved" photos={photos('city', 2)} href="#city" testID="wish-2" />
        <WishlistCard name="Someday" description="1 saved" photos={photos('someday', 1)} onPress={() => undefined} testID="wish-1" />
      </ListingCardGrid>
    </Page>
  ),
};
