import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { GlyphButton } from '../button';
import { Card, CardBody } from '../card';
import { RiMore2Line } from '../icons';
import { Text } from '../typography';
import { AddressList } from './AddressList';
import { AddressRow } from './AddressRow';
import type { AddressListSection } from './types';

const meta: Meta = {
  title: 'Blocks/Commerce/Address',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented places. Street names and buildings are made up.
// ---------------------------------------------------------------------------

const SECTIONS: AddressListSection[] = [
  {
    id: 'saved',
    title: 'Saved',
    entries: [
      {
        id: 'home',
        kind: 'saved',
        title: 'Home',
        subtitle: 'Carrer de l’Om 14, 3r 2a',
        badge: <Badge content="Default" variant="subtle" color="primary" size="label-small" />,
      },
      { id: 'work', kind: 'saved', title: 'Studio', subtitle: 'Passatge del Vidre 8, unit B' },
    ],
  },
  {
    id: 'recent',
    title: 'Recent',
    entries: [
      { id: 'r1', kind: 'recent', title: 'Plaça de les Bruixes 2', subtitle: 'Next to the fountain', meta: '1.2 km' },
      { id: 'r2', kind: 'recent', title: 'Mercat de la Serra', subtitle: 'Avinguda dels Til·lers 61', meta: '3.8 km' },
    ],
  },
];

const RESULTS: AddressListSection[] = [
  {
    entries: [
      { id: 's1', kind: 'suggestion', title: 'Carrer del Roure 3', subtitle: 'Sant Genís' },
      { id: 's2', kind: 'suggestion', title: 'Carrer del Roure 31', subtitle: 'Sant Genís' },
      { id: 's3', kind: 'suggestion', title: 'Carrer del Roure 33B', subtitle: 'Sant Genís, behind the school' },
    ],
  },
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

export const Rows: Story = {
  render: () => (
    <Page>
      <Section title="The four flavours">
        <View>
          <AddressRow kind="place" title="Plaça de les Bruixes 2" subtitle="Next to the fountain" onPress={noop} testID="place" />
          <AddressRow kind="saved" title="Home" subtitle="Carrer de l’Om 14, 3r 2a" onPress={noop} badge={<Badge content="Default" variant="subtle" color="primary" size="label-small" />} />
          <AddressRow kind="recent" title="Mercat de la Serra" subtitle="Avinguda dels Til·lers 61" meta="3.8 km" onPress={noop} />
          <AddressRow kind="suggestion" title="Carrer del Roure 33B" subtitle="Sant Genís, behind the school" onPress={noop} />
        </View>
      </Section>
      <Section title="Selected, disabled, compact, with an action">
        <View>
          <AddressRow kind="saved" title="Studio" subtitle="Passatge del Vidre 8" role="option" selected onPress={noop} />
          <AddressRow kind="saved" title="Old flat" subtitle="No longer serviced" disabled onPress={noop} />
          <AddressRow kind="recent" title="Carrer del Roure 3" subtitle="Sant Genís" density="compact" onPress={noop} />
          <AddressRow
            kind="saved"
            title="Home"
            subtitle="Carrer de l’Om 14"
            onPress={noop}
            action={<GlyphButton size={32} glyphSize={16} icon={RiMore2Line} accessibilityLabel="More for Home" onPress={noop} />}
          />
        </View>
      </Section>
      <Section title="An avatar instead of a glyph, and no media at all">
        <View>
          <AddressRow title="Marta" subtitle="Passatge del Vidre 8 · leave it with her" leading={<Avatar name="Marta Vidal" size={40} />} onPress={noop} />
          <AddressRow title="Carrer del Roure 3" subtitle="Sant Genís" leading={null} onPress={noop} />
        </View>
      </Section>
      <Section title="Long text">
        <View style={{ maxWidth: 320 }}>
          <AddressRow
            kind="suggestion"
            title="Avinguda dels Til·lers 61, escala B, planta 4"
            subtitle="Between the market and the old water tower, ring the second bell"
            meta="12 km"
            onPress={noop}
          />
        </View>
      </Section>
    </Page>
  ),
};

function PickerDemo() {
  const [selected, setSelected] = useState('home');
  return <AddressList sections={SECTIONS} variant="picker" selectedId={selected} onSelect={setSelected} accessibilityLabel="Delivery address" testID="picker" />;
}

export const List: Story = {
  render: () => (
    <Page>
      <Section title="A picker — a radiogroup of radios">
        <PickerDemo />
      </Section>
      <Section title="A result list — sections of listitems">
        <AddressList sections={RESULTS} onSelect={noop} accessibilityLabel="Search results" />
      </Section>
      <Section title="Inside a checkout card">
        <Card>
          <CardBody style={{ paddingHorizontal: 0 }}>
            <AddressList sections={[{ title: 'Deliver to', entries: [SECTIONS[0]!.entries[0]!] }]} accessibilityLabel="Deliver to" />
          </CardBody>
        </Card>
      </Section>
    </Page>
  ),
};

export const LoadingAndEmpty: Story = {
  render: () => (
    <Page>
      <Section title="Loading">
        <AddressList sections={[]} loading accessibilityLabel="Search results" testID="loading" />
      </Section>
      <Section title="Empty">
        <AddressList
          sections={[]}
          emptyTitle="No saved places yet"
          emptyDescription="Addresses you use are kept here so you do not have to type them twice."
          accessibilityLabel="Saved places"
          testID="empty"
        />
      </Section>
      <Section title="Empty, compact, no description">
        <AddressList sections={[{ title: 'Recent', entries: [] }]} emptyTitle="Nothing recent" />
      </Section>
    </Page>
  ),
};
