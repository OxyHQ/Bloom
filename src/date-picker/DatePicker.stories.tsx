import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Calendar,
  DatePicker,
  DateRangePicker,
  MeetingScheduler,
  RangeCalendar,
  TimeField,
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

/**
 * The time field beside the date picker it lines up with: 24h and 12h, a
 * 15-minute grid with bounds, both sizes, empty, and disabled. Type `930`,
 * `9.30` or `9pm`; ArrowUp / ArrowDown step by `step`.
 */
export const TimeFields: Story = {
  render: function TimeFieldStory() {
    const [date, setDate] = useState<Date | null>(day(14));
    const [plain, setPlain] = useState<string | null>('18:30');
    const [twelve, setTwelve] = useState<string | null>('18:30');
    const [booking, setBooking] = useState<string | null>(null);
    const [small, setSmall] = useState<string | null>('07:05');
    const row = { flexDirection: 'row', alignItems: 'center', gap: 12 } as const;
    return (
      <View style={{ gap: 20, padding: 24 }}>
        <View style={row}>
          <DatePicker value={date} onChange={setDate} />
          <TimeField value={plain} onChange={setPlain} accessibilityLabel="Viewing time" testID="tf-24h" />
        </View>
        <View style={row}>
          <TimeField
            value={twelve}
            onChange={setTwelve}
            hourFormat="12h"
            accessibilityLabel="Viewing time, 12 hour"
            width={120}
            testID="tf-12h"
          />
          <Text>{`value: ${twelve ?? 'null'}`}</Text>
        </View>
        <View style={row}>
          <TimeField
            value={booking}
            onChange={setBooking}
            min="09:00"
            max="20:00"
            step={15}
            accessibilityLabel="Booking time"
            testID="tf-grid"
          />
          <Text>{`09:00 – 20:00, every 15 min — value: ${booking ?? 'null'}`}</Text>
        </View>
        <View style={row}>
          <TimeField value={small} onChange={setSmall} size="small" accessibilityLabel="Start" testID="tf-small" />
          <TimeField value={null} onChange={() => {}} size="small" accessibilityLabel="End" testID="tf-empty" />
          <TimeField value="12:00" onChange={() => {}} disabled accessibilityLabel="Locked" testID="tf-disabled" />
        </View>
      </View>
    );
  },
};
