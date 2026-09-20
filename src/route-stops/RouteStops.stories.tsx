import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import { Text } from '../typography';
import { RouteStops } from './RouteStops';
import type { RouteStop } from './types';

const meta: Meta = {
  title: 'Blocks/Commerce/RouteStops',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented places.
// ---------------------------------------------------------------------------

const PAIR: RouteStop[] = [
  { id: 'a', title: 'Carrer de l’Om 14', subtitle: 'Pick-up, third floor' },
  { id: 'b', title: 'Mercat de la Serra', subtitle: 'Drop-off at the loading bay' },
];

const MULTI: RouteStop[] = [
  { id: 'a', title: 'Passatge del Vidre 8', subtitle: 'Collect the sofa', state: 'reached', meta: '09:12' },
  { id: 'b', title: 'Plaça de les Bruixes 2', subtitle: 'Pick up two boxes', state: 'reached', meta: '09:41' },
  { id: 'c', title: 'Carrer del Roure 33B', subtitle: 'Leave the boxes with the caretaker', state: 'current', meta: '10:05' },
  { id: 'd', title: 'Avinguda dels Til·lers 61', subtitle: 'Final drop-off', state: 'pending' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6, paddingHorizontal: 16 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', paddingVertical: 16, gap: 32, maxWidth: 560 }}>{children}</View>;
}

function Planner() {
  const [stops, setStops] = useState<RouteStop[]>(PAIR);
  const swap = useCallback(() => setStops((s) => [s[1]!, s[0]!]), []);
  const add = useCallback(
    () => setStops((s) => [...s, { id: `s${s.length}`, title: 'Add a stop', subtitle: 'Tap to choose a place' }]),
    [],
  );
  const remove = useCallback((id: string) => setStops((s) => (s.length > 2 ? s.filter((x) => x.id !== id) : s)), []);
  return (
    <RouteStops
      stops={stops}
      onPressStop={noop}
      onSwap={swap}
      onAddStop={add}
      onRemoveStop={stops.length > 2 ? remove : undefined}
      canAddStop={stops.length < 5}
      testID="planner"
    />
  );
}

export const Planning: Story = {
  render: () => (
    <Page>
      <Section title="Two stops — swap, add">
        <Planner />
      </Section>
      <Section title="Read-only, inside a card">
        <Card>
          <CardBody style={{ paddingHorizontal: 0 }}>
            <RouteStops stops={PAIR} accessibilityLabel="Trip" />
          </CardBody>
        </Card>
      </Section>
    </Page>
  ),
};

export const InProgress: Story = {
  render: () => (
    <Page>
      <Section title="A journey under way — reached, current, pending">
        <RouteStops stops={MULTI} accessibilityLabel="Route" testID="journey" />
      </Section>
      <Section title="Compact">
        <RouteStops stops={MULTI} density="compact" accessibilityLabel="Route" />
      </Section>
    </Page>
  ),
};

export const Edges: Story = {
  render: () => (
    <Page>
      <Section title="One stop">
        <RouteStops stops={[PAIR[0]!]} onAddStop={noop} />
      </Section>
      <Section title="Five stops with removal, and a badge">
        <RouteStops
          stops={[
            ...MULTI,
            { id: 'e', title: 'Carrer del Roure 3', subtitle: 'Last one', badge: <Badge content="New" variant="subtle" color="primary" size="label-small" /> },
          ]}
          onPressStop={noop}
          onRemoveStop={noop}
          onAddStop={noop}
          canAddStop={false}
        />
      </Section>
      <Section title="Long text in a narrow column">
        <View style={{ maxWidth: 320 }}>
          <RouteStops
            stops={[
              { id: 'a', title: 'Avinguda dels Til·lers 61, escala B, planta 4', subtitle: 'Ring the second bell and wait by the gate', state: 'reached' },
              { id: 'b', title: 'Plaça de les Bruixes 2, behind the old water tower', subtitle: 'Leave it with whoever is at the desk', state: 'current' },
            ]}
            onSwap={noop}
          />
        </View>
      </Section>
    </Page>
  ),
};
