import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiBookmarkLine, RiFlagLine, RiHeartLine, RiStarLine, RiWalkLine } from '../icons/remix';
import { Text } from '../typography';
import { PlaceList } from './PlaceList';
import { PlaceListCard } from './PlaceListCard';
import type { PlaceListPlace } from './types';

const meta: Meta = {
  title: 'Blocks/Maps/PlaceList',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

/** An inline illustration so the story needs no network. */
function photo(sky: string, wall: string, awning: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="654" height="400" viewBox="0 0 654 400"><rect width="654" height="400" fill="${sky}"/><rect y="120" width="654" height="280" fill="${wall}"/><rect x="60" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="250" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="440" y="180" width="120" height="220" fill="#7A5A44"/><path d="M40 170 L614 170 L614 210 L40 210 Z" fill="${awning}"/><circle cx="520" cy="300" r="6" fill="#F6F1E7"/></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

const BAKERY = photo('#DCE8F2', '#C9A27E', '#B4543F');
const CAFE = photo('#E7E1F2', '#8E9BAE', '#3E5C76');
const PARK = photo('#D9EBF5', '#8FB08B', '#4E7A4A');
const MUSEUM = photo('#F2E6DC', '#A8724F', '#6E3B2A');

const PEOPLE = [
  { id: '1', displayName: 'Ana Ferrer', username: 'ana' },
  { id: '2', displayName: 'Marc Oliu', username: 'marc' },
  { id: '3', displayName: 'Júlia Roure', username: 'julia' },
];

const SAVED: PlaceListPlace[] = [
  {
    id: 'forner',
    note: 'Sourdough is out at 07:30 and gone by ten.',
    place: {
      name: 'Forner de la Plaça',
      category: 'Bakery · €€',
      photo: BAKERY,
      rating: 4.6,
      reviewCount: 318,
      openState: 'open',
      hours: 'Open until 20:00',
      facts: [
        { icon: RiWalkLine, label: '6 min', accessibilityLabel: '6 minutes on foot' },
        { label: '450 m' },
      ],
    },
  },
  {
    id: 'roure',
    note: 'Terrace is in the sun until about two.',
    place: {
      name: 'Cafè del Roure',
      category: 'Coffee shop · €',
      photo: CAFE,
      rating: 4.4,
      reviewCount: 96,
      openState: 'closing-soon',
      hours: 'Closes at 19:00',
      facts: [{ label: '1.1 km' }],
    },
  },
  {
    id: 'bosc',
    place: {
      name: 'Parc del Bosc Vell',
      category: 'Park',
      photo: PARK,
      rating: 4.8,
      reviewCount: 1204,
      openState: 'open',
      hours: 'Open 24 hours',
      facts: [{ label: '2.4 km' }],
    },
  },
];

function Frame({ children, width = 390 }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ width: '100%', maxWidth: width, gap: 16 }}>{children}</View>
    </View>
  );
}

/** The lists themselves: photos, count, who they are shared with, visibility. */
export const Cards: Story = {
  render: () => (
    <Frame>
      <PlaceListCard
        name="Want to go"
        count={12}
        photos={[BAKERY, CAFE, PARK, MUSEUM]}
        icon={RiFlagLine}
        visibility="shared"
        collaborators={PEOPLE}
        onPress={noop}
        testID="want"
      />
      <PlaceListCard
        name="Favourites"
        count={41}
        photos={[PARK, MUSEUM]}
        icon={RiHeartLine}
        color="#C2456B"
        visibility="private"
        onPress={noop}
        testID="favourites"
      />
      <PlaceListCard
        name="Coffee, ranked"
        count={1}
        photos={[CAFE]}
        icon={RiStarLine}
        visibility="public"
        onPress={noop}
        testID="coffee"
      />
      <PlaceListCard
        name="Weekend in the hills"
        count={0}
        icon={RiBookmarkLine}
        color="#4E7A4A"
        visibility="private"
        onPress={noop}
        empty={
          <Text variant="body-2-regular" style={{ color: '#FFFFFF' }}>
            Nothing saved yet
          </Text>
        }
        testID="hills"
      />
    </Frame>
  ),
};

/** A list open: the places inside it, each with a note, reorderable. */
function Editable() {
  const [places, setPlaces] = useState<PlaceListPlace[]>(SAVED);
  return (
    <Frame>
      <PlaceListCard
        name="Want to go"
        count={places.length}
        photos={[BAKERY, CAFE, PARK]}
        icon={RiFlagLine}
        visibility="shared"
        collaborators={PEOPLE}
        onPress={noop}
      />
      <PlaceList
        places={places}
        onReorder={setPlaces}
        onRemove={(id) => setPlaces((current) => current.filter((entry) => entry.id !== id))}
        testID="saved"
      />
    </Frame>
  );
}

export const Inside: Story = { render: () => <Editable /> };

/** Read-only: no controls at all, which is what a shared list looks like to a guest. */
export const ReadOnly: Story = {
  render: () => (
    <Frame>
      <PlaceList places={SAVED} testID="readonly" />
    </Frame>
  ),
};

/** Nothing in it yet. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <PlaceList
        places={[]}
        empty={
          <Text variant="body-regular">Nothing saved here yet. Search for a place and save it.</Text>
        }
        testID="empty"
      />
    </Frame>
  ),
};

/** Wide: the cards in a two-column grid, the way a saved-lists screen shows them. */
export const Grid: Story = {
  render: () => (
    <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {[
        { name: 'Want to go', count: 12, photos: [BAKERY, CAFE, PARK, MUSEUM], icon: RiFlagLine },
        { name: 'Favourites', count: 41, photos: [PARK, MUSEUM], icon: RiHeartLine },
        { name: 'Coffee, ranked', count: 7, photos: [CAFE, BAKERY], icon: RiStarLine },
        { name: 'Museums', count: 3, photos: [MUSEUM], icon: RiBookmarkLine },
      ].map((list) => (
        <View key={list.name} style={{ width: 320 }}>
          <PlaceListCard {...list} visibility="private" onPress={noop} />
        </View>
      ))}
    </View>
  ),
};
