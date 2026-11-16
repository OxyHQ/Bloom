import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LeadScoreCard } from './LeadScoreCard';
import type { LeadScoreFactor } from './types';

const meta: Meta = {
  id: 'blocks-crm-leadscore',
  title: 'Patterns/CRM/Lead Score',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented leads, invented factors.
// ---------------------------------------------------------------------------

const FACTORS: LeadScoreFactor[] = [
  { label: 'Fits the ideal profile', contribution: 24, detail: 'Logistics, 200–500 people' },
  { label: 'Opened the last five emails', contribution: 18, detail: '5 of 5, 3 clicked' },
  { label: 'Visited pricing twice', contribution: 12, detail: 'This week' },
  { label: 'No decision-maker', contribution: -9, detail: 'One contact, no budget owner' },
  { label: 'Quiet for three weeks', contribution: -6, detail: 'Last reply 21 days ago' },
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

export const Hot: Story = {
  render: () => (
    <Page>
      <View style={{ maxWidth: 420, width: '100%' }}>
        <LeadScoreCard
          score={82}
          accessibilityLabel="Lead score for Larkspur Freight"
          valueText="82 of 100, hot"
          factors={FACTORS}
          trend={{ label: '+8 against last week', direction: 'up' }}
          testID="lead-hot"
        />
      </View>
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
            factors={FACTORS.slice(3)}
            testID="lead-cold"
          />
        </View>
        <View style={{ width: 320 }}>
          <LeadScoreCard
            score={55}
            accessibilityLabel="Lead score for Sablefield Studio"
            trend={{ label: 'No change', direction: 'flat' }}
            factors={FACTORS.slice(1, 4)}
            testID="lead-warm"
          />
        </View>
        <View style={{ width: 320 }}>
          <LeadScoreCard
            score={91}
            accessibilityLabel="Lead score for Quillon Health"
            trend={{ label: '+12 against last week', direction: 'up' }}
            factors={FACTORS.slice(0, 3)}
            testID="lead-hot-2"
          />
        </View>
      </View>
    </Page>
  ),
};

/** A five-point scale and long factor labels adapt to the viewport. */
export const LongFactors: Story = {
  render: () => (
    <View style={{ width: '100%', maxWidth: 420 }}>
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
              detail: 'And a detail that is also longer than it needs to be',
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
      <View style={{ maxWidth: 420, width: '100%' }}>
        <LeadScoreCard
          score={38}
          accessibilityLabel="Lead score for an unnamed inbound lead"
          testID="lead-bare"
        />
      </View>
    </Page>
  ),
};
