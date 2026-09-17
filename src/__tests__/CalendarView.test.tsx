import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  CalendarView,
  CalendarViewEventDetails,
  CalendarViewHeader,
  CalendarViewMonthGrid,
  CalendarViewMonthSwitcher,
} from '../calendar';
import type { CalendarViewEvent } from '../calendar';
import { createHueResolver, eventChipColors, feedSwatchColors } from '../calendar/palette';
import { durationLabel, sixWeekGrid, visibleEvents } from '../calendar/shared';
import { oklchToSrgb } from '../theme/color-space';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const day = (month: number, date: number) => new Date(2026, month - 1, date);
const iso = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const AUGUST = day(8, 1);
/** A day cell's card: the cell's first child (no highlight ring is showing). */
const cardOf = (cell: ReactTestInstance) => cell.children[0] as ReactTestInstance;

/** Jest's window is phone-sized; these layouts key off the viewport width. */
let viewportWidth = 1300;
beforeEach(() => {
  viewportWidth = 1300;
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockImplementation(() => ({ ...ReactNative.Dimensions.get('window'), width: viewportWidth }));
});
afterEach(() => jest.restoreAllMocks());

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="blue">
      {ui}
    </BloomThemeProvider>,
  );
}

const BUSY_DAY: CalendarViewEvent[] = [
  { id: 'a', date: day(8, 20), title: 'Design review', time: '09:30', color: 'blue' },
  { id: 'b', date: day(8, 20), title: 'Client call', time: '10:15', color: 'emerald' },
  { id: 'c', date: day(8, 20), title: 'Team lunch', time: '13:00', color: 'purple' },
  { id: 'd', date: day(8, 20), title: 'Stand-up', time: '11:30', color: 'pink' },
  { id: 'e', date: day(8, 20), title: '1:1 sync', time: '16:30', color: 'lime' },
  { id: 'f', date: day(8, 20), title: 'Portfolio review', time: '14:30', color: 'blue' },
];

const BIRTHDAY: CalendarViewEvent = {
  id: 'birthday',
  date: day(8, 11),
  title: 'Birthday night at Bacalar’s',
  time: '20:30',
  endTime: '23:30',
  color: 'purple',
  meeting: { label: 'Google Meet', code: 'igc-mfrq-sse' },
  timeZone: 'Amsterdam',
  participants: [
    { email: 'hi@example.com', initials: 'M' },
    { email: 'sam.rivera@example.com', initials: 'S', color: 'lime' },
  ],
  reminder: '2h before',
};

describe('calendar view: date and event maths', () => {
  it('always lays a month out as six Sunday-first weeks', () => {
    // February 2026 starts on a Sunday and needs only four rows of its own.
    const february = sixWeekGrid(day(2, 1));
    expect(february).toHaveLength(42);
    expect(iso(february[0]!.date)).toBe('2026-2-1');
    expect(february.filter((d) => d.inMonth)).toHaveLength(28);
    expect(iso(february[41]!.date)).toBe('2026-3-14');

    const august = sixWeekGrid(AUGUST);
    expect(august).toHaveLength(42);
    expect(iso(august[0]!.date)).toBe('2026-7-26');
    expect(iso(august[41]!.date)).toBe('2026-9-5');
  });

  it('shows the last four of more than three events and counts the rest', () => {
    expect(visibleEvents(BUSY_DAY.slice(0, 3))).toEqual({ visible: BUSY_DAY.slice(0, 3), hidden: 0 });
    const { visible, hidden } = visibleEvents(BUSY_DAY);
    expect(hidden).toBe(2);
    expect(visible.map((e) => e.id)).toEqual(['c', 'd', 'e', 'f']);
  });

  it('prints the duration chip', () => {
    expect(durationLabel('20:30', '23:30')).toBe('3h');
    expect(durationLabel('15:00', '16:15')).toBe('1h15m');
    expect(durationLabel('09:00', '09:45')).toBe('45m');
    expect(durationLabel('23:30', '00:15')).toBe('45m');
  });

  it("reproduces Tailwind's stops on Bloom's own accent, and turns them with another primary", () => {
    // Tailwind's blue-500, Bloom's accent: every hue lands on its own Tailwind
    // stop (within the sRGB gamut walk's rounding).
    const defaultHue = createHueResolver('rgb(43 127 255)');
    const tailwind = (l: number, c: number, h: number) => oklchToSrgb({ l, c, h });
    const channels = (color: string) => color.match(/\d+/g)!.slice(0, 3).map(Number);
    const near = (actual: string, expected: { r: number; g: number; b: number }) =>
      channels(actual).forEach((value, index) =>
        expect(Math.abs(value - [expected.r, expected.g, expected.b][index]!)).toBeLessThanOrEqual(6),
      );
    const lime = eventChipColors(defaultHue, 'lime', false);
    near(lime.background, tailwind(0.967, 0.067, 122.328)); // lime-100
    near(lime.title, tailwind(0.453, 0.124, 130.933)); // lime-800
    near(lime.time, tailwind(0.532, 0.157, 131.589)); // lime-700
    // Dark: `*-950` surface, `*-300` title and time.
    const dark = eventChipColors(defaultHue, 'lime', true);
    expect(dark.title).toBe(dark.time);
    // The inbox's blue swatch icon is `blue-900`, every other hue `*-700`.
    expect(feedSwatchColors(defaultHue, 'blue').icon).toBe(defaultHue('blue', 900));
    expect(feedSwatchColors(defaultHue, 'red').icon).toBe(defaultHue('red', 700));

    const teal = createHueResolver('rgb(20 150 140)');
    expect(teal('blue', 100)).not.toBe(defaultHue('blue', 100));
  });
});

