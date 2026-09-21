import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import {
  RiBookmarkFill,
  RiBookmarkLine,
  RiPhoneLine,
  RiRouteLine,
  RiShare2Line,
  RiTimeLine,
  RiWalkLine,
} from '../icons/remix';
import { PlaceReviewSummary } from '../place-reviews';
import { Text } from '../typography';
import { PlaceCard } from './PlaceCard';
import type { PlaceAction, PlaceCardProps } from './types';

const meta: Meta<typeof PlaceCard> = {
  title: 'Blocks/Maps/PlaceCard',
  component: PlaceCard,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof PlaceCard>;

const noop = () => undefined;

/** An inline illustration so the story needs no network. */
function photo(sky: string, wall: string, awning: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="654" height="400" viewBox="0 0 654 400"><rect width="654" height="400" fill="${sky}"/><rect y="120" width="654" height="280" fill="${wall}"/><rect x="60" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="250" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="440" y="180" width="120" height="220" fill="#7A5A44"/><path d="M40 170 L614 170 L614 210 L40 210 Z" fill="${awning}"/><circle cx="520" cy="300" r="6" fill="#F6F1E7"/></svg>`;
  // Raw markup: react-native-web percent-encodes a `;utf8,` SVG data URI itself.
  return `data:image/svg+xml;utf8,${svg}`;
}

const BAKERY = photo('#DCE8F2', '#C9A27E', '#B4543F');
const CAFE = photo('#E7E1F2', '#8E9BAE', '#3E5C76');
const PARK = photo('#D9EBF5', '#8FB08B', '#4E7A4A');

// ---------------------------------------------------------------------------
//  Demo data — invented places
// ---------------------------------------------------------------------------

function actions(saved: boolean, onSave: () => void): PlaceAction[] {
  return [
    { id: 'directions', label: 'Directions', icon: RiRouteLine, onPress: noop },
    { id: 'call', label: 'Call', icon: RiPhoneLine, onPress: noop },
    {
      id: 'save',
      label: saved ? 'Saved' : 'Save',
      icon: saved ? RiBookmarkFill : RiBookmarkLine,
      onPress: onSave,
    },
    { id: 'share', label: 'Share', icon: RiShare2Line, onPress: noop },
  ];
}

const RESULTS: PlaceCardProps[] = [
  {
    name: 'Forner de la Plaça',
    category: 'Bakery · €€',
    photo: BAKERY,
    rating: 4.6,
    reviewCount: 318,
    openState: 'open',
    hours: 'Open until 20:00',
    address: 'Plaça de les Bruixes 4',
    facts: [
      { icon: RiWalkLine, label: '6 min', accessibilityLabel: '6 minutes on foot' },
      { label: '450 m' },
    ],
  },
  {
    name: 'Cafè del Roure',
    category: 'Coffee shop · €',
    photo: CAFE,
    rating: 4.2,
    reviewCount: 91,
    openState: 'closing-soon',
    hours: 'Closes at 18:30',
    address: 'Carrer del Roure 33B',
    badge: 'Popular',
    facts: [
      { icon: RiWalkLine, label: '11 min', accessibilityLabel: '11 minutes on foot' },
      { label: '900 m' },
    ],
  },
  {
    name: 'Parc de la Serra',
    category: 'Park',
    photo: PARK,
    rating: null,
    openState: 'closed',
    hours: 'Opens 07:00 tomorrow',
    address: 'Avinguda dels Til·lers 61',
    facts: [{ icon: RiTimeLine, label: '18 min' }, { label: '1.4 km' }],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Page({ children, width = 560 }: { children: React.ReactNode; width?: number }) {
  return <View style={{ width: '100%', maxWidth: width, padding: 16, gap: 32 }}>{children}</View>;
}

// ---------------------------------------------------------------------------

function ResultsList() {
  const [saved, setSaved] = useState<Set<string>>(() => new Set(['Cafè del Roure']));
  const toggle = (name: string) =>
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return (
    <View style={{ gap: 20 }}>
      {RESULTS.map((place) => (
        <PlaceCard
          key={place.name}
          {...place}
          onPress={noop}
          favorite={saved.has(place.name)}
          onFavoriteChange={() => toggle(place.name)}
          saveLabel={`Save ${place.name}`}
          removeLabel={`Remove ${place.name}`}
          testID={`result-${place.name}`}
        />
      ))}
    </View>
  );
}

export const Results: Story = {
  render: () => (
    <Page>
      <Section title="Results over the map">
        <ResultsList />
      </Section>
      <Section title="With an action row">
        <PlaceCard
          {...RESULTS[0]!}
          onPress={noop}
          actions={[
            { id: 'directions', label: 'Directions', icon: RiRouteLine, onPress: noop },
            { id: 'call', label: 'Call', icon: RiPhoneLine, onPress: noop },
          ]}
        />
      </Section>
      <Section title="Loading">
        <PlaceCard name="" loading testID="row-skeleton" />
      </Section>
    </Page>
  ),
};

function DetailSheet() {
  const [saved, setSaved] = useState(false);
  return (
    <PlaceCard
      density="detail"
      name="Forner de la Plaça"
      category="Bakery · €€"
      photo={BAKERY}
      rating={4.6}
      reviewCount={318}
      openState="open"
      hours="Open until 20:00"
      address="Plaça de les Bruixes 4, Vall de l’Om"
      figureLabel="Walk from here"
      figure="6 min"
      figureDetail="450 m"
      stats={[
        { value: '€€', label: 'Price' },
        { value: '318', label: 'Reviews' },
        { value: '07:00', label: 'Opens' },
      ]}
      actions={actions(saved, () => setSaved((v) => !v))}
      favorite={saved}
      onFavoriteChange={setSaved}
      testID="detail"
    />
  );
}

export const Detail: Story = {
  render: () => (
    <Page width={640}>
      <Section title="The sheet that opens when a result is picked">
        <DetailSheet />
      </Section>
      <Section title="…and the reviews under it, drawn by `place-reviews`">
        <PlaceReviewSummary
          rating={4.6}
          title="What people say"
          reviewCount={318}
          recommendRate={0.93}
        />
      </Section>
      <Section title="Loading">
        <PlaceCard name="" density="detail" loading testID="detail-skeleton" />
      </Section>
    </Page>
  ),
};

export const Edges: Story = {
  render: () => (
    <Page>
      <Section title="No photo, no rating, closed">
        <PlaceCard
          name="Llibreria del Pont"
          category="Bookshop"
          openState="closed"
          hours="Opens 10:00 on Tuesday"
          address="Passatge del Vidre 8"
          onPress={noop}
        />
      </Section>
      <Section title="A very long name and category in a narrow column">
        <View style={{ maxWidth: 320 }}>
          <PlaceCard
            name="Forner de la Plaça de les Bruixes i del Roure Vell"
            category="Artisan bakery, coffee roastery and breakfast counter · €€€"
            photo={BAKERY}
            rating={4.93}
            reviewCount={1284}
            openState="opening-soon"
            hours="Opens at 07:00, in 25 minutes"
            address="Plaça de les Bruixes 4, Vall de l’Om, behind the old water tower"
            facts={[{ icon: RiWalkLine, label: '6 min' }, { label: '450 m' }, { label: 'Step-free' }]}
            onPress={noop}
          />
        </View>
      </Section>
      <Section title="Inside a card, with a node badge">
        <Card>
          <CardBody>
            <PlaceCard
              {...RESULTS[1]!}
              badge={<Badge content="Verified" variant="subtle" color="info" size="label-small" />}
              onPress={noop}
            />
          </CardBody>
        </Card>
      </Section>
      <Section title="Detail with no figure and no tiles">
        <PlaceCard
          density="detail"
          name="Parc de la Serra"
          category="Park"
          photo={PARK}
          openState="closed"
          hours="Opens 07:00 tomorrow"
          address="Avinguda dels Til·lers 61"
          actions={[{ id: 'directions', label: 'Directions', icon: RiRouteLine, onPress: noop }]}
        />
      </Section>
    </Page>
  ),
};
