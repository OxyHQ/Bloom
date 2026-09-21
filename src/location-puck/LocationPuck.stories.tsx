import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { LocationPuck } from './LocationPuck';

const meta: Meta<typeof LocationPuck> = {
  title: 'Blocks/Maps/LocationPuck',
  component: LocationPuck,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof LocationPuck>;

/**
 * A stand-in for the app's own map. The puck is drawn over content Bloom does
 * not own, and this story does not own one either — so the colours here are
 * literals on purpose: they stand for tiles, not for a Bloom surface, and they
 * must NOT follow the theme or the demo stops testing the thing it exists for.
 *
 * `pale` is a daylight street map, `night` a dark one, `photo` a satellite
 * tile: the three backdrops the puck, its halo and its cone have to survive.
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
  height = 300,
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ position: 'absolute', left: '6%', top: '10%', width: '36%', height: '32%', borderRadius: 20, backgroundColor: t.park }} />
      <View style={{ position: 'absolute', left: '58%', top: '56%', width: '36%', height: '32%', borderRadius: 20, backgroundColor: t.park }} />
      {[0.18, 0.5, 0.82].map((top) => (
        <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top: height * top, height: 10, backgroundColor: t.road }} />
      ))}
      {[0.24, 0.66].map((left) => (
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
  return <View style={{ width: '100%', maxWidth: 900, padding: 16, gap: 28 }}>{children}</View>;
}

/** A tile-coloured cell, so a puck can be judged against a backdrop it will meet. */
function Cell({ tone, label, children }: { tone: MapTone; label: string; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <View style={{ gap: 6, alignItems: 'center' }}>
      <View
        style={{
          width: 176,
          height: 176,
          borderRadius: 12,
          backgroundColor: t.base,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, top: 88, height: 10, backgroundColor: t.road }} />
        {children}
      </View>
      <Caption>{label}</Caption>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{children}</View>;
}

export const States: Story = {
  name: 'States',
  render: () => (
    <Page>
      <Caption>Locating · located · stale, over a pale map</Caption>
      <Row>
        <Cell tone="pale" label="locating">
          <LocationPuck state="locating" accuracyRadius={54} heading={40} testID="p-locating" />
        </Cell>
        <Cell tone="pale" label="located">
          <LocationPuck state="located" accuracyRadius={54} heading={40} testID="p-located" />
        </Cell>
        <Cell tone="pale" label="stale">
          <LocationPuck state="stale" accuracyRadius={54} heading={40} testID="p-stale" />
        </Cell>
      </Row>
      <Caption>The same three over a night map</Caption>
      <Row>
        <Cell tone="night" label="locating">
          <LocationPuck state="locating" accuracyRadius={54} heading={40} />
        </Cell>
        <Cell tone="night" label="located">
          <LocationPuck state="located" accuracyRadius={54} heading={40} />
        </Cell>
        <Cell tone="night" label="stale">
          <LocationPuck state="stale" accuracyRadius={54} heading={40} />
        </Cell>
      </Row>
      <Caption>And over a satellite tile</Caption>
      <Row>
        <Cell tone="photo" label="located">
          <LocationPuck state="located" accuracyRadius={54} heading={40} />
        </Cell>
        <Cell tone="photo" label="no halo">
          <LocationPuck state="located" heading={40} />
        </Cell>
      </Row>
    </Page>
  ),
};

export const Heading: Story = {
  name: 'Heading',
  render: () => (
    <Page>
      <Caption>The cone is the device's own uncertainty, drawn — 14°, 30°, 55°</Caption>
      <Row>
        <Cell tone="pale" label="sure">
          <LocationPuck heading={0} headingAccuracy={14} testID="cone-sure" />
        </Cell>
        <Cell tone="pale" label="less sure">
          <LocationPuck heading={0} headingAccuracy={30} testID="cone-mid" />
        </Cell>
        <Cell tone="pale" label="unsure">
          <LocationPuck heading={0} headingAccuracy={55} testID="cone-wide" />
        </Cell>
        <Cell tone="pale" label="no heading">
          <LocationPuck headingUnknown testID="cone-none" />
        </Cell>
      </Row>
      <Caption>Turning: 0°, 90°, 200°, 315°</Caption>
      <Row>
        {[0, 90, 200, 315].map((heading) => (
          <Cell key={heading} tone="night" label={`${heading}°`}>
            <LocationPuck heading={heading} headingAccuracy={20} accuracyRadius={40} />
          </Cell>
        ))}
      </Row>
    </Page>
  ),
};

export const Modes: Story = {
  name: 'Modes',
  render: () => (
    <Page>
      <Caption>Following turns the cone · compass leaves it up · navigating is a chevron</Caption>
      <Row>
        <Cell tone="pale" label="following, 120°">
          <LocationPuck mode="following" heading={120} headingAccuracy={22} accuracyRadius={44} />
        </Cell>
        <Cell tone="pale" label="compass, 120°">
          <LocationPuck mode="compass" heading={120} headingAccuracy={22} accuracyRadius={44} />
        </Cell>
        <Cell tone="pale" label="navigating, 120°">
          <LocationPuck mode="navigating" heading={120} testID="p-navigating" />
        </Cell>
        <Cell tone="night" label="navigating, 300°">
          <LocationPuck mode="navigating" heading={300} />
        </Cell>
      </Row>
    </Page>
  ),
};

export const OnAMap: Story = {
  name: 'On a map',
  render: () => (
    <Page>
      <Caption>Pale</Caption>
      <MockMap tone="pale">
        <LocationPuck heading={64} headingAccuracy={26} accuracyRadius={70} />
      </MockMap>
      <Caption>Night</Caption>
      <MockMap tone="night">
        <LocationPuck state="locating" heading={210} headingAccuracy={40} accuracyRadius={86} />
      </MockMap>
      <Caption>Satellite, navigating</Caption>
      <MockMap tone="photo">
        <LocationPuck mode="navigating" heading={20} />
      </MockMap>
    </Page>
  ),
};

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: () => (
    <Page>
      <Caption>`locating` with the pulse forced off — the dot and the halo stand still</Caption>
      <Row>
        <Cell tone="pale" label="reducedMotion">
          <LocationPuck state="locating" reducedMotion accuracyRadius={54} heading={40} />
        </Cell>
        <Cell tone="night" label="reducedMotion">
          <LocationPuck state="locating" reducedMotion accuracyRadius={54} heading={40} />
        </Cell>
      </Row>
    </Page>
  ),
};
