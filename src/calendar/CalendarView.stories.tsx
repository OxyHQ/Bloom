import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { Button } from '../button';
import { RiCalendarLine, RiGroupLine, RiUserLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CalendarView,
  CalendarViewEventDetails,
  CalendarViewInboxMenu,
  CalendarViewMonthGrid,
  CalendarViewMonthSwitcher,
} from './index';
import type { CalendarViewEvent, CalendarViewFeedAccount, CalendarViewParticipant } from './types';

const meta: Meta<typeof CalendarView> = {
  title: 'Blocks/Calendar',
  component: CalendarView,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof CalendarView>;

// ---------------------------------------------------------------------------
//  Demo data, August 2026 around
//  four cells (2, 11, 20, 24) plus the neighbouring days
//  the six-week grid shows. Demo only — the block takes whatever you pass.
// ---------------------------------------------------------------------------

type Row = [id: string, title: string, time: string | undefined, color: CalendarViewEvent['color']];

const day = (month: number, date: number) => new Date(2026, month - 1, date);
const on = (month: number, date: number, rows: Row[]): CalendarViewEvent[] =>
  rows.map(([id, title, time, color]) => ({
    id,
    date: day(month, date),
    title,
    time,
    color,
  }));

const BIRTHDAY_PARTICIPANTS: CalendarViewParticipant[] = [
  { email: 'hi@example.com', initials: 'M', color: 'neutral' },
  { email: 'sam.rivera@example.com', initials: 'S', color: 'lime' },
  { email: 'lena.park@example.com', initials: 'L', color: 'pink' },
  { email: 'jordan.clarke@example.com', initials: 'J', color: 'blue' },
];

/** An event-details example with every row filled. */
const BIRTHDAY: CalendarViewEvent = {
  id: 'birthday',
  date: day(8, 11),
  title: 'Birthday night at Bacalar’s',
  time: '20:30',
  endTime: '23:30',
  color: 'purple',
  meeting: {
    label: 'Google Meet',
    code: 'igc-mfrq-sse',
    icon: (
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          backgroundColor: '#00AC47',
        }}
      />
    ),
  },
  timeZone: 'Amsterdam',
  participants: BIRTHDAY_PARTICIPANTS,
  reminder: '2h before',
  // No venue photo is shipped; a warm gradient stands in.
  image: {
    uri: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDQiIGhlaWdodD0iMTk4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNTllMGIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3YzNhZWQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjA0IiBoZWlnaHQ9IjE5OCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==',
  },
};

const EVENTS: CalendarViewEvent[] = [
  ...on(7, 28, [['jul-28-coffee', 'Coffee', '09:30', 'lime']]),
  ...on(7, 30, [['jul-30-payday', 'Payday', undefined, 'lime']]),
  ...on(8, 1, [['aug-01-brunch', 'Brunch', '11:00', 'lime']]),
  ...on(8, 2, [
    ['standup-2', 'Stand-up', '11:30', 'pink'],
    ['sync-2', '1:1 sync', '16:30', 'lime'],
  ]),
  ...on(8, 5, [['aug-05-gym', 'Gym', '07:00', 'pink']]),
  ...on(8, 8, [['aug-08-game-night', 'Game night', '19:00', 'purple']]),
  ...on(8, 11, [['holidays', 'Holidays', undefined, 'emerald']]),
  BIRTHDAY,
  ...on(8, 14, [['aug-14-retro', 'Retro', '15:00', 'blue']]),
  ...on(8, 17, [
    ['aug-17-planning', 'Planning', '10:00', 'blue'],
    ['aug-17-haircut', 'Haircut', '16:00', 'emerald'],
  ]),
  ...on(8, 20, [
    ['design-review', 'Design review', '09:30', 'blue'],
    ['client-call', 'Client call', '10:15', 'emerald'],
    ['team-lunch', 'Team lunch', '13:00', 'purple'],
    ['standup-20', 'Stand-up', '11:30', 'pink'],
    ['sync-20', '1:1 sync', '16:30', 'lime'],
    ['portfolio-review', 'Portfolio review', '14:30', 'blue'],
  ]),
  ...on(8, 24, [['dinner', 'Dinner with friends', '19:15', 'purple']]),
  ...on(8, 27, [['aug-27-yoga', 'Yoga', '07:30', 'pink']]),
  ...on(8, 29, [['aug-29-brunch', 'Brunch', '11:00', 'lime']]),
  ...on(8, 31, [['aug-31-payday', 'Payday', undefined, 'lime']]),
  ...on(9, 1, [['sep-01-kickoff', 'Kickoff', '09:00', 'blue']]),
  ...on(9, 2, [['sep-02-standup', 'Standup', '09:00', 'pink']]),
  ...on(9, 4, [['sep-04-dentist', 'Dentist', '10:30', 'emerald']]),
  ...on(9, 10, [
    ['sep-10-design-review', 'Design review', '11:00', 'blue'],
    ['sep-10-client-call', 'Client call', '14:00', 'emerald'],
  ]),
  ...on(9, 24, [
    ['sep-24-standup', 'Standup', '09:00', 'pink'],
    ['sep-24-lunch', 'Team lunch', '12:30', 'lime'],
  ]),
];