describe('CalendarViewMonthGrid', () => {
  it('renders 42 day cells under 7 named weekday headers', () => {
    const { getAllByTestId, getByLabelText } = renderWithTheme(
      <CalendarViewMonthGrid testID="grid" month={AUGUST} events={[]} locale="en-US" />,
    );
    expect(getAllByTestId(/^grid-day-[\d-]+$/)).toHaveLength(42);
    for (const name of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      expect(getByLabelText(name).props.role).toBe('columnheader');
    }
  });

  it('shows "+2 more" over the last four chips of a busy day', () => {
    const { getByTestId } = renderWithTheme(
      <CalendarViewMonthGrid testID="grid" month={AUGUST} events={BUSY_DAY} />,
    );
    const cell = within(getByTestId('grid-day-2026-7-20'));
    expect(cell.getByText('+2 more')).toBeTruthy();
    expect(cell.getAllByTestId(/-event-/).map((b) => b.props.accessibilityLabel)).toEqual([
      'Stand-up, 11:30',
      'Team lunch, 13:00',
      'Portfolio review, 14:30',
      '1:1 sync, 16:30',
    ]);
  });

  it('keeps the chip and card geometry at sm, in longhands', () => {
    const { getByTestId } = renderWithTheme(
      <CalendarViewMonthGrid testID="grid" month={AUGUST} events={BUSY_DAY} />,
    );
    const chip = resolvedStyle(getByTestId('grid-day-2026-7-20-event-d').props.style);
    expect(chip).toMatchObject({ borderRadius: 6, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, gap: 4 });
    expect(chip.paddingHorizontal).toBeUndefined();
    const card = cardOf(getByTestId('grid-day-2026-7-20'));
    // 1300px: Tailwind `xl`, so min 128 and radius 12.
    expect(resolvedStyle(card.props.style)).toMatchObject({ borderRadius: 12, minHeight: 128 });
  });

  it('draws the dense lattice below sm, every row as tall as the tallest', () => {
    viewportWidth = 390;
    {
      const { getByTestId } = renderWithTheme(
        <CalendarViewMonthGrid testID="grid" month={AUGUST} events={BUSY_DAY} />,
      );
      const busy = getByTestId('grid-day-2026-7-20');
      expect(resolvedStyle(busy.props.style)).toMatchObject({ borderRightWidth: 1, borderBottomWidth: 1 });
      // 22 number line + 12 label + 4×16 chips + 4×2 gaps + 4 inset = 110.
      const quiet = cardOf(getByTestId('grid-day-2026-7-3'));
      expect(resolvedStyle(quiet.props.style)).toMatchObject({ borderRadius: 0, minHeight: 110 });
      // Saturday column: no right hairline. Last row: no bottom one.
      expect(resolvedStyle(getByTestId('grid-day-2026-8-5').props.style)).toMatchObject({
        borderRightWidth: 0,
        borderBottomWidth: 0,
      });
      const chip = resolvedStyle(getByTestId('grid-day-2026-7-20-event-d').props.style);
      expect(chip).toMatchObject({ borderRadius: 4, paddingLeft: 4, gap: 2 });
    }
  });

  it('reports the pressed event', () => {
    const onSelectEvent = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CalendarViewMonthGrid testID="grid" month={AUGUST} events={BUSY_DAY} onSelectEvent={onSelectEvent} />,
    );
    pressHost(getByTestId('grid-day-2026-7-20-event-f'));
    expect(onSelectEvent).toHaveBeenCalledWith(BUSY_DAY[5]);
  });
});

