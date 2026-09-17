import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Calendar,
  DatePicker,
  DateRangePicker,
  MeetingScheduler,
  RangeCalendar,
  type DateRange,
  type MeetingSchedulerDetails,
  type MeetingSchedulerHost,
  type MeetingSchedulerValue,
} from './index';

const meta: Meta<typeof DatePicker> = {
  title: 'Base/Date Picker',
  component: DatePicker,
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

const day = (d: number, month = 8) => new Date(2026, month, d);

export const Basic: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | null>(null);
      return (
        <View style={{ padding: 40, alignItems: 'flex-start', minHeight: 520 }}>
          <DatePicker value={value} onChange={setValue} testID="date-picker" />
        </View>
      );
    }
    return <Demo />;
  },
};

/** Trigger states: empty, committed, disabled. */
export const Triggers: Story = {
  render: () => (
    <View style={{ padding: 40, flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
      <DatePicker />
      <DatePicker defaultValue={day(16)} />
      <DatePicker disabled />
    </View>
  ),
};

/** The popup open on a committed day, with the days before the 3rd disabled. */
export const Open: Story = {
  render: () => (
    <View style={{ padding: 40, paddingLeft: 400, alignItems: 'flex-start', minHeight: 520 }}>
      <DatePicker defaultValue={day(16)} minDate={day(3)} defaultOpen testID="date-picker" />
    </View>
  ),
};

/** The month panel on its own: selected day, disabled days, keyboard-navigable grid. */
export const InlineCalendar: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | null>(day(16));
      return (
        <View style={{ padding: 40, gap: 12, alignItems: 'flex-start' }}>
          <Calendar value={value} onChange={setValue} minDate={day(3)} testID="calendar" />
          <Text>{value?.toDateString()}</Text>
        </View>
      );
    }
    return <Demo />;
  },
};

/** Two months with a committed range — the range band, edges and row ends. */
export const InlineRange: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<DateRange | null>({ start: day(9), end: day(22) });
      return (
        <View style={{ padding: 40, alignItems: 'flex-start' }}>
          <RangeCalendar value={value} onChange={setValue} visibleMonths={2} testID="range" />
        </View>
      );
    }
    return <Demo />;
  },
};

export const RangePicker: Story = {
  render: () => (
    <View style={{ padding: 40, width: 920, alignItems: 'flex-end', minHeight: 520 }}>
      <DateRangePicker defaultValue={{ start: day(9), end: day(22) }} defaultOpen testID="range-picker" />
    </View>
  ),
};

/** Demo booking data. */
const HOST: MeetingSchedulerHost = {
  name: 'Maya Collins',
  email: 'hi@example.com',
  avatarInitial: 'M',
};
const MEETING: MeetingSchedulerDetails = {
  title: '30 min intro meeting',
  description: "Let's discuss your design needs and how we can collaborate 🥳",
  durationMinutes: 30,
  language: 'English',
  conferencing: 'Google meet',
};

/** The scheduler's trigger — the pickers' trigger with a chevron. */
export const MeetingSchedulerTrigger: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<MeetingSchedulerValue | null>(null);
      return (
        <View style={{ padding: 40, gap: 12, alignItems: 'flex-start', minHeight: 560 }}>
          <MeetingScheduler
            host={HOST}
            meeting={MEETING}
            timezone="Amsterdam"
            value={value}
            onChange={setValue}
            testID="meeting"
          />
          <Text>{value ? `${value.date.toDateString()} ${value.time}` : 'Nothing booked'}</Text>
        </View>
      );
    }
    return <Demo />;
  },
};

/**
 * Open on a picked day and slot: host card, month panel with the summary chip
 * and "Send meeting", and the timezone / day chip / 12h-24h toggle / slot list.
 */
export const MeetingSchedulerOpen: Story = {
  render: () => (
    <View style={{ padding: 40, paddingLeft: 760, alignItems: 'flex-start', minHeight: 560 }}>
      <MeetingScheduler
        host={HOST}
        meeting={MEETING}
        timezone="Amsterdam"
        defaultValue={{ date: day(16), time: '10:30' }}
        defaultOpen
        testID="meeting"
      />
    </View>
  ),
};
