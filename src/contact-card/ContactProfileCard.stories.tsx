import React, { useContext } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlyphButton } from '../button';
import { SavedSearchCard } from '../home-search';
import { RiMore2Line } from '../icons/remix';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ContactProfileCard } from './ContactProfileCard';
import type { ContactProfileCardProps } from './types';

const meta: Meta = {
  title: 'Blocks/CRM/ContactProfileCard',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented people and invented companies.
// ---------------------------------------------------------------------------

const NORA: ContactProfileCardProps = {
  name: 'Nora Vance',
  role: 'Head of Operations',
  company: 'Larkspur Freight',
  status: { label: 'Customer', tone: 'success' },
  channels: [
    { kind: 'email', onPress: noop },
    { kind: 'phone', onPress: noop },
    { kind: 'chat', onPress: noop },
  ],
  owner: { name: 'Marta Oyeleye' },
  tags: ['Enterprise', 'Renewal Q4', 'Logistics'],
  lastTouch: 'Last contacted 6 days ago',
  facts: ['Lisbon', 'Customer since 2024'],
};

const IDRIS: ContactProfileCardProps = {
  name: 'Idris Kalu',
  role: 'Procurement Lead',
  company: 'Meridian Tiles',
  channels: [
    { kind: 'email', onPress: noop },
    { kind: 'meeting', onPress: noop },
  ],
  owner: { name: 'Teodor Nagy' },
  tags: ['Mid-market'],
  lastTouch: 'Last contacted 41 days ago',
  lastTouchTone: 'warning',
};

const COMPANY: ContactProfileCardProps = {
  kind: 'company',
  name: 'Quillon Health',
  role: 'Medical devices',
  status: { label: 'Prospect', tone: 'info' },
  channels: [
    { kind: 'website', onPress: noop },
    { kind: 'email', onPress: noop },
  ],
  owner: { name: 'Marta Oyeleye', label: 'Account owner' },
  tags: ['Healthcare', 'Inbound'],
  facts: ['240 people', 'Porto · Valencia'],
  lastTouch: 'Last contacted yesterday',
  people: [
    { id: 'p1', name: 'Rhea Santos' },
    { id: 'p2', name: 'Kofi Mensah' },
    { id: 'p3', name: 'Ana Bilić' },
    { id: 'p4', name: 'Sam Oduya' },
    { id: 'p5', name: 'Lior Ben-Ami' },
  ],
  peopleTotal: 9,
  peopleLabel: '9 people here',
};

const LONG: ContactProfileCardProps = {
  name: 'Alexandrina Wollstonecraft-Achterberg',
  role: 'Interim Director of Procurement and Supplier Relations',
  company: 'Sablefield Studio and Manufacturing Partners',
  channels: [
    { kind: 'email', onPress: noop },
    { kind: 'phone', onPress: noop },
    { kind: 'video', onPress: noop },
  ],
  owner: { name: 'Wilhelmina Featherstonehaugh' },
  tags: ['Very long tag that keeps going', 'Another one'],
  lastTouch: 'Last contacted 3 hours ago',
  facts: ['A fact that is far longer than any fact needs to be', 'And a second one'],
};

function Page({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** The same block in both modes — every colour here flips. */
function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 520 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 520 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

export const Person: Story = {
  render: () => (
    <Page>
      <ContactProfileCard
        {...NORA}
        onPress={noop}
        actions={
          <GlyphButton
            icon={RiMore2Line}
            size={36}
            onPress={noop}
            accessibilityLabel="More actions for Nora Vance"
          />
        }
        testID="contact-nora"
      />
      <ContactProfileCard {...IDRIS} onPress={noop} testID="contact-idris" />
    </Page>
  ),
};

export const Company: Story = {
  render: () => (
    <Page>
      <ContactProfileCard {...COMPANY} onPress={noop} testID="contact-company" />
    </Page>
  ),
};

/** The row form: no surface of its own, because the list owns one. */
export const CompactRows: Story = {
  render: () => {
    const rows = [NORA, IDRIS, { ...COMPANY, people: undefined, peopleLabel: undefined }];
    return (
      <Page>
        <Caption>Compact — a list of rows</Caption>
        <View style={{ gap: 4 }}>
          {rows.map((row, index) => (
            <ContactProfileCard
              key={row.name}
              {...row}
              density="compact"
              onPress={noop}
              testID={`contact-row-${index}`}
            />
          ))}
        </View>
      </Page>
    );
  },
};

/** No channels, no owner, no tags — the smallest card that still says something. */
export const Minimal: Story = {
  render: () => (
    <Page>
      <ContactProfileCard name="Sofia Renard" role="Unknown role" testID="contact-minimal" />
    </Page>
  ),
};

export const LongText: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 20 }}>
      <View style={{ width: 360 }}>
        <ContactProfileCard {...LONG} onPress={noop} testID="contact-long" />
      </View>
      <View style={{ width: 280 }}>
        <ContactProfileCard {...LONG} density="compact" onPress={noop} testID="contact-long-row" />
      </View>
    </View>
  ),
};

export const BothThemes: Story = {
  render: () => (
    <BothModes>
      <ContactProfileCard {...NORA} onPress={noop} />
      <ContactProfileCard {...COMPANY} onPress={noop} />
      <ContactProfileCard {...IDRIS} density="compact" onPress={noop} />
    </BothModes>
  ),
};

/**
 * The same shot as the card this family is built to. `SavedSearchCard` is the
 * reference: a 44 leading mark, a `body-semibold` title with a badge opposite,
 * outlined chips wrapped in a row, a hairline, and a quiet label on the left of
 * the footer with real controls on the right.
 */
export const BesideTheReference: Story = {
  render: () => (
    <Page>
      <View style={{ width: '100%', maxWidth: 900, gap: 16 }}>
        <Caption>Bloom reference — home-search / SavedSearchCard</Caption>
        <SavedSearchCard
          title="2-bed flats in Old Halden"
          criteria={['€800 – €1,200', '2+ bedrooms', 'Lift', 'Pets allowed']}
          newCount={12}
          alertFrequency="Daily alerts"
          onPress={noop}
          onEdit={noop}
          onDelete={noop}
        />
        <Caption>This family — contact-card / ContactProfileCard</Caption>
        <ContactProfileCard {...NORA} facts={['Lisbon']} onPress={noop} testID="contact-beside" />
        <ContactProfileCard {...COMPANY} onPress={noop} />
      </View>
    </Page>
  ),
};
