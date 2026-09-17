import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiAsterisk } from '../icons/remix/RiAsterisk';
import { RiCapsuleFill } from '../icons/remix/RiCapsuleFill';
import { RiHeartPulseFill } from '../icons/remix/RiHeartPulseFill';
import { RiLungsFill } from '../icons/remix/RiLungsFill';
import { RiMoonClearFill } from '../icons/remix/RiMoonClearFill';
import { RiTestTubeFill } from '../icons/remix/RiTestTubeFill';
import { ImportantAlertsCard } from './index';
import type { ImportantAlertsCardAlert } from './types';

const meta: Meta<typeof ImportantAlertsCard> = {
  title: 'Blocks/Important Alerts',
  component: ImportantAlertsCard,
};

export default meta;

type Story = StoryObj<typeof ImportantAlertsCard>;

/** Demo feed. */
const ALERTS: ImportantAlertsCardAlert[] = [
  {
    icon: RiHeartPulseFill,
    tone: 'rose',
    title: 'High Heart rate',
    description:
      'Your heart rate rose above 120 BPM while you seemed to be inactive for 10 minutes starting at 8:59 AM, 12 June.',
    date: 'June, 12',
  },
  {
    icon: RiAsterisk,
    tone: 'amber',
    title: 'Medical ID',
    description: 'Your emergency contact and allergy information was updated in your Medical ID.',
    date: 'June, 9',
  },
  {
    icon: RiTestTubeFill,
    tone: 'emerald',
    title: 'Lab results ready',
    description:
      'Your latest blood panel ordered by Dr. Mattheus Clarkson is back — cholesterol and glucose are within the normal range.',
    date: 'June, 9',
  },
  {
    icon: RiCapsuleFill,
    tone: 'blue',
    title: 'Medication reminder',
    description:
      'You missed your 9:00 AM dose of Metoprolol. Take it as soon as possible unless your next dose is near.',
    date: 'June, 8',
  },
  {
    icon: RiMoonClearFill,
    tone: 'purple',
    title: 'Irregular sleep',
    description:
      'Your bedtime shifted by more than 2 hours on 3 of the last 7 nights, which can affect your sleep score.',
    date: 'June, 6',
  },
  {
    icon: RiLungsFill,
    tone: 'teal',
    title: 'Low blood oxygen',
    description: 'Your blood oxygen dipped to 93% for a short period during sleep on the night of 4 June.',
    date: 'June, 5',
  },
];

/** The medical dashboard card: 12 this week, the six latest in a scrolling feed. */
export const Default: Story = {
  render: () => (
    <View style={{ padding: 40, width: 400 }}>
      <ImportantAlertsCard testID="alerts" alerts={ALERTS} count={12} rangeLabel="29 Jun - 5 Jul" />
    </View>
  ),
};

/** No range pill, a custom caption, a taller card and an explicit icon colour. */
export const Customised: Story = {
  render: () => (
    <View style={{ padding: 40, width: 400 }}>
      <ImportantAlertsCard
        alerts={[{ ...ALERTS[0]!, iconBackground: '#111827' }, ...ALERTS.slice(1, 3)]}
        count="3"
        title="Alerts"
        countCaption="today"
        height={420}
      />
    </View>
  ),
};

/** A single alert — the feed never reaches the bottom edge, so nothing clips. */
export const Short: Story = {
  render: () => (
    <View style={{ padding: 40, width: 400 }}>
      <ImportantAlertsCard alerts={ALERTS.slice(0, 1)} count={1} rangeLabel="29 Jun - 5 Jul" />
    </View>
  ),
};
