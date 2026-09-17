import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/** The five event tints (`--color-calendar-event-*`). */
export type CalendarViewEventColor = 'blue' | 'pink' | 'purple' | 'lime' | 'emerald';

/** The initials-avatar tints `Avatar` ships. */
export type CalendarViewParticipantColor = 'neutral' | 'blue' | 'lime' | 'pink';

/** A subscribed feed's swatch tint in the inbox menu. */
export type CalendarViewFeedColor = 'blue' | 'red' | 'lime' | 'purple' | 'teal' | 'pink';

export interface CalendarViewParticipant {
  email: string;
  /** One or two letters in the 20px initials avatar. */
  initials: string;
  /** Defaults to `'neutral'`. */
  color?: CalendarViewParticipantColor;
}

/** The video call row of the details panel ("Google Meet · igc-mfrq-sse · Join"). */
export interface CalendarViewMeeting {
  /** Provider name. */
  label: string;
  /** Meeting code, shown in the info chip. */
  code: string;
  /** 20px provider mark, drawn before the label. */
  icon?: ReactNode;
}

export interface CalendarViewEvent {
  /** Unique across the whole list. */
  id: string;
  /** The calendar day. The time of day is ignored — use `time`. */
  date: Date;
  title: string;
  /** 24h `HH:mm`. Omit for an all-day event: its details panel shows only the title row. */
  time?: string;
  /** 24h `HH:mm`. With `time`, the details panel shows the range and its duration. */
  endTime?: string;
  color: CalendarViewEventColor;
  /** Cover image above the details rows (99px tall, radius 10). */
  image?: ImageSourcePropType;
  meeting?: CalendarViewMeeting;
  /** City shown after the GMT offset, e.g. `'Amsterdam'`. Shows the timezone row. */
  timeZone?: string;
  participants?: CalendarViewParticipant[];
  /** e.g. `'2h before'`. Shows the reminders row. */
  reminder?: string;
}

export interface CalendarViewFeed {
  id: string;
  label: string;
  color: CalendarViewFeedColor;
}

export interface CalendarViewFeedAccount {
  /** Group heading, normally the account's email. */
  email: string;
  feeds: CalendarViewFeed[];
}

export interface CalendarViewEventDetailsProps {
  event: CalendarViewEvent;
  /** BCP 47 locale for the date line. Defaults to the runtime's. */
  locale?: string;
  /**
   * The `GMT±N` label in the timezone row. Defaults to the runtime's current
   * offset.
   */
  gmtLabel?: string;
  onJoinMeeting?: (event: CalendarViewEvent) => void;
  onEditTimeZone?: (event: CalendarViewEvent) => void;
  onEditParticipants?: (event: CalendarViewEvent) => void;
  onEditReminders?: (event: CalendarViewEvent) => void;
  /** Drop the panel's own card chrome, for a surface that brings its own (a sheet). */
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The details panel's callbacks, forwarded by the grid and the block. */
export type CalendarViewEventDetailsHandlers = Pick<
  CalendarViewEventDetailsProps,
  'gmtLabel' | 'onJoinMeeting' | 'onEditTimeZone' | 'onEditParticipants' | 'onEditReminders'
>;

export interface CalendarViewMonthGridProps extends CalendarViewEventDetailsHandlers {
  /** Any day of the month to show. The grid is always 6 Sunday-first weeks. */
  month: Date;
  events: readonly CalendarViewEvent[];
  /**
   * Pulses this day's ring for ~3s, then calls `onHighlightEnd`. A transient
   * "you jumped here" cue, not a selection.
   */
  highlightedDate?: Date | null;
  onHighlightEnd?: () => void;
  /** Short fixed day rows (76px) for embedded previews instead of the width-responsive ones. */
  compact?: boolean;
  /**
   * Called when an event chip is pressed. The details panel opens beside the day
   * regardless; set `showEventDetails={false}` to handle the press yourself.
   */
  onSelectEvent?: (event: CalendarViewEvent) => void;
  /** Defaults to `true`. */
  showEventDetails?: boolean;
  locale?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CalendarViewMonthSwitcherProps {
  /** Any day of the shown month. */
  month: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  /** A day picked in the expanded grid. The panel closes after it. */
  onSelectDate: (date: Date) => void;
  /** Closed and open width at `sm`+. Defaults to `320`. */
  width?: number;
  locale?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CalendarViewInboxMenuProps {
  accounts: readonly CalendarViewFeedAccount[];
  onSelectFeed?: (feed: CalendarViewFeed, account: CalendarViewFeedAccount) => void;
  onAddAccount?: () => void;
  /** Defaults to `'Add new account'`. */
  addAccountLabel?: string;
  /** Names the trigger. Defaults to `'Inbox'`. */
  accessibilityLabel?: string;
  testID?: string;
}

export interface CalendarViewHeaderProps {
  month: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  /** The title. Defaults to the month and year (`August 2026`). */
  title?: string;
  /** Rendered above the title row — normally a `Breadcrumb`. */
  breadcrumb?: ReactNode;
  /** Rendered first in the actions row, before the inbox (e.g. a notifications button). */
  actions?: ReactNode;
  /** Feeds for the inbox menu. Omit to hide the inbox button. */
  inboxAccounts?: readonly CalendarViewFeedAccount[];
  onSelectFeed?: CalendarViewInboxMenuProps['onSelectFeed'];
  onAddAccount?: () => void;
  onNewEvent?: () => void;
  /** Defaults to `'New event'`. */
  newEventLabel?: string;
  /** Shows the "Open navigation" menu button below the `lg` breakpoint. */
  onMenuPress?: () => void;
  monthSwitcherWidth?: number;
  /**
   * Heading level of the title. Defaults to `1` (the month IS the page title);
   * use 2+ when the calendar is embedded in a page that has its own `h1`.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  locale?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CalendarViewProps
  extends
    Omit<CalendarViewHeaderProps, 'month' | 'onPreviousMonth' | 'onNextMonth' | 'onSelectDate'>,
    CalendarViewEventDetailsHandlers {
  events: readonly CalendarViewEvent[];
  /** The shown month (controlled). Any day of it. */
  month?: Date;
  /** The initially shown month (uncontrolled). Defaults to today's. */
  defaultMonth?: Date;
  /** Called with the first day of the newly shown month. */
  onMonthChange?: (month: Date) => void;
  onSelectEvent?: (event: CalendarViewEvent) => void;
  compact?: boolean;
}
