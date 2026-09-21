import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { MapAttribution } from './MapAttribution';
import { MapScaleBar } from './MapScaleBar';
import type { MapScale } from './types';

const meta: Meta<typeof MapAttribution> = {
  title: 'Blocks/Maps/MapAttribution',
  component: MapAttribution,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof MapAttribution>;

/**
 * Stand-ins for the app's own tiles. The small print has to stay legible over
 * all of them, so these colours are literals rather than tokens: they stand for
 * content Bloom does not own, and following the theme would make the demo agree
 * with itself instead of testing anything.
 */
type MapTone = 'pale' | 'night' | 'photo';

const TONES: Record<MapTone, { base: string; road: string; park: string }> = {
  pale: { base: '#e9eaee', road: '#ffffff', park: '#d3e3d0' },
  night: { base: '#12161c', road: '#242b35', park: '#1b2a22' },
  photo: { base: '#4a5136', road: '#6d6a4c', park: '#2f3a28' },
};

function MockMap({
  children,
  tone = 'pale',
  height = 180,
}: {
  children: React.ReactNode;
  tone?: MapTone;
  height?: number;
}) {
  const t = TONES[tone];
  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: t.base,
        padding: 12,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ position: 'absolute', left: '4%', top: '8%', width: '44%', height: '46%', borderRadius: 20, backgroundColor: t.park }} />
      {[0.4, 0.78].map((top) => (
        <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top: height * top, height: 10, backgroundColor: t.road }} />
      ))}
      {[0.55].map((left) => (
        <View key={`v${left}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${left * 100}%`, width: 10, backgroundColor: t.road }} />
      ))}
      {children}
    </View>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
      {children}
    </Text>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 760, padding: 16, gap: 28 }}>{children}</View>;
}

const METRIC: MapScale[] = [{ width: 88, label: '500 m' }];
const BOTH: MapScale[] = [
  { width: 88, label: '500 m' },
  { width: 108, label: '2000 ft' },
];

export const Everything: Story = {
  name: 'Credit, scale and date',
  render: () => (
    <Page>
      <Caption>The whole strip</Caption>
      <MapAttribution
        credit="Map data © Open Map Project contributors"
        scales={BOTH}
        updated="Updated 12 March"
        onPressCredit={() => {}}
        testID="attr"
      />
      <Caption>Credit only — the smallest a provider's licence allows</Caption>
      <MapAttribution credit="© Open Map Project" testID="credit-only" />
      <Caption>Credit and date, no scale</Caption>
      <MapAttribution credit="Imagery © Northwind Aerial" updated="Updated 3 days ago" />
      <Caption>A long credit wraps rather than truncating — it is a licence requirement</Caption>
      <View style={{ maxWidth: 260 }}>
        <MapAttribution
          credit="Map data © Open Map Project contributors, imagery © Northwind Aerial Survey, roads © Institut Cartogràfic"
          updated="Updated 12 March"
        />
      </View>
      <Caption>Inline — already inside a surface the app painted</Caption>
      <MapAttribution variant="inline" credit="Map data © Open Map Project contributors" scales={METRIC} updated="Updated 12 March" />
    </Page>
  ),
};

export const Scale: Story = {
  name: 'Scale bar',
  render: () => (
    <Page>
      <Caption>Metric alone, and metric over imperial</Caption>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
        <MapScaleBar scales={METRIC} testID="scale-metric" />
        <MapScaleBar scales={BOTH} testID="scale-both" />
      </View>
      <Caption>At four zoom levels — the width is the app's, the words are the app's</Caption>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <MapScaleBar scales={[{ width: 48, label: '20 m' }]} />
        <MapScaleBar scales={[{ width: 72, label: '100 m' }]} />
        <MapScaleBar scales={[{ width: 96, label: '1 km' }]} />
        <MapScaleBar scales={[{ width: 132, label: '20 km' }]} />
      </View>
      <Caption>Inline</Caption>
      <MapScaleBar variant="inline" scales={BOTH} />
    </Page>
  ),
};

export const OnAMap: Story = {
  name: 'On a map',
  render: () => (
    <Page>
      <Caption>Pale</Caption>
      <MockMap tone="pale">
        <MapAttribution credit="Map data © Open Map Project contributors" scales={BOTH} updated="Updated 12 March" onPressCredit={() => {}} />
      </MockMap>
      <Caption>Night</Caption>
      <MockMap tone="night">
        <MapAttribution credit="Map data © Open Map Project contributors" scales={BOTH} updated="Updated 12 March" onPressCredit={() => {}} />
      </MockMap>
      <Caption>Satellite</Caption>
      <MockMap tone="photo">
        <MapAttribution credit="Imagery © Northwind Aerial Survey" scales={METRIC} updated="Updated 3 days ago" />
      </MockMap>
    </Page>
  ),
};
