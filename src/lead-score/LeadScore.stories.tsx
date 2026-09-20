import React, { useContext } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NeighbourhoodScores } from '../property-insights';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LeadScoreCard } from './LeadScoreCard';
import type { LeadScoreFactor } from './types';

const meta: Meta = {
  title: 'Blocks/CRM/LeadScore',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented leads, invented factors.
// ---------------------------------------------------------------------------

const FACTORS: LeadScoreFactor[] = [
  { label: 'Fits the ideal profile', contribution: 24, detail: 'Logistics, 200–500 people' },
  { label: 'Opened the last five emails', contribution: 18, detail: '5 of 5 opened, 3 clicked' },
  { label: 'Visited pricing twice this week', contribution: 12 },
  { label: 'No decision-maker identified', contribution: -9, detail: 'Only one contact, no budget owner' },
  { label: 'Quiet for three weeks', contribution: -6 },
];

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

export const Hot: Story = {
  render: () => (
    <Page>
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score for Larkspur Freight"
        valueText="82 of 100, hot"
        factors={FACTORS}
        trend={{ label: '+8 against last week', direction: 'up' }}
        testID="lead-hot"
      />
    </Page>
  ),
};

/** The three bands side by side — tones, never hard-coded colours. */
export const Bands: Story = {
  render: () => (
    <Page>
      <Caption>Cold, warm and hot, with the trend each has</Caption>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <View style={{ width: 320 }}>
          <LeadScoreCard
            score={21}
            accessibilityLabel="Lead score for Meridian Tiles"
            trend={{ label: '-4 against last week', direction: 'down' }}
            testID="lead-cold"
          />
        </View>
        <View style={{ width: 320 }}>
          <LeadScoreCard
            score={55}
            accessibilityLabel="Lead score for Sablefield Studio"
            trend={{ label: 'No change', direction: 'flat' }}
            testID="lead-warm"
          />
        </View>
        <View style={{ width: 320 }}>
          <LeadScoreCard
            score={91}
            accessibilityLabel="Lead score for Quillon Health"
            trend={{ label: '+12 against last week', direction: 'up' }}
            testID="lead-hot-2"
          />
        </View>
      </View>
    </Page>
  ),
};

/** A five-point scale, long factor labels, and a narrow column. */
export const NarrowAndLong: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <Page>
        <LeadScoreCard
          score={4}
          max={5}
          title="Fit"
          accessibilityLabel="Fit score for Harbourline Rail"
          valueText="4 of 5"
          factorsLabel="What the score is made of"
          factors={[
            {
              label: 'An unusually long factor label that will certainly not fit on one line',
              contribution: 3,
              detail: 'And a detail line underneath it that is also longer than it needs to be',
            },
            { label: 'Budget unconfirmed', contribution: -2 },
            { label: 'Counted for nothing', contribution: 0 },
          ]}
          trend={{ label: '+1 against last quarter', direction: 'up' }}
          testID="lead-narrow"
        />
      </Page>
    </View>
  ),
};

/** No factors and no trend: the ring, the band, and nothing invented. */
export const ScoreOnly: Story = {
  render: () => (
    <Page>
      <LeadScoreCard score={38} accessibilityLabel="Lead score for an unnamed inbound lead" testID="lead-bare" />
    </Page>
  ),
};

export const BothThemes: Story = {
  render: () => (
    <BothModes>
      <LeadScoreCard
        score={82}
        accessibilityLabel="Lead score for Larkspur Freight"
        factors={FACTORS.slice(0, 3)}
        trend={{ label: '+8 against last week', direction: 'up' }}
      />
    </BothModes>
  ),
};

/**
 * The same shot as the meters this card is built from. `NeighbourhoodScores`
 * is the reference row: label, value right-aligned, a 6-tall accent `Meter` on
 * the shared neutral rail, a quiet description, 24 between rows.
 */
export const BesideTheReference: Story = {
  render: () => (
    <Page>
      <View style={{ width: '100%', maxWidth: 900, gap: 24 }}>
        <Caption>Bloom reference — property-insights / NeighbourhoodScores</Caption>
        <NeighbourhoodScores
          columns={1}
          items={[
            { label: 'Transport', value: 8.4, description: 'Metro 4 min, 6 bus lines' },
            { label: 'Schools', value: 6.1, description: 'Three primaries within 1 km' },
            { label: 'Quiet', value: 4.2, description: 'A main road on the north side' },
          ]}
        />
        <Caption>This family — lead-score / LeadScoreCard</Caption>
        <LeadScoreCard
          score={82}
          accessibilityLabel="Lead score for Larkspur Freight"
          valueText="82 of 100, hot"
          factors={FACTORS}
          trend={{ label: '+8 against last week', direction: 'up' }}
          testID="lead-beside"
        />
      </View>
    </Page>
  ),
};
