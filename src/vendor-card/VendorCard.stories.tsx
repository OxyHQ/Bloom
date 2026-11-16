import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Shelf } from '../media-shelf';
import { alert } from '../surfaces';
import { VendorCard } from './VendorCard';
import type { VendorCardProps } from './types';

const meta: Meta = {
  id: 'blocks-food-vendorcard',
  title: 'Patterns/Food/Vendor Card',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented places. Nothing here is a real shop.
// ---------------------------------------------------------------------------

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`;

type Vendor = Omit<VendorCardProps, 'favorite' | 'onFavoriteChange'> & {
  id: string;
  saved?: boolean;
};

const VENDORS: Vendor[] = [
  {
    id: 'ember',
    name: 'Fig & Ember',
    photo: photo('fig-ember'),
    cuisines: ['Wood-fired', 'Flatbread', 'Small plates'],
    rating: 4.8,
    reviewCount: 214,
    deliveryTime: '25–35 min',
    deliveryFee: '€1.90',
    distance: '1.2 km',
    promo: '2 for 1 on flatbreads',
    saved: true,
  },
  {
    id: 'harbour',
    name: 'Harbour Noodle Room',
    photo: photo('harbour-noodle'),
    cuisines: ['Ramen', 'Japanese', 'Gyoza', 'Rice bowls', 'Vegan'],
    rating: 4.6,
    reviewCount: 1032,
    deliveryTime: '30–45 min',
    deliveryFee: 'Free',
    minimumOrder: '€14',
  },
  {
    id: 'sorrel',
    name: 'Sorrel & Salt',
    photo: photo('sorrel-salt'),
    cuisines: ['Greengrocer', 'Deli'],
    rating: null,
    deliveryTime: '15–25 min',
    deliveryFee: '€0.90',
    distance: '400 m',
  },
  {
    id: 'kestrel',
    name: 'Kestrel Bakehouse',
    photo: photo('kestrel-bake'),
    cuisines: ['Bakery', 'Coffee', 'Pastry'],
    rating: 4.9,
    reviewCount: 88,
    deliveryTime: '20–30 min',
    deliveryFee: '€2.40',
    availability: 'closed',
    opensAt: 'Opens at 07:30',
  },
];

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 1180 }}>{children}</View>;
}

function SavedVendor({
  vendor,
  density,
}: {
  vendor: Vendor;
  density?: VendorCardProps['density'];
}) {
  const { id, saved, ...rest } = vendor;
  const [favorite, setFavorite] = useState(saved ?? false);
  return (
    <View style={density === 'compact' ? undefined : { width: 300, maxWidth: '100%' }}>
      <VendorCard
        {...rest}
        density={density}
        favorite={favorite}
        onFavoriteChange={setFavorite}
        onPress={() => alert(rest.name, rest.cuisines?.join(' · '))}
        testID={`vendor-${id}`}
      />
    </View>
  );
}

/** The shelf: a row of wide cards, which is what a home screen scrolls through. */
export const Shelves: Story = {
  render: () => (
    <Page>
      <Shelf title="Near you">
        {VENDORS.map((vendor) => (
          <SavedVendor key={vendor.id} vendor={vendor} />
        ))}
      </Shelf>
    </Page>
  ),
};

/** The search result: the same data as a dense row. */
export const SearchResults: Story = {
  render: () => (
    <Page>
      <Shelf title="Results for “noodles”" layout="grid" minItemWidth={300} rows={Infinity}>
        {VENDORS.map((vendor) => (
          <SavedVendor key={vendor.id} vendor={vendor} density="compact" />
        ))}
      </Shelf>
    </Page>
  ),
};

/** Every state the card has, side by side. */
export const States: Story = {
  render: () => (
    <Page>
      <Shelf title="Open, paused, closed, unrated, loading">
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard
            name="Fig & Ember"
            photo={photo('fig-ember')}
            cuisines={['Wood-fired', 'Flatbread']}
            rating={4.8}
            reviewCount={214}
            deliveryTime="25–35 min"
            deliveryFee="€1.90"
            promo="−20% today"
            onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
            testID="vendor-open"
          />
        </View>
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard
            name="Harbour Noodle Room"
            photo={photo('harbour-noodle')}
            cuisines={['Ramen', 'Japanese']}
            rating={4.6}
            reviewCount={1032}
            deliveryTime="30–45 min"
            deliveryFee="Free"
            availability="paused"
            opensAt="Taking orders again at 19:00"
            onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
            testID="vendor-paused"
          />
        </View>
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard
            name="Kestrel Bakehouse"
            photo={photo('kestrel-bake')}
            cuisines={['Bakery', 'Coffee']}
            rating={4.9}
            reviewCount={88}
            deliveryTime="20–30 min"
            deliveryFee="€2.40"
            availability="closed"
            opensAt="Opens at 07:30"
            onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
            testID="vendor-closed"
          />
        </View>
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard
            name="Sorrel & Salt"
            photo={photo('sorrel-salt')}
            cuisines={['Greengrocer']}
            rating={null}
            deliveryTime="15–25 min"
            deliveryFee="€0.90"
            onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
            testID="vendor-new"
          />
        </View>
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard name="Loading" loading testID="vendor-loading" />
        </View>
      </Shelf>

      <Shelf
        title="Long text, many cuisines, no photo"
        layout="grid"
        minItemWidth={300}
        rows={Infinity}
      >
        <View style={{ width: 300, maxWidth: '100%' }}>
          <VendorCard
            name="The Very Long Name Of A Corner Shop That Will Not Fit"
            cuisines={['Greengrocer', 'Deli', 'Bakery', 'Coffee', 'Household', 'Flowers']}
            rating={4.2}
            reviewCount="1.2k"
            deliveryTime="45–60 min"
            deliveryFee="€3.50"
            distance="6.8 km"
            minimumOrder="€20"
            promo="Free delivery over €25"
            onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
            testID="vendor-long"
          />
        </View>
        <VendorCard
          density="compact"
          name="The Very Long Name Of A Corner Shop That Will Not Fit"
          cuisines={['Greengrocer', 'Deli', 'Bakery', 'Coffee', 'Household']}
          rating={4.2}
          reviewCount="1.2k"
          deliveryTime="45–60 min"
          deliveryFee="€3.50"
          distance="6.8 km"
          minimumOrder="€20"
          promo="Free delivery over €25"
          availability="closed"
          opensAt="Opens tomorrow at 09:00"
          onPress={() => alert('Vendor', 'Vendor details selected in this demo.')}
          testID="vendor-long-compact"
        />
        <VendorCard density="compact" loading testID="vendor-loading-compact" name="Loading" />
      </Shelf>
    </Page>
  ),
};
