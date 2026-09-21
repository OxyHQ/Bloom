import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody } from '../card';
import type { RouteStop } from '../route-stops';
import { Text } from '../typography';
import { DirectionsSteps } from './DirectionsSteps';
import { DirectionsSummary } from './DirectionsSummary';
import { TransitLineBadge } from './TransitLineBadge';
import type { DirectionsLeg, DirectionsMode, DirectionsRoute } from './types';

const meta: Meta = {
  title: 'Blocks/Maps/Directions',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented streets and invented lines
// ---------------------------------------------------------------------------

const STOPS: RouteStop[] = [
  { id: 'a', title: 'Carrer de l’Om 14', subtitle: 'Home', state: 'reached' },
  { id: 'b', title: 'Forner de la Plaça', subtitle: 'Plaça de les Bruixes 4' },
];

const DRIVING: DirectionsRoute[] = [
  {
    id: 'ronda',
    duration: '24 min',
    distance: '8.2 km',
    arrival: 'Arrives 18:42',
    via: 'Via Ronda del Nord',
    traffic: 'light',
    note: 'Fastest route',
  },
  {
    id: 'centre',
    duration: '31 min',
    distance: '6.9 km',
    arrival: 'Arrives 18:49',
    via: 'Via the old town',
    traffic: 'heavy',
  },
  {
    id: 'coast',
    duration: '38 min',
    distance: '11.4 km',
    arrival: 'Arrives 18:56',
    via: 'Via the coast road',
    traffic: 'moderate',
  },
];

const L4 = { name: 'L4', color: '#B4543F', headsign: 'towards Pla del Bosc' };
const N12 = { name: 'N12', color: '#E9C46A', headsign: 'towards the port' };
const S1 = { name: 'S1', color: '#2F5D8C', headsign: 'towards Vall de l’Om' };

const TRANSIT: DirectionsRoute[] = [
  {
    id: 'l4',
    duration: '29 min',
    distance: '7.4 km',
    arrival: 'Arrives 18:47',
    via: 'One change at Pla del Bosc',
    note: 'Fewest changes',
    lines: [L4, N12],
  },
  {
    id: 's1',
    duration: '34 min',
    arrival: 'Arrives 18:52',
    via: 'Direct, every 20 minutes',
    lines: [S1],
  },
];

const DRIVE_LEGS: DirectionsLeg[] = [
  {
    id: 'drive',
    title: 'Drive to Plaça de les Bruixes',
    meta: '24 min · 8.2 km',
    mode: 'drive',
    steps: [
      { id: 'd1', maneuver: 'depart', instruction: 'Head north on Carrer de l’Om', detail: 'Towards the water tower', distance: '250 m' },
      { id: 'd2', maneuver: 'right', instruction: 'Turn right onto Passatge del Vidre', distance: '400 m' },
      { id: 'd3', maneuver: 'merge', instruction: 'Merge onto the Ronda del Nord', detail: 'Keep in the right-hand lane', distance: '5.6 km' },
      { id: 'd4', maneuver: 'roundabout', instruction: 'At the roundabout, take the second exit', detail: 'Signposted Vall de l’Om', distance: '1.1 km' },
      { id: 'd5', maneuver: 'slight-left', instruction: 'Bear left onto Avinguda dels Til·lers', distance: '600 m' },
      { id: 'd6', maneuver: 'left', instruction: 'Turn left onto Carrer del Roure', distance: '180 m' },
      { id: 'd7', maneuver: 'arrive', instruction: 'Arrive at Forner de la Plaça', detail: 'On your right' },
    ],
  },
];

const TRANSIT_LEGS: DirectionsLeg[] = [
  {
    id: 'walk-1',
    title: 'Walk to Carrer de l’Om',
    meta: '4 min · 300 m',
    mode: 'walk',
    steps: [
      { id: 'w1', maneuver: 'depart', instruction: 'Head north on Carrer de l’Om', distance: '300 m' },
      { id: 'w2', maneuver: 'board', instruction: 'Enter the station', detail: 'Platform 2, step-free' },
    ],
  },
  {
    id: 'l4',
    title: 'Ride to Pla del Bosc',
    meta: '14 min · 6 stops',
    mode: 'transit',
    line: L4,
    steps: [
      { id: 'l4-1', maneuver: 'board', instruction: 'Board towards Pla del Bosc', detail: '6 stops', line: L4 },
      { id: 'l4-2', maneuver: 'alight', instruction: 'Get off at Pla del Bosc' },
    ],
  },
  {
    id: 'n12',
    title: 'Change to the N12',
    meta: '8 min · 3 stops',
    mode: 'transit',
    line: N12,
    steps: [
      { id: 'n12-1', maneuver: 'transfer', instruction: 'Change platform', detail: 'Two minutes, follow the yellow signs' },
      { id: 'n12-2', maneuver: 'board', instruction: 'Board towards the port', detail: '3 stops', line: N12 },
      { id: 'n12-3', maneuver: 'alight', instruction: 'Get off at Plaça de les Bruixes' },
    ],
  },
  {
    id: 'walk-2',
    title: 'Walk to Forner de la Plaça',
    meta: '3 min · 200 m',
    mode: 'walk',
    steps: [
      { id: 'w3', maneuver: 'straight', instruction: 'Continue along Plaça de les Bruixes', distance: '200 m' },
      { id: 'w4', maneuver: 'arrive', instruction: 'Arrive at Forner de la Plaça' },
    ],
  },
];

const MODES: DirectionsMode[] = ['drive', 'transit', 'walk', 'cycle'];

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

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 560, padding: 16, gap: 32 }}>{children}</View>;
}

