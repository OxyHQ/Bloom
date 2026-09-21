import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { ArrivalBar } from './ArrivalBar';
import { LaneGuidance } from './LaneGuidance';
import { NavigationBanner } from './NavigationBanner';
import { SpeedLimitPill } from './SpeedLimitPill';
import type { NavigationLane } from './types';

const meta: Meta<typeof NavigationBanner> = {
  title: 'Blocks/Maps/NavigationBanner',
  component: NavigationBanner,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof NavigationBanner>;

/**
 * A stand-in for the app's own map. The guidance floats over tiles Bloom does
 * not own, so these colours are literals rather than tokens — they stand for
 * content, not for a Bloom surface, and following the theme would stop the
 * demo testing what it exists to test.
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
  height = 380,
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
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ position: 'absolute', left: '6%', top: '14%', width: '38%', height: '34%', borderRadius: 20, backgroundColor: t.park }} />
      <View style={{ position: 'absolute', left: '56%', top: '52%', width: '38%', height: '34%', borderRadius: 20, backgroundColor: t.park }} />
      {[0.34, 0.72].map((top) => (
        <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top: height * top, height: 10, backgroundColor: t.road }} />
      ))}
      {[0.3, 0.7].map((left) => (
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

const LANES: NavigationLane[] = [
  { directions: ['left'] },
  { directions: ['straight'] },
  { directions: ['straight', 'slight-right'], allowed: true, preferred: 'slight-right' },
  { directions: ['right'], allowed: true },
];

export const Guiding: Story = {
  name: 'Guiding',
  render: () => (
    <Page>
      <Caption>The next maneuver, the distance to it, the street, and the one after</Caption>
      <NavigationBanner
        maneuver="right"
        distance="400 m"
        instruction="Carrer del Roure"
        thenManeuver="left"
        then="onto Passatge de l'Om"
        testID="banner"
      />
      <Caption>Without a following maneuver</Caption>
      <NavigationBanner maneuver="roundabout" distance="1.2 km" instruction="Take the third exit onto Ronda del Nord" />
      <Caption>Without a distance — the street becomes the headline</Caption>
      <NavigationBanner maneuver="arrive" instruction="Arriving at Plaça de les Bruixes" />
      <Caption>A long street name, wrapping to two lines</Caption>
      <NavigationBanner
        maneuver="slight-left"
        distance="250 m"
        instruction="Avinguda dels Til·lers de Baix i de la Font Trencada"
        thenManeuver="uturn"
      />
    </Page>
  ),
};

export const WithLanesAndLimit: Story = {
  name: 'With lanes and a limit',
  render: () => (
    <Page>
      <Caption>Lanes and a speed sign, inside the same pane</Caption>
      <NavigationBanner
        maneuver="slight-right"
        distance="600 m"
        instruction="Ronda del Nord"
        thenManeuver="right"
        then="onto Carrer de la Séquia"
        testID="full"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <LaneGuidance lanes={LANES} testID="lanes" />
          <SpeedLimitPill limit="80" unit="km/h" testID="limit" />
        </View>
      </NavigationBanner>
      <Caption>Lane rows on their own — nothing allowed, one allowed, four allowed</Caption>
      <View style={{ gap: 12 }}>
        <LaneGuidance lanes={[{ directions: ['left'] }, { directions: ['straight'] }, { directions: ['right'] }]} />
        <LaneGuidance lanes={LANES} />
        <LaneGuidance
          lanes={[
            { directions: ['sharp-left'], allowed: true },
            { directions: ['left'], allowed: true },
            { directions: ['straight'], allowed: true },
            { directions: ['uturn'], allowed: true },
          ]}
        />
      </View>
      <Caption>The limit, within and over</Caption>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <SpeedLimitPill limit="50" unit="km/h" />
        <SpeedLimitPill limit="50" unit="km/h" exceeded testID="over" />
        <SpeedLimitPill limit="30" unit="mph" />
        <SpeedLimitPill limit="120" />
      </View>
    </Page>
  ),
};

export const OffRoute: Story = {
  name: 'Off route and rerouting',
  render: () => (
    <Page>
      <Caption>Off the line — the maneuver stops being claimed at all</Caption>
      <NavigationBanner state="off-route" maneuver="right" instruction="Head back to Carrer del Roure" testID="off" />
      <Caption>Working on a new one</Caption>
      <NavigationBanner state="rerouting" maneuver="right" instruction="Keep going, a new route is on its way" testID="rerouting" />
    </Page>
  ),
};

export const Arrival: Story = {
  name: 'Arrival bar',
  render: () => (
    <Page>
      <Caption>Three readings of equal weight, and the way out</Caption>
      <ArrivalBar arrival="18:42" remainingTime="24 min" remainingDistance="8.2 km" onEnd={() => {}} testID="arrival" />
      <Caption>Without an ending action</Caption>
      <ArrivalBar arrival="09:05" remainingTime="1 h 12 min" remainingDistance="104 km" />
    </Page>
  ),
};

export const OnAMap: Story = {
  name: 'On a map',
  render: () => (
    <Page>
      <Caption>Pale</Caption>
      <MockMap tone="pale">
        <NavigationBanner maneuver="right" distance="400 m" instruction="Carrer del Roure" thenManeuver="left" then="onto Passatge de l'Om">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <LaneGuidance lanes={LANES} />
            <SpeedLimitPill limit="80" unit="km/h" />
          </View>
        </NavigationBanner>
        <ArrivalBar arrival="18:42" remainingTime="24 min" remainingDistance="8.2 km" onEnd={() => {}} />
      </MockMap>
      <Caption>Night</Caption>
      <MockMap tone="night">
        <NavigationBanner maneuver="slight-left" distance="1.4 km" instruction="Ronda del Nord" />
        <ArrivalBar arrival="23:18" remainingTime="52 min" remainingDistance="61 km" onEnd={() => {}} />
      </MockMap>
      <Caption>Satellite, off route</Caption>
      <MockMap tone="photo">
        <NavigationBanner state="off-route" maneuver="right" instruction="Head back to Carrer del Roure" />
        <ArrivalBar arrival="—" remainingTime="—" remainingDistance="—" onEnd={() => {}} />
      </MockMap>
    </Page>
  ),
};
