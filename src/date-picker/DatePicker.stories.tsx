import React, { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
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
  argTypes: {
    "placeholder": { control: 'text' },
    "disabled": { control: 'boolean' },
    "open": { control: 'boolean' },
    "defaultOpen": { control: 'boolean' },
    "locale": { control: 'text' }
  },
  title: 'Base/Date Picker',
  component: DatePicker,
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

const day = (d: number, month = 8) => new Date(2026, month, d);

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | null>(null);
      return (
        <View style={{ alignItems: 'flex-start', minHeight: 520 }}>
          <DatePicker value={value} onChange={setValue} testID="date-picker" />
        </View>
      );
    }
    return <Demo />;
  },
};

/** Trigger states: empty, committed, disabled. */
export const Triggers: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16, alignItems: 'flex-start' }}>
      <DatePicker />
      <DatePicker defaultValue={day(16)} />
      <DatePicker disabled />
    </View>
  ),
};

/** The popup open on a committed day, with the days before the 3rd disabled. */
export const Open: Story = {
  args: { defaultOpen: true },
  parameters: { controls: { include: ["defaultOpen","placeholder","disabled","open","locale"] } },
  render: (args) => (
    <View style={{ alignItems: 'flex-start', minHeight: 520 }}>
      <DatePicker {...args} defaultValue={day(16)} minDate={day(3)}  testID="date-picker" />
    </View>
  ),
};

/** The month panel on its own: selected day, disabled days, keyboard-navigable grid. */
export const InlineCalendar: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | null>(day(16));
      return (
        <View style={{ gap: 12, alignItems: 'flex-start' }}>
          <Calendar value={value} onChange={setValue} minDate={day(3)} testID="calendar" />
          <Text>{value?.toDateString()}</Text>
        </View>
      );
    }
    return <Demo />;
  },
};

/** Two months on desktop, one on phones; selection and keyboard navigation stay shared. */
export const InlineRange: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    function Demo() {
      const [value, setValue] = useState<DateRange | null>({ start: day(9), end: day(22) });
      const { width } = useWindowDimensions();
      return (
        <View style={{ alignItems: 'flex-start' }}>
          <RangeCalendar value={value} onChange={setValue} visibleMonths={width < 700 ? 1 : 2} testID="range" />
        </View>
      );
    }
    return <Demo />;
  },
};

export const RangePicker: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 920, alignItems: 'flex-end', minHeight: 520 }}>
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
  parameters: { controls: { disable: true } },
  render: () => {
    function Demo() {
      const [value, setValue] = useState<MeetingSchedulerValue | null>(null);
      return (
        <View style={{ gap: 12, alignItems: 'flex-start', minHeight: 560 }}>
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
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ alignItems: 'flex-start', minHeight: 560 }}>
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

export const Playground: Story = {
  args: { disabled: false },
  parameters: { controls: { include: ['placeholder', 'disabled', 'locale'] } },
  render: function PlaygroundDate(args) {
    const [value, setValue] = useState<Date | null>(null);
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};
