import React, { useContext } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AiProfileCard } from '../ai-profile-card';
import { Button, GlyphButton } from '../button';
import { hashContributionCell, type ContributionCell } from '../chart-cards/contributions-cells';
import { RiDraftLine, RiMore2Line } from '../icons/remix';
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
  headline: { label: 'Open pipeline', value: '€248,000', delta: '+2 deals' },
  stats: [
    { value: '4', label: 'Open deals' },
    { value: '€62k', label: 'Avg deal' },
    { value: '6 days', label: 'Last touch' },
    { value: '3h', label: 'Replies in' },
  ],
  tags: ['Enterprise', 'Renewal Q4', 'Logistics'],
  lastTouch: 'Last contacted 6 days ago',
  facts: ['Lisbon', 'Customer since 2024'],
};

const IDRIS: ContactProfileCardProps = {
  name: 'Idris Kalu',
  role: 'Procurement Lead',
  company: 'Meridian Tiles',
  coverTone: 'warning',
  channels: [
    { kind: 'email', onPress: noop },
    { kind: 'meeting', onPress: noop },
  ],
  owner: { name: 'Teodor Nagy' },
  headline: { label: 'Open pipeline', value: '€31,400', delta: '-1 deal', deltaTone: 'warning' },
  stats: [
    { value: '1', label: 'Open deal' },
    { value: '41 days', label: 'Last touch' },
    { value: '—', label: 'Replies in' },
  ],
  tags: ['Mid-market'],
  lastTouch: 'Last contacted 41 days ago',
  lastTouchTone: 'warning',
};

const COMPANY: ContactProfileCardProps = {
  kind: 'company',
  name: 'Quillon Health',
  role: 'Medical devices',
  status: { label: 'Prospect', tone: 'info' },
  coverTone: 'info',
  channels: [
    { kind: 'website', onPress: noop },
    { kind: 'email', onPress: noop },
  ],
  owner: { name: 'Marta Oyeleye', label: 'Account owner' },
  headline: { label: 'Open pipeline', value: '€1.2M', delta: '+18%' },
  stats: [
    { value: '9', label: 'Open deals' },
    { value: '€133k', label: 'Avg deal' },
    { value: 'Yesterday', label: 'Last touch' },
    { value: '2 days', label: 'Replies in' },
  ],
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
  headline: { label: 'Open pipeline against this quarter', value: '€4,180,000', delta: '+124 basis points' },
  stats: [
    { value: '17', label: 'Open deals in the current quarter' },
    { value: '€246k', label: 'Average deal size' },
    { value: '3 hours', label: 'Last touch' },
  ],
  tags: ['Very long tag that keeps going', 'Another one'],
  lastTouch: 'Last contacted 3 hours ago',
  facts: ['A fact that is far longer than any fact needs to be', 'And a second one'],
};

/**
 * A cover IMAGE, with no network: an inline SVG the bundler never fetches.
 * Every story here is demo data, and a story that waits on a CDN is a story
 * that fails in CI for a reason that has nothing to do with the card.
 */
