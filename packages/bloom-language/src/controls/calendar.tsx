import {
  CalendarView as BloomCalendarView,
  type CalendarViewEvent,
  CalendarViewHeader as BloomCalendarViewHeader,
  type CalendarViewHeaderProps,
  CalendarViewMonthGrid as BloomCalendarViewMonthGrid,
  type CalendarViewMonthGridProps,
  type CalendarViewProps,
} from '@oxy.so/bloom/calendar';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** The month calendar: the whole view, its header and its grid of days. */
export type CalendarViewKind = 'calendarView' | 'calendarViewHeader' | 'calendarViewMonthGrid';

type Drawn = 'style' | 'testID';
type HeaderSlots = 'breadcrumb' | 'actions';
type HeaderOptions<P> = Omit<P, Drawn | HeaderSlots | 'monthSwitcherWidth'> & {
  readonly [K in HeaderSlots]?: Child;
} & {
  /** The month switcher's width at `sm` and up: a space token (Bloom's 320 with none). */
  readonly monthSwitcherWidth?: SpaceToken;
};
/**
 * Bloom `CalendarView`'s data: the shown month (controlled or not) and its
 * handlers, the header's words, feeds and actions; `breadcrumb` and `actions`
 * are views.
 */
export type CalendarViewOptions = HeaderOptions<Omit<CalendarViewProps, 'events' | 'compact'>>;
/** Bloom `CalendarViewHeader`'s handlers and words; `breadcrumb` and `actions` are views. */
export type CalendarViewHeaderOptions = HeaderOptions<Omit<CalendarViewHeaderProps, 'month'>>;
/** Bloom `CalendarViewMonthGrid`'s handlers, its highlighted day and its details panel. */
export type CalendarViewMonthGridOptions = Omit<
  CalendarViewMonthGridProps,
  Drawn | 'month' | 'events' | 'compact'
>;

/** Bloom `CalendarView`. */
export interface CalendarViewView extends ViewModifiers<CalendarViewView> {
  /** `compact`: short fixed day rows for an embedded preview; `default`: rows that answer the width. */
  density(value: ControlDensity): CalendarViewView;
}
/** Bloom `CalendarViewHeader`: the month's title, its switcher and the actions. */
export type CalendarViewHeaderView = ViewModifiers<CalendarViewHeaderView>;
/** Bloom `CalendarViewMonthGrid`: six Sunday-first weeks and their events. */
export interface CalendarViewMonthGridView extends ViewModifiers<CalendarViewMonthGridView> {
  density(value: ControlDensity): CalendarViewMonthGridView;
}

/** Bloom `CalendarView` of `events` (Bloom's `CalendarViewEvent`s). */
export function CalendarView(
  events: readonly CalendarViewEvent[],
  options: CalendarViewOptions = {},
): CalendarViewView {
  return new Node('calendarView', { events, options }, []);
}
/** Bloom `CalendarViewHeader` of `month` (any day of it). */
export function CalendarViewHeader(
  month: Date,
  options: CalendarViewHeaderOptions,
): CalendarViewHeaderView {
  return new Node('calendarViewHeader', { month, options }, []);
}
/** Bloom `CalendarViewMonthGrid` of `month` (any day of it) and its `events`. */
export function CalendarViewMonthGrid(
  month: Date,
  events: readonly CalendarViewEvent[],
  options: CalendarViewMonthGridOptions = {},
): CalendarViewMonthGridView {
  return new Node('calendarViewMonthGrid', { month, events, options }, []);
}

/** Bloom's `compact` flag from the node's density. */
const compact = (d: ControlDraw) => {
  const density = d.own('density')?.value;
  return density === undefined ? undefined : density === 'compact';
};
const header = { slots: ['breadcrumb', 'actions'], lengths: ['monthSwitcherWidth'] } as const;

export const CALENDAR_VIEWS: Record<CalendarViewKind, ControlRenderer> = {
  calendarView: product(BloomCalendarView, { ...header, own: (d) => ({ compact: compact(d) }) }),
  calendarViewHeader: product(BloomCalendarViewHeader, header),
  calendarViewMonthGrid: product(BloomCalendarViewMonthGrid, {
    own: (d) => ({ compact: compact(d) }),
  }),
};
