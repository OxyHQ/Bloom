import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import { compactDuration } from './message-helpers';

/**
 * Every fixed string the calendar family draws or announces, in each Bloom
 * language. Month titles, weekday names and the event date come from `Intl`
 * (`formatGregorian`) instead; `newEventLabel`, `addAccountLabel` and the
 * inbox's `accessibilityLabel` props still win over their entries here.
 */
export interface CalendarMessages {
  newEvent: string;
  /** The header's hamburger below `lg`. */
  openNavigation: string;
  /** The month grid's table name. */
  month: string;
  /** A day card's overflow line: "+2 more". */
  moreEvents: (hidden: number) => string;
  /** The details popover's name. */
  eventDetails: string;
  /** The meeting row's button. */
  join: string;
  editTimeZone: string;
  participants: string;
  editParticipants: string;
  reminders: string;
  editReminders: string;
  /** The duration chip: `3h`, `45m`, `1h15m` in English. */
  duration: (hours: number, minutes: number) => string;
  /** The month switcher's expanded grid. */
  jumpToDate: string;
  previousMonth: string;
  nextMonth: string;
  /** The month switcher's title button: "August 2026, choose a date". */
  chooseDate: (monthTitle: string) => string;
  /** The inbox menu's trigger, panel and footer button. */
  inbox: string;
  inboxMenu: string;
  addAccount: string;
}

export const CALENDAR_MESSAGES: MessageCatalog<CalendarMessages> = defineMessages<CalendarMessages>('CALENDAR_MESSAGES', {
  newEvent: 'New event',
  openNavigation: 'Open navigation',
  month: 'Month',
  moreEvents: (n) => plural('en', n, { other: '+{n} more' }),
  eventDetails: 'Event details',
  join: 'Join',
  editTimeZone: 'Edit timezone',
  participants: 'Participants',
  editParticipants: 'Edit participants',
  reminders: 'Reminders',
  editReminders: 'Edit reminders',
  duration: compactDuration('h', 'm', ''),
  jumpToDate: 'Jump to date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  chooseDate: (month) => `${month}, choose a date`,
  inbox: 'Inbox',
  inboxMenu: 'Inbox menu',
  addAccount: 'Add new account',
});
