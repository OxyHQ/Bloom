import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Calendar, DatePicker, RangeCalendar } from '../date-picker';
import {
  addMonths,
  buildMonthGrid,
  dayCellPaint,
  daysInRange,
  formatChipDate,
  isDateDisabled,
  moveFocusedDate,
  normalizeRange,
  parseChipDate,
  quickSelectPresets,
  rangeCellState,
  singleCellState,
  weekdayLabels,
} from '../date-picker/calendar-grid';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const day = (d: number, month = 8, year = 2026) => new Date(year, month, d);
const iso = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('calendar grid: month layout', () => {
  it('lays September 2026 out Sunday-first: 2 leading days, 5 rows, 3 trailing', () => {
    const weeks = buildMonthGrid(day(16));
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    const flat = weeks.flat();
    expect(flat.slice(0, 2).map((d) => [iso(d.date), d.inMonth])).toEqual([
      ['2026-8-30', false],
      ['2026-8-31', false],
    ]);
    expect(iso(flat[2]!.date)).toBe('2026-9-1');
    expect(flat.filter((d) => d.inMonth)).toHaveLength(30);
    expect(flat.slice(-3).map((d) => [iso(d.date), d.inMonth])).toEqual([
      ['2026-10-1', false],
      ['2026-10-2', false],
      ['2026-10-3', false],
    ]);
  });

  it('shifts the leading days with weekStartsOn', () => {
    // September 1, 2026 is a Tuesday: 1 leading day Monday-first, 0 Tuesday-first.
    expect(buildMonthGrid(day(1), 1)[0]!.filter((d) => !d.inMonth)).toHaveLength(1);
    expect(buildMonthGrid(day(1), 2)[0]![0]!.inMonth).toBe(true);
    expect(weekdayLabels(1, 'en-US').map((w) => w.short)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  });

  it('needs 4 rows for a February that starts on the week start and 6 for a long spill', () => {
    // February 2026 starts on a Sunday and has 28 days.
    expect(buildMonthGrid(new Date(2026, 1, 10))).toHaveLength(4);
    // August 2026 starts on a Saturday: 6 leading + 31 days = 37 → 6 rows.
    expect(buildMonthGrid(new Date(2026, 7, 10))).toHaveLength(6);
  });

  it('clamps month arithmetic into the target month', () => {
    expect(iso(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-2-28');
    expect(iso(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-2-29');
  });
});

describe('calendar grid: selection and constraints', () => {
  it('marks one selected day as its own start and end', () => {
    expect(singleCellState(day(16), day(16))).toEqual({
      isSelected: true,
      isSelectionStart: true,
      isSelectionEnd: true,
    });
    expect(singleCellState(day(15), day(16)).isSelected).toBe(false);
  });

  it('marks a range inclusively, and normalizes reversed ends', () => {
    const range = normalizeRange(day(22), day(9));
    expect([iso(range.start), iso(range.end)]).toEqual(['2026-9-9', '2026-9-22']);
    expect(rangeCellState(day(9), range)).toMatchObject({ isSelected: true, isSelectionStart: true, isSelectionEnd: false });
    expect(rangeCellState(day(15), range)).toMatchObject({ isSelected: true, isSelectionStart: false });
    expect(rangeCellState(day(23), range).isSelected).toBe(false);
    expect(daysInRange(range)).toBe(14);
    expect(daysInRange({ start: day(9), end: day(9) })).toBe(1);
  });

  it('bridges the band 6px toward selected neighbours, rounding at row ends', () => {
    const range = { start: day(9), end: day(22) };
    // Wednesday 9th, column 3: range start — band covers the inner half.
    const start = dayCellPaint(rangeCellState(day(9), range), 3, true, 32);
    expect(start.band).toMatchObject({ visible: true, left: 16, right: -6 });
    expect(start.edge).toMatchObject({ visible: true, roundLeft: true, roundRight: false });
    // Sunday 13th, column 0: no left neighbour, so it rounds instead of bridging.
    const sunday = dayCellPaint(rangeCellState(day(13), range), 0, true, 32);
    expect(sunday.band).toMatchObject({ left: 0, right: -6, roundLeft: true, roundRight: false });
    expect(sunday.edge.visible).toBe(false);
    // Saturday 19th, column 6.
    expect(dayCellPaint(rangeCellState(day(19), range), 6, true, 32).band).toMatchObject({
      left: -6,
      right: 0,
      roundRight: true,
    });
    // A single selected day is one rounded pill with no band.
    const single = dayCellPaint(singleCellState(day(16), day(16)), 3, false, 32);
    expect(single.band.visible).toBe(false);
    expect(single.edge).toEqual({ visible: true, roundLeft: true, roundRight: true });
  });

  it('disables days outside min/max and those the caller rejects', () => {
    const constraints = {
      minDate: day(3),
      maxDate: day(28),
      isDateUnavailable: (d: Date) => d.getDay() === 0,
    };
    expect(isDateDisabled(day(2), constraints)).toBe(true);
    expect(isDateDisabled(new Date(2026, 8, 3, 18), constraints)).toBe(false);
    expect(isDateDisabled(day(29), constraints)).toBe(true);
    expect(isDateDisabled(day(13), constraints)).toBe(true); // a Sunday
    expect(isDateDisabled(day(14), constraints)).toBe(false);
  });

  it('moves keyboard focus the react-aria way', () => {
    expect(iso(moveFocusedDate(day(30), 'ArrowRight')!)).toBe('2026-10-1');
    expect(iso(moveFocusedDate(day(3), 'ArrowUp')!)).toBe('2026-8-27');
    expect(iso(moveFocusedDate(day(16), 'Home')!)).toBe('2026-9-13');
    expect(iso(moveFocusedDate(day(16), 'End', 1)!)).toBe('2026-9-20');
    expect(iso(moveFocusedDate(new Date(2026, 0, 31), 'PageDown')!)).toBe('2026-2-28');
    expect(moveFocusedDate(day(16), 'Tab')).toBeNull();
  });

  it('round-trips the DD/MM/YYYY chip and rejects impossible days', () => {
    expect(formatChipDate(day(9))).toBe('09/09/2026');
    expect(iso(parseChipDate(' 9/9/2026 ')!)).toBe('2026-9-9');
    expect(parseChipDate('30/02/2026')).toBeNull();
    expect(parseChipDate('29/02/2024')).not.toBeNull();
    expect(parseChipDate('2026-09-09')).toBeNull();
  });

  it('builds the quick-select presets relative to today', () => {
    const presets = quickSelectPresets(day(16));
    const lastWeek = presets.find((p) => p.label === 'Last week')!.range;
    expect([iso(lastWeek.start), iso(lastWeek.end)]).toEqual(['2026-9-9', '2026-9-15']);
    const lastMonth = presets.find((p) => p.label === 'Last month')!.range;
    expect([iso(lastMonth.start), iso(lastMonth.end)]).toEqual(['2026-8-1', '2026-8-31']);
    const lastYear = presets.find((p) => p.label === 'Last year')!.range;
    expect([iso(lastYear.start), iso(lastYear.end)]).toEqual(['2025-1-1', '2025-12-31']);
  });
});

describe('Calendar', () => {
  it('renders the month, selects a day, and blocks disabled days', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = renderWithTheme(
      <Calendar defaultValue={day(16)} minDate={day(3)} onChange={onChange} testID="cal" />,
    );
    expect(getByText('September 2026')).toBeTruthy();
    const target = getByTestId('cal-month-0-day-20');
    expect(target.props.accessibilityLabel).toMatch(/September 20, 2026/);
    pressHost(target);
    expect(iso(onChange.mock.calls[0][0])).toBe('2026-9-20');

    const disabled = getByTestId('cal-month-0-day-2');
    expect(disabled.props.disabled).toBe(true);
    expect(disabled.props['aria-disabled']).toBe(true);
  });

  it('announces the selected day on its gridcell with both spellings, and keeps one tab stop', () => {
    const { getByTestId, UNSAFE_root } = renderWithTheme(
      <Calendar value={day(16)} testID="cal" />,
    );
    const button = getByTestId('cal-month-0-day-16');
    expect(button.props.tabIndex).toBe(0);
    expect(getByTestId('cal-month-0-day-17').props.tabIndex).toBe(-1);
    const selectedCells = UNSAFE_root.findAll(
      (node) => node.props.role === 'gridcell' && node.props['aria-selected'] === true && typeof node.type === 'string',
    );
    expect(selectedCells).toHaveLength(1);
    expect(selectedCells[0]!.props.accessibilityState).toEqual({ selected: true });
  });

  it('pages months with the chevrons', () => {
    const { getByLabelText, getByText } = renderWithTheme(<Calendar defaultValue={day(16)} />);
    pressHost(getByLabelText('Next month'));
    expect(getByText('October 2026')).toBeTruthy();
    pressHost(getByLabelText('Previous month'));
    pressHost(getByLabelText('Previous month'));
    expect(getByText('August 2026')).toBeTruthy();
  });

  it('disables the previous chevron when that month is wholly before minDate', () => {
    const { getByLabelText } = renderWithTheme(<Calendar defaultValue={day(16)} minDate={day(3)} />);
    expect(getByLabelText('Previous month').props.disabled).toBe(true);
    expect(getByLabelText('Next month').props.disabled).toBe(false);
  });
});

describe('RangeCalendar', () => {
  it('completes a range on the second press, in either order', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <RangeCalendar defaultMonth={day(1)} onChange={onChange} testID="range" />,
    );
    pressHost(getByTestId('range-month-0-day-22'));
    expect(onChange).not.toHaveBeenCalled();
    pressHost(getByTestId('range-month-0-day-9'));
    const range = onChange.mock.calls[0][0];
    expect([iso(range.start), iso(range.end)]).toEqual(['2026-9-9', '2026-9-22']);
  });

  it('shows two adjacent months with only the outer chevrons', () => {
    const { getByText, getAllByLabelText } = renderWithTheme(
      <RangeCalendar defaultValue={{ start: day(9), end: day(22) }} visibleMonths={2} />,
    );
    expect(getByText('September 2026')).toBeTruthy();
    expect(getByText('October 2026')).toBeTruthy();
    expect(getAllByLabelText('Previous month')).toHaveLength(1);
    expect(getAllByLabelText('Next month')).toHaveLength(1);
  });
});

describe('DatePicker', () => {
  it('shows the committed day on a 38px trigger and the placeholder without one', () => {
    const { getByText, rerender } = renderWithTheme(<DatePicker value={null} testID="dp" />);
    expect(getByText('Select date')).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <DatePicker value={day(16)} locale="en-US" testID="dp" />
      </BloomThemeProvider>,
    );
    expect(getByText('Sep 16, 2026')).toBeTruthy();
  });

  it('keeps the choice pending until Apply, and Cancel discards it', () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = renderWithTheme(
      <DatePicker defaultValue={day(16)} defaultOpen onChange={onChange} testID="dp" />,
    );
    const pick = queryByTestId('dp-calendar-month-0-day-20');
    expect(pick).not.toBeNull();
    pressHost(pick!);
    expect(onChange).not.toHaveBeenCalled();
    expect(resolvedStyle(getByTestId('dp-chip').props.style).width).toBe(104);
    act(() => {
      fireEvent.press(getByTestId('dp-apply'));
    });
    expect(iso(onChange.mock.calls[0][0])).toBe('2026-9-20');
  });

  it('Cancel discards the pending day', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <DatePicker defaultValue={day(16)} defaultOpen onChange={onChange} testID="dp" />,
    );
    pressHost(getByTestId('dp-calendar-month-0-day-20'));
    act(() => {
      fireEvent.press(getByTestId('dp-cancel'));
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