const COVER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" viewBox="0 0 600 160">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1f3d5c"/><stop offset="0.55" stop-color="#2f6f7a"/><stop offset="1" stop-color="#8a5a3c"/>
      </linearGradient></defs>
      <rect width="600" height="160" fill="url(#g)"/>
      <circle cx="470" cy="40" r="90" fill="#ffffff" opacity="0.08"/>
      <circle cx="120" cy="150" r="120" fill="#000000" opacity="0.12"/>
    </svg>`,
  );

/**
 * A record card lives in a COLUMN, not across a desk monitor: the stories cap
 * it the way a record pane would, so a 1440 shot is not a 1400-wide card.
 */
function Page({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      <View style={{ width: '100%', maxWidth, gap: 16 }}>{children}</View>
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
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** The labelled actions a card carries once it is wide enough for words. */
const logANote = (
  <Button variant="secondary" size="small" leadingIcon={RiDraftLine} onPress={noop}>
    Log a note
  </Button>
);

export const Person: Story = {
  render: () => (
    <Page maxWidth={680}>
      <ContactProfileCard
        {...NORA}
        onPress={noop}
        actions={logANote}
        testID="contact-nora"
      />
      <ContactProfileCard {...IDRIS} onPress={noop} testID="contact-idris" />
    </Page>
  ),
};

export const Company: Story = {
  render: () => (
    <Page maxWidth={680}>
      <ContactProfileCard
        {...COMPANY}
        onPress={noop}
        actions={
          <GlyphButton
            icon={RiMore2Line}
            size={32}
            onPress={noop}
            accessibilityLabel="More actions for Quillon Health"
          />
        }
        testID="contact-company"
      />
    </Page>
  ),
};

/** A cover photo instead of the wash. */
export const WithCover: Story = {
  render: () => (
    <Page maxWidth={680}>
      <ContactProfileCard
        {...NORA}
        coverSource={COVER_IMAGE}
        onPress={noop}
        actions={logANote}
        testID="contact-cover"
      />
    </Page>
  ),
};

/** The row form: no surface, no cover, no tiles, because the list owns all of it. */
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

/** No channels, no owner, no numbers — the smallest card that still says something. */
export const Minimal: Story = {
  render: () => (
    <Page maxWidth={680}>
      <ContactProfileCard name="Sofia Renard" role="Unknown role" testID="contact-minimal" />
    </Page>
  ),
};

/** Narrow: the actions drop to glyphs and the tiles go two by two. */
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

// ---------------------------------------------------------------------------
//  The reference, in the same shot
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BANDS: [number, number][] = [[0, 0], [1, 4], [5, 9], [10, 15], [16, 24], [25, 40]];

function tierFor(row: number, col: number) {
  const seed = hashContributionCell(row, col) % 20;
  return seed < 6 ? 0 : seed < 11 ? 1 : seed < 15 ? 2 : seed < 18 ? 3 : seed < 19 ? 4 : 5;
}

const CELLS: ContributionCell[] = Array.from({ length: 38 * 7 }, (_, index) => {
  const col = Math.floor(index / 7);
  const row = index % 7;
  const tier = tierFor(row, col);
  const [lo, hi] = BANDS[tier]!;
  const count = hi === 0 ? 0 : lo + ((hashContributionCell(row, col) >>> 3) % (hi - lo + 1));
  const d = new Date(Date.UTC(2026, 0, 1 + Math.round((index / (38 * 7 - 1)) * 364)));
  return {
    count,
    tier: tier as ContributionCell['tier'],
    date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
  };
});

/**
 * The card this family is drawn to, in the same shot and at the same width.
 * `ai-profile-card` is the reference for a RECORD: a cover band, a large mark
 * hanging off it, the name at title weight over one identity line, a quiet
 * label over a big figure with a tinted delta beside it, a row of rounded stat
 * tiles, and the actions as labelled `secondary` buttons.
 */
export const BesideTheReference: Story = {
  render: () => (
    <Page maxWidth={680}>
      <View style={{ width: '100%', gap: 16 }}>
        <Caption>Bloom reference — ai-profile-card / AiProfileCard</Caption>
        <AiProfileCard
          name="Maya Collins"
          handle="@maya"
          badge="PRO"
          contributions={7462}
          countUpDuration={0}
          animateIn={false}
          delta="+14.8%"
          stats={[
            { value: '9B', label: 'Lifetime tokens' },
            { value: '562.7M', label: 'Peak tokens' },
            { value: '12h 54m', label: 'Longest task' },
            { value: '62 days', label: 'Top streak' },
          ]}
          cells={CELLS}
          periods={[]}
        />
        <Caption>This family — contact-card / ContactProfileCard</Caption>
        <ContactProfileCard {...NORA} onPress={noop} actions={logANote} testID="contact-beside" />
      </View>
    </Page>
  ),
};