// ---------------------------------------------------------------------------

function Planner({ routes, initialMode }: { routes: DirectionsRoute[]; initialMode: DirectionsMode }) {
  const [mode, setMode] = useState<DirectionsMode>(initialMode);
  const [selected, setSelected] = useState(routes[0]!.id);
  const [stops, setStops] = useState(STOPS);
  return (
    <DirectionsSummary
      routes={routes}
      selectedRouteId={selected}
      onSelectRoute={setSelected}
      stops={stops}
      onPressStop={noop}
      onSwapStops={() => setStops((s) => [s[1]!, s[0]!])}
      modes={MODES}
      mode={mode}
      onModeChange={setMode}
      onStart={noop}
      testID="planner"
    />
  );
}

export const Driving: Story = {
  render: () => (
    <Page>
      <Section title="The chosen route, the mode switcher and the alternates">
        <Planner routes={DRIVING} initialMode="drive" />
      </Section>
      <Section title="The turn list">
        <DirectionsSteps legs={DRIVE_LEGS} currentStepId="d3" testID="drive-steps" />
      </Section>
    </Page>
  ),
};

export const Transit: Story = {
  render: () => (
    <Page>
      <Section title="A transit route — line badges in the operators' own colours">
        <Planner routes={TRANSIT} initialMode="transit" />
      </Section>
      <Section title="Grouped by leg: walk, ride, change, walk">
        <DirectionsSteps legs={TRANSIT_LEGS} currentStepId="l4-1" testID="transit-steps" />
      </Section>
      <Section title="Line badges on their own, coloured and plain">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <TransitLineBadge line={L4} size="label-medium" />
          <TransitLineBadge line={N12} size="label-medium" />
          <TransitLineBadge line={S1} size="label-medium" />
          <TransitLineBadge line={{ name: 'R2', headsign: 'towards the hills' }} size="label-medium" />
        </View>
      </Section>
    </Page>
  ),
};

export const Edges: Story = {
  render: () => (
    <Page>
      <Section title="One route, no stops, no switcher">
        <DirectionsSummary routes={[DRIVING[0]!]} testID="lone" />
      </Section>
      <Section title="Compact steps, read-only, inside a card">
        <Card>
          <CardBody style={{ paddingHorizontal: 0 }}>
            <DirectionsSteps legs={DRIVE_LEGS} density="compact" />
          </CardBody>
        </Card>
      </Section>
      <Section title="No leg title, a very long instruction, pressable">
        <DirectionsSteps
          legs={[
            {
              id: 'long',
              steps: [
                {
                  id: 's1',
                  maneuver: 'sharp-right',
                  instruction:
                    'Take the sharp right onto the unnamed service road that runs behind the old water tower and follow it past the allotments',
                  detail: 'Unsurfaced for the first two hundred metres',
                  distance: '1.2 km',
                },
                { id: 's2', maneuver: 'uturn', instruction: 'Make a U-turn at the end of the road', distance: '40 m' },
                { id: 's3', maneuver: 'sharp-left', instruction: 'Sharp left onto the track', distance: '300 m' },
                { id: 's4', maneuver: 'slight-right', instruction: 'Bear right at the fork', distance: '900 m' },
              ],
            },
          ]}
          onPressStep={noop}
          currentStepId="s2"
        />
      </Section>
    </Page>
  ),
};
