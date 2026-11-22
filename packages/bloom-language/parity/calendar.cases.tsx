import {
  CalendarView,
  type CalendarViewEvent,
  CalendarViewHeader,
  CalendarViewMonthGrid,
} from '@oxy.so/bloom/calendar';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const pick = (_date: Date) => {};
/** A fixed month, so both sides draw the same days whatever today is. */
const MONTH = new Date(2026, 7, 12);
const EVENTS: CalendarViewEvent[] = [
  { id: 'e1', date: new Date(2026, 7, 3), title: 'Check-in', time: '15:00', color: 'blue' },
  {
    id: 'e2',
    date: new Date(2026, 7, 3),
    title: 'Cleaning',
    time: '11:00',
    endTime: '12:30',
    color: 'emerald',
  },
  { id: 'e3', date: new Date(2026, 7, 14), title: 'Blocked', color: 'pink' },
  { id: 'e4', date: new Date(2026, 7, 27), title: 'Check-out', time: '10:00', color: 'purple' },
];
const ACCOUNTS = [
  {
    email: 'host@example.com',
    feeds: [
      { id: 'f1', label: 'Bookings', color: 'blue' as const },
      { id: 'f2', label: 'Holidays', color: 'lime' as const },
    ],
  },
];
const HANDLERS = { onPreviousMonth: press, onNextMonth: press, onSelectDate: pick };

export const CALENDAR_CASES: ParityCase[] = [
  {
    name: 'CalendarView a month',
    language: () => toElement(L.CalendarView(EVENTS, { month: MONTH, locale: 'en-US' })),
    bloom: () => <CalendarView events={EVENTS} month={MONTH} locale="en-US" />,
  },
  ...ENUMS.density.map((density) => ({
    name: `CalendarView ${density}, its header's parts`,
    language: () =>
      toElement(
        L.CalendarView(EVENTS, {
          month: MONTH,
          locale: 'en-US',
          title: 'Bookings',
          breadcrumb: L.Text('Host › Calendar'),
          actions: L.Button(L.Text('Share')).size('sm'),
          inboxAccounts: ACCOUNTS,
          onNewEvent: press,
          newEventLabel: 'Block dates',
          onMenuPress: press,
          monthSwitcherWidth: '64',
          headingLevel: 2,
        }).density(density),
      ),
    bloom: () => (
      <CalendarView
        events={EVENTS}
        month={MONTH}
        locale="en-US"
        title="Bookings"
        breadcrumb={<Text>Host › Calendar</Text>}
        actions={toElement(L.Button(L.Text('Share')).size('sm'))}
        inboxAccounts={ACCOUNTS}
        onNewEvent={press}
        newEventLabel="Block dates"
        onMenuPress={press}
        monthSwitcherWidth={64}
        headingLevel={2}
        compact={density === 'compact'}
      />
    ),
  })),
  {
    name: 'CalendarViewHeader',
    language: () => toElement(L.CalendarViewHeader(MONTH, { ...HANDLERS, locale: 'en-US' })),
    bloom: () => <CalendarViewHeader month={MONTH} {...HANDLERS} locale="en-US" />,
  },
  {
    name: 'CalendarViewHeader its actions, a new event, heading level 2',
    language: () =>
      toElement(
        L.CalendarViewHeader(MONTH, {
          ...HANDLERS,
          locale: 'en-US',
          headingLevel: 2,
          onNewEvent: press,
          newEventLabel: 'Block dates',
          actions: L.Text('Legend'),
        }),
      ),
    bloom: () => (
      <CalendarViewHeader
        month={MONTH}
        {...HANDLERS}
        locale="en-US"
        headingLevel={2}
        onNewEvent={press}
        newEventLabel="Block dates"
        actions={<Text>Legend</Text>}
      />
    ),
  },
  ...ENUMS.density.map((density) => ({
    name: `CalendarViewMonthGrid ${density}, no details panel`,
    language: () =>
      toElement(
        L.CalendarViewMonthGrid(MONTH, EVENTS, {
          locale: 'en-US',
          showEventDetails: false,
          onSelectEvent: press,
        }).density(density),
      ),
    bloom: () => (
      <CalendarViewMonthGrid
        month={MONTH}
        events={EVENTS}
        locale="en-US"
        showEventDetails={false}
        onSelectEvent={press}
        compact={density === 'compact'}
      />
    ),
  })),
];

/** A highlighted day's ring pulses on a timer: Jest compares it as it mounts, the story leaves it out. */
export const CALENDAR_CASES_MOVING: ParityCase[] = [
  {
    name: 'CalendarViewMonthGrid a highlighted day',
    language: () =>
      toElement(
        L.CalendarViewMonthGrid(MONTH, EVENTS, {
          locale: 'en-US',
          highlightedDate: new Date(2026, 7, 14),
          onHighlightEnd: press,
        }),
      ),
    bloom: () => (
      <CalendarViewMonthGrid
        month={MONTH}
        events={EVENTS}
        locale="en-US"
        highlightedDate={new Date(2026, 7, 14)}
        onHighlightEnd={press}
      />
    ),
  },
];
