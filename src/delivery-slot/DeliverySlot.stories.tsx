import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody } from '../card';
import { useTheme } from '../theme/use-theme';
import { DeliverySlotPicker } from './DeliverySlotPicker';
import type { DeliveryAsapOption, DeliveryDay, DeliveryWindow } from './types';

const meta: Meta<typeof DeliverySlotPicker> = {
  title: 'Blocks/Checkout/DeliverySlot',
  component: DeliverySlotPicker,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof DeliverySlotPicker>;

// ---------------------------------------------------------------------------
//  Demo data — invented. Every date, window and amount is a string the "app"
//  formatted; nothing in this family reads a clock or adds a number.
// ---------------------------------------------------------------------------

const DAYS: DeliveryDay[] = [
  { id: 'thu', weekday: 'Thu', day: '23', accessibilityLabel: 'Thursday 23 October' },
  { id: 'fri', weekday: 'Fri', day: '24', accessibilityLabel: 'Friday 24 October' },
  { id: 'sat', weekday: 'Sat', day: '25', accessibilityLabel: 'Saturday 25 October' },
  { id: 'sun', weekday: 'Sun', day: '26', disabled: true, accessibilityLabel: 'Sunday 26 October, closed' },
  { id: 'mon', weekday: 'Mon', day: '27', accessibilityLabel: 'Monday 27 October' },
  { id: 'tue', weekday: 'Tue', day: '28', accessibilityLabel: 'Tuesday 28 October' },
  { id: 'wed', weekday: 'Wed', day: '29', accessibilityLabel: 'Wednesday 29 October' },
];

const WINDOWS: Record<string, DeliveryWindow[]> = {
  thu: [
    { id: 'thu-1', label: '09:00 – 11:00', price: 'Free', capacity: '2 left' },
    { id: 'thu-2', label: '11:00 – 13:00', soldOut: true },
    { id: 'thu-3', label: '17:00 – 19:00', tier: 'express', price: '+€3.50', capacity: 'Almost full' },
  ],
  fri: [
    { id: 'fri-1', label: '08:00 – 10:00', price: 'Free' },
    { id: 'fri-2', label: '10:00 – 12:00', price: 'Free', capacity: '4 left' },
    { id: 'fri-3', label: '12:00 – 14:00', soldOut: true },
    {
      id: 'fri-4',
      label: '17:00 – 19:00',
      tier: 'express',
      price: '+€2.50',
      capacity: '2 left',
      note: 'Leaves the depot at 16:00',
    },
    { id: 'fri-5', label: '19:00 – 21:00', price: '+€1.00' },
  ],
  sat: [
    { id: 'sat-1', label: '10:00 – 12:00', price: '+€1.00' },
    { id: 'sat-2', label: '14:00 – 16:00', tier: 'express', price: '+€4.00', capacity: 'Last one' },
  ],
  mon: [],
  tue: [{ id: 'tue-1', label: '09:00 – 11:00', price: 'Free' }],
  wed: [{ id: 'wed-1', label: '15:00 – 17:00', price: 'Free', capacity: '6 left' }],
};

const ASAP: DeliveryAsapOption = {
  id: 'asap',
  eta: '25 – 40 min',
  price: '+€4.90',
  note: 'Handed to the next free courier',
};

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 24, maxWidth: 560, width: '100%' }}>{children}</View>;
}

function Picker(props: Partial<React.ComponentProps<typeof DeliverySlotPicker>>) {
  const [day, setDay] = useState('fri');
  const [value, setValue] = useState<string | undefined>('fri-4');
  const windows = useMemo(() => WINDOWS[day] ?? [], [day]);
  return (
    <DeliverySlotPicker
      days={DAYS}
      day={day}
      onDayChange={(next) => {
        setDay(next);
        setValue(undefined);
      }}
      windows={windows}
      value={value}
      onValueChange={setValue}
      asap={ASAP}
      {...props}
    />
  );
}

/** A day, its windows, and the option that belongs to no day. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Picker />
    </Page>
  ),
};

/** The field's own description, and its invalid state. */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Picker
        description="Windows fill up; yours is held for ten minutes."
        error="Pick a delivery window to continue."
      />
    </Page>
  ),
};

/** The windows are reloaded when the day changes; an empty list is not "none left". */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Picker loading />
    </Page>
  ),
};

/** A day with nothing left — `EmptyState` at the panel rung. */
export const NothingLeft: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    return (
      <Page>
        <DeliverySlotPicker days={DAYS} day="mon" windows={[]} onDayChange={() => {}} />
      </Page>
    );
  },
};

/** The field's `disabled` reaches the strip and every option, and nothing can opt out. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Picker disabled description="Choose an address first." />
    </Page>
  ),
};

/** On a card — the strip's fade has to be told what is behind it. */
export const OnACard: Story = {
  parameters: { controls: { disable: true } },
  render: function OnACardStory() {
    const theme = useTheme();
    return (
      <Page>
        <Card radius="radius-16">
          <CardBody>
            <Picker fadeColor={theme.colors.card} />
          </CardBody>
        </Card>
      </Page>
    );
  },
};

/** Edit the props in Controls. */
export const Playground: Story = {
  args: {
    days: DAYS,
    day: 'fri',
    windows: WINDOWS.fri,
    value: 'fri-4',
    asap: ASAP,
  },
};
