import React, { useContext } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EarningsBreakdown } from './EarningsBreakdown';
import { EarningsPayoutRow } from './EarningsPayoutRow';
import { EarningsSummary } from './EarningsSummary';
import type { EarningsPeriod } from './types';

const meta: Meta = {
  title: 'Blocks/Fulfilment/Earnings',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented amounts, in euros because the app that owns them is.
// ---------------------------------------------------------------------------

const euros = (value: number) => `€${value.toFixed(2)}`;

const DAY: EarningsPeriod = {
  id: 'day',
  label: 'Day',
  total: '€96.40',
  deltaRatio: 0.082,
  caption: 'Before the platform fee',
  bars: [
    { label: '07', value: 6.2, amount: '€6.20' },
    { label: '09', value: 18.4, amount: '€18.40' },
    { label: '11', value: 24.1, amount: '€24.10' },
    { label: '13', value: 11.7, amount: '€11.70' },
    { label: '15', value: 9.4, amount: '€9.40' },
    { label: '17', value: 16.8, amount: '€16.80' },
    { label: '19', value: 9.8, amount: '€9.80' },
  ],
  stats: [
    { value: '11', label: 'Jobs done' },
    { value: '6 h 10', label: 'Online' },
    { value: '€2.18', label: 'Per kilometre' },
  ],
  lines: [
    { label: 'Jobs', sublabel: '11 delivered', amount: '€78.90' },
    { label: 'Tips', sublabel: 'From 4 recipients', amount: '€9.50', tone: 'discount' },
    { label: 'Bonuses', sublabel: 'Busy-hour top-up', amount: '€12.00', tone: 'discount' },
    { label: 'Adjustments', sublabel: 'One cancelled job', amount: '−€4.00', tone: 'muted' },
  ],
  payout: {
    amount: '€96.40',
    date: 'Tomorrow, before 18:00',
    state: 'scheduled',
    destination: 'Account ending 4417',
  },
};

const WEEK: EarningsPeriod = {
  id: 'week',
  label: 'Week',
  total: '€612.75',
  deltaRatio: 0.148,
  caption: 'Before the platform fee',
  bars: [
    { label: 'Mon', value: 96.4, amount: '€96.40' },
    { label: 'Tue', value: 71.2, amount: '€71.20' },
    { label: 'Wed', value: 108.9, amount: '€108.90' },
    { label: 'Thu', value: 64.5, amount: '€64.50' },
    { label: 'Fri', value: 132.4, amount: '€132.40' },
    { label: 'Sat', value: 101.6, amount: '€101.60' },
    { label: 'Sun', value: 37.75, amount: '€37.75' },
  ],
  stats: [
    { value: '68', label: 'Jobs done' },
    { value: '31 h 20', label: 'Online' },
    { value: '€2.04', label: 'Per kilometre' },
  ],
  lines: [
    { label: 'Jobs', sublabel: '68 delivered', amount: '€521.15' },
    { label: 'Tips', sublabel: 'From 29 recipients', amount: '€58.60', tone: 'discount' },
    { label: 'Bonuses', sublabel: 'Two busy-hour top-ups', amount: '€44.00', tone: 'discount' },
    { label: 'Adjustments', sublabel: 'Three cancelled jobs', amount: '−€11.00', tone: 'muted' },
  ],
  payout: {
    amount: '€612.75',
    date: 'Friday 26 September',
    state: 'processing',
    destination: 'Account ending 4417',
  },
};

const MONTH: EarningsPeriod = {
  id: 'month',
  label: 'Month',
  total: '€2,418.30',
  deltaRatio: -0.031,
  caption: 'Before the platform fee',
  bars: [
    { label: 'W1', value: 548.2, amount: '€548.20' },
    { label: 'W2', value: 612.75, amount: '€612.75' },
    { label: 'W3', value: 705.1, amount: '€705.10' },
    { label: 'W4', value: 552.25, amount: '€552.25' },
  ],
  stats: [
    { value: '281', label: 'Jobs done' },
    { value: '126 h', label: 'Online' },
    { value: '€2.11', label: 'Per kilometre' },
    { value: '4.94', label: 'Rating' },
  ],
  lines: [
    { label: 'Jobs', sublabel: '281 delivered', amount: '€2,061.40' },
    { label: 'Tips', sublabel: 'From 118 recipients', amount: '€228.90', tone: 'discount' },
    { label: 'Bonuses', sublabel: 'Referrals and top-ups', amount: '€176.00', tone: 'discount' },
    { label: 'Adjustments', sublabel: 'Cancellations and one claim', amount: '−€48.00', tone: 'muted' },
  ],
  payout: {
    amount: '€552.25',
    date: 'Friday 26 September',
    state: 'scheduled',
    destination: 'Account ending 4417',
  },
};

const PERIODS: EarningsPeriod[] = [DAY, WEEK, MONTH];

/** The axis is the one number nobody pre-formatted; the app gives it words. */
const axis = (value: number) => (value === 0 ? '€0' : `€${Math.round(value)}`);

function Page({ children, maxWidth = 680 }: { children: React.ReactNode; maxWidth?: number }) {
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

function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 640 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 640 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** The whole panel: the chart card's own switch drives everything under it. */
export const Summary: Story = {
  render: () => (
    <Page>
      <EarningsSummary
        periods={PERIODS}
        defaultPeriod="week"
        formatAxisValue={axis}
        onPressPayout={noop}
        testID="earnings"
      />
    </Page>
  ),
};

/** One period, no switch: the chart card draws the figure and the bars alone. */
export const OnePeriod: Story = {
  render: () => (
    <Page>
      <EarningsSummary periods={[WEEK]} formatAxisValue={axis} testID="earnings" />
    </Page>
  ),
};

/** A payout the reader has to do something about. */
export const PayoutStates: Story = {
  render: () => (
    <Page maxWidth={480}>
      <Caption>Waiting</Caption>
      <EarningsPayoutRow
        payout={{
          amount: '€612.75',
          date: 'Friday 26 September',
          state: 'scheduled',
          destination: 'Account ending 4417',
        }}
        testID="scheduled"
      />
      <Caption>Already moving</Caption>
      <EarningsPayoutRow
        payout={{ amount: '€96.40', date: 'Today', state: 'processing' }}
        testID="processing"
      />
      <Caption>Done</Caption>
      <EarningsPayoutRow
        payout={{ amount: '€548.20', date: 'Friday 19 September', state: 'paid' }}
        testID="paid"
      />
      <Caption>Needs the reader</Caption>
      <EarningsPayoutRow
        payout={{
          amount: '€612.75',
          date: 'Held since Tuesday',
          state: 'held',
          note: 'Confirm your tax number before the next payout run.',
        }}
        action={
          <Button variant="secondary" size="small" onPress={noop}>
            Confirm the number
          </Button>
        }
        testID="held"
      />
      <EarningsPayoutRow
        payout={{
          amount: '€96.40',
          date: 'Tried on Monday',
          state: 'failed',
          destination: 'Account ending 4417',
          note: 'The bank refused the transfer. Check the account and try again.',
        }}
        action={
          <Button variant="secondary" size="small" onPress={noop}>
            Try again
          </Button>
        }
        testID="failed"
      />
    </Page>
  ),
};

/** The breakdown standing on its own, with a total, at the sizes it has to work at. */
export const Breakdown: Story = {
  render: () => (
    <Page maxWidth={420}>
      <EarningsBreakdown
        lines={WEEK.lines ?? []}
        total={{ label: 'Total', amount: euros(612.75), note: 'Before the platform fee' }}
        testID="breakdown"
      />
    </Page>
  ),
};

/** A period that paid nothing: bars at zero, and the panel says so. */
export const Nothing: Story = {
  render: () => (
    <Page>
      <EarningsSummary
        periods={[
          {
            id: 'day',
            label: 'Day',
            total: '€0.00',
            bars: [
              { label: '07', value: 0, amount: '€0.00' },
              { label: '09', value: 0, amount: '€0.00' },
              { label: '11', value: 0, amount: '€0.00' },
              { label: '13', value: 0, amount: '€0.00' },
            ],
          },
        ]}
        formatAxisValue={axis}
        testID="earnings"
      />
    </Page>
  ),
};

/** Both modes side by side. */
export const Modes: Story = {
  render: () => (
    <BothModes>
      <EarningsSummary periods={[WEEK]} formatAxisValue={axis} />
    </BothModes>
  ),
};