/** Inbox accounts and their feeds. */
const FEEDS: CalendarViewFeedAccount[] = [
  {
    email: 'hi@example.com',
    feeds: [
      { id: 'maya-incoming', label: 'Incoming events', color: 'blue' },
      { id: 'maya-f1', label: 'F1 Schedule', color: 'red' },
      {
        id: 'maya-holidays',
        label: 'Holidays in Netherlands',
        color: 'lime',
      },
    ],
  },
  {
    email: 'maya.collins@example.com',
    feeds: [
      { id: 'gmail-incoming', label: 'Incoming events', color: 'blue' },
      { id: 'gmail-worldcup', label: 'World Cup 2026', color: 'purple' },
    ],
  },
  {
    email: 'hello@studio.example',
    feeds: [
      { id: 'studio-incoming', label: 'Incoming events', color: 'blue' },
      { id: 'studio-ufc', label: 'UFC Nights', color: 'teal' },
      { id: 'studio-hotd', label: 'House of Dragons', color: 'pink' },
    ],
  },
];

const AUGUST = day(8, 1);

const BREADCRUMB = (
  <Breadcrumb>
    <BreadcrumbItem icon={RiGroupLine} href="#team">
      Design team
    </BreadcrumbItem>
    <BreadcrumbItem icon={RiUserLine} href="#maya">
      Maya
    </BreadcrumbItem>
    <BreadcrumbItem icon={RiCalendarLine} current>
      Calendar
    </BreadcrumbItem>
  </Breadcrumb>
);

/** The page: `background-full` behind the block, so dark mode reads as it ships. */
function Page({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: theme.colors.background,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      {children}
    </View>
  );
}

/** The template: breadcrumb, header, and August 2026 with Figma's events. Press a chip, the inbox, or the month title. */
export const Demo: Story = {
  render: () => (
    <Page>
      <CalendarView
        testID="calendar"
        defaultMonth={AUGUST}
        events={EVENTS}
        breadcrumb={BREADCRUMB}
        inboxAccounts={FEEDS}
        gmtLabel="GMT+2"
        onNewEvent={() => {}}
        onMenuPress={() => {}}
      />
    </Page>
  ),
};

/** No breadcrumb, no inbox — the smallest header. */
export const Minimal: Story = {
  render: () => (
    <Page>
      <CalendarView defaultMonth={AUGUST} events={EVENTS} headingLevel={2} />
    </Page>
  ),
};

/** `compact` pins the day cards to 76px for embedded previews. */
export const Compact: Story = {
  render: () => (
    <Page>
      <CalendarView defaultMonth={AUGUST} events={EVENTS} inboxAccounts={FEEDS} compact headingLevel={2} />
    </Page>
  ),
};

/** A month with nothing in it. */
export const EmptyMonth: Story = {
  render: () => (
    <Page>
      <CalendarView defaultMonth={day(2, 1)} events={[]} headingLevel={2} />
    </Page>
  ),
};

/** The grid alone, with August 20 pulsing (press "Pulse again" to replay). */
export const Highlight: Story = {
  render: function Render() {
    const [highlighted, setHighlighted] = useState<Date | null>(day(8, 20));
    return (
      <Page>
        <View style={{ gap: 12 }}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Button variant="secondary" size="small" onPress={() => setHighlighted(new Date(day(8, 20)))}>
              Pulse again
            </Button>
          </View>
          <CalendarViewMonthGrid
            testID="grid"
            month={AUGUST}
            events={EVENTS}
            highlightedDate={highlighted}
            onHighlightEnd={() => setHighlighted(null)}
          />
        </View>
      </Page>
    );
  },
};

/** The month switcher closed; press the title to enlarge it into a day grid. */
export const MonthSwitcher: Story = {
  render: function Render() {
    const [month, setMonth] = useState(AUGUST);
    const [picked, setPicked] = useState<Date | null>(null);
    return (
      <Page>
        <View style={{ padding: 40, height: 460, gap: 12 }}>
          <CalendarViewMonthSwitcher
            testID="switcher"
            month={month}
            onPreviousMonth={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onNextMonth={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            onSelectDate={setPicked}
          />
          <View style={{ height: 380 }} />
          <Text variant="body-medium">{picked ? `Picked ${picked.toDateString()}` : 'Nothing picked'}</Text>
        </View>
      </Page>
    );
  },
};

/** The inbox button; press it for the subscribed-feeds panel. */
export const InboxMenu: Story = {
  render: () => (
    <Page>
      <View style={{ padding: 40, paddingLeft: 320, height: 560 }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <CalendarViewInboxMenu testID="inbox" accounts={FEEDS} />
        </View>
      </View>
    </Page>
  ),
};

/** The details panel standalone: Figma's example, a timed event with only a time, and an all-day event. */
export const EventDetails: Story = {
  render: () => (
    <Page>
      <View
        style={{
          padding: 40,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <CalendarViewEventDetails testID="details" event={BIRTHDAY} gmtLabel="GMT+2" />
        <CalendarViewEventDetails
          event={{
            id: 'retro',
            date: day(8, 14),
            title: 'Retro',
            time: '15:00',
            endTime: '16:15',
            color: 'blue',
          }}
        />
        <CalendarViewEventDetails
          event={{
            id: 'holidays',
            date: day(8, 11),
            title: 'Holidays',
            color: 'emerald',
          }}
        />
      </View>
    </Page>
  ),
};