describe('CalendarViewEventDetails', () => {
  it('shows only the title block for an all-day event', () => {
    const { getByRole, queryByText, queryAllByRole } = renderWithTheme(
      <CalendarViewEventDetails event={{ id: 'h', date: day(8, 11), title: 'Holidays', color: 'emerald' }} locale="en-US" />,
    );
    expect(getByRole('heading').props.children).toBe('Holidays');
    expect(queryByText('Tue, Aug 11')).toBeTruthy();
    expect(queryAllByRole('button')).toHaveLength(0);
  });

  it("renders Figma's example rows and wires every action", () => {
    const handlers = {
      onJoinMeeting: jest.fn(),
      onEditTimeZone: jest.fn(),
      onEditParticipants: jest.fn(),
      onEditReminders: jest.fn(),
    };
    const { getByText, getByLabelText } = renderWithTheme(
      <CalendarViewEventDetails event={BIRTHDAY} gmtLabel="GMT+2" locale="en-US" {...handlers} />,
    );
    expect(getByText('igc-mfrq-sse')).toBeTruthy();
    expect(getByText('3h')).toBeTruthy();
    expect(getByText('GMT+2')).toBeTruthy();
    expect(getByText('sam.rivera@example.com')).toBeTruthy();
    expect(getByText('Reminders')).toBeTruthy();

    fireEvent.press(getByText('Join'));
    expect(handlers.onJoinMeeting).toHaveBeenCalledWith(BIRTHDAY);
    fireEvent.press(getByLabelText('Edit timezone'));
    fireEvent.press(getByLabelText('Edit participants'));
    fireEvent.press(getByLabelText('Edit reminders'));
    expect(handlers.onEditTimeZone).toHaveBeenCalledWith(BIRTHDAY);
    expect(handlers.onEditParticipants).toHaveBeenCalledWith(BIRTHDAY);
    expect(handlers.onEditReminders).toHaveBeenCalledWith(BIRTHDAY);
  });

  it('keeps the panel chrome by default, and drops it when bare', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <CalendarViewEventDetails testID="panel" event={BIRTHDAY} />,
    );
    expect(resolvedStyle(getByTestId('panel').props.style)).toMatchObject({
      width: 302,
      borderRadius: 20,
      borderWidth: 1,
      paddingTop: 10,
      paddingLeft: 10,
      gap: 10,
    });
    rerender(
      <BloomThemeProvider mode="light" colorPreset="blue">
        <CalendarViewEventDetails testID="panel" event={BIRTHDAY} bare />
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(getByTestId('panel').props.style).borderWidth).toBeUndefined();
  });
});

describe('CalendarViewMonthSwitcher and header', () => {
  it('pages months from its chevrons and grows into a day grid from its title', () => {
    const onPreviousMonth = jest.fn();
    const onNextMonth = jest.fn();
    const onSelectDate = jest.fn();
    const { getByLabelText, getByTestId, queryByLabelText } = renderWithTheme(
      <CalendarViewMonthSwitcher
        testID="switcher"
        month={AUGUST}
        locale="en-US"
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
        onSelectDate={onSelectDate}
      />,
    );
    pressHost(getByLabelText('Previous month'));
    pressHost(getByLabelText('Next month'));
    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);

    expect(queryByLabelText('Jump to date')).toBeNull();
    const title = getByTestId('switcher-title');
    expect(title.props.accessibilityState?.expanded ?? title.props['aria-expanded']).toBe(false);
    pressHost(title);
    const grid = getByLabelText('Jump to date');
    expect(grid.props.role).toBe('grid');
    pressHost(within(grid).getByLabelText('Thursday, August 20, 2026'));
    expect(iso(onSelectDate.mock.calls[0]![0])).toBe('2026-8-20');
  });

  it('titles the month at the heading level asked for', () => {
    const { getByRole } = renderWithTheme(
      <CalendarViewHeader
        month={AUGUST}
        locale="en-US"
        headingLevel={2}
        onPreviousMonth={() => {}}
        onNextMonth={() => {}}
        onSelectDate={() => {}}
      />,
    );
    const heading = getByRole('heading');
    expect(heading.props['aria-level']).toBe(2);
    expect(heading.props.children).toBe('August 2026');
  });

  it('owns the month: the chevrons move the title and report the new month', () => {
    const onMonthChange = jest.fn();
    const { getByRole, getByLabelText } = renderWithTheme(
      <CalendarView defaultMonth={day(8, 17)} events={[]} locale="en-US" onMonthChange={onMonthChange} />,
    );
    expect(getByRole('heading').props.children).toBe('August 2026');
    pressHost(getByLabelText('Next month'));
    expect(getByRole('heading').props.children).toBe('September 2026');
    expect(iso(onMonthChange.mock.calls[0]![0])).toBe('2026-9-1');
  });
});
