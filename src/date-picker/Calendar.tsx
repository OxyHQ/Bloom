import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import {
  addDays,
  addMonths,
  compareDays,
  endOfMonth,
  isDateDisabled,
  isSameMonth,
  moveFocusedDate,
  normalizeRange,
  rangeCellState,
  singleCellState,
  startOfDay,
  startOfMonth,
  today,
  type DayCellState,
} from './calendar-grid';
import { CALENDAR_CSS, CalendarMonth, dayKey } from './CalendarMonth';
import { resolveCalendarPalette } from './palette';
import type { CalendarConstraintProps, CalendarProps, DateRange, RangeCalendarProps } from './types';

/**
 * `Calendar` (one day) and `RangeCalendar` (a span of days): month panels
 * with the selection and keyboard behaviour reimplemented without react-aria.
 *
 *  - The grid is ONE tab stop — the selected day, else today, else the first
 *    enabled day on show — and arrow keys, Home/End and PageUp/PageDown move
 *    focus inside it, paging the visible months when focus leaves them.
 *  - A range is chosen with two presses in either order; between them the band
 *    follows the pointer (or the keyboard focus) from the anchor.
 *  - The prev/next chevrons disable when the month beyond lies wholly outside
 *    `minDate`/`maxDate`.
 */

const CSS_ID = 'bloom-calendar-web-css';
/** The 8px between the two month panels (`flex gap-2`). */
const MONTHS_GAP = 8;

interface CalendarFrameProps extends CalendarConstraintProps {
  isRange: boolean;
  visibleMonths: 1 | 2;
  /** The day the grid opens on and focus starts from. */
  initialDate: Date;
  cellState: (date: Date) => DayCellState;
  onPressDay: (date: Date) => void;
  /** The day under the pointer, or under keyboard focus. */
  onPreviewDay?: (date: Date | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function CalendarFrame({
  isRange,
  visibleMonths,
  initialDate,
  cellState,
  onPressDay,
  onPreviewDay,
  minDate,
  maxDate,
  isDateUnavailable,
  weekStartsOn = 0,
  locale,
  accessibilityLabel,
  style,
  testID,
}: CalendarFrameProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarPalette(theme), [theme]);
  const [firstMonth, setFirstMonth] = useState(() => startOfMonth(initialDate));
  const [focusedDate, setFocusedDate] = useState(() => startOfDay(initialDate));
  const nodes = useRef(new Map<string, View>());
  const focusAfterMove = useRef(false);

  useEffect(() => {
    adoptStyleSheet(CSS_ID, CALENDAR_CSS);
  }, []);

  const constraints = useMemo(
    () => ({ minDate, maxDate, isDateUnavailable }),
    [minDate, maxDate, isDateUnavailable],
  );
  const isDisabled = useCallback((date: Date) => isDateDisabled(date, constraints), [constraints]);
  const lastMonth = addMonths(firstMonth, visibleMonths - 1);

  const showMonthOf = useCallback(
    (date: Date) => {
      setFirstMonth((current) => {
        const last = addMonths(current, visibleMonths - 1);
        if (compareDays(date, current) < 0) return startOfMonth(date);
        if (compareDays(date, endOfMonth(last)) > 0) {
          return addMonths(startOfMonth(date), -(visibleMonths - 1));
        }
        return current;
      });
    },
    [visibleMonths],
  );

  const page = useCallback(
    (months: number) => {
      setFirstMonth((current) => addMonths(current, months));
      setFocusedDate((current) => addMonths(current, months));
    },
    [],
  );

  const previousDisabled =
    minDate != null && compareDays(endOfMonth(addMonths(firstMonth, -1)), minDate) < 0;
  const nextDisabled = maxDate != null && compareDays(addMonths(lastMonth, 1), maxDate) > 0;

  // The one tab stop: the focused day when it is on show, else the first
  // enabled day of the first month.
  const focusedOnShow =
    isSameMonth(focusedDate, firstMonth) || isSameMonth(focusedDate, lastMonth);
  let tabStop = focusedOnShow && !isDisabled(focusedDate) ? focusedDate : null;
  if (!tabStop) {
    for (let day = startOfMonth(firstMonth); isSameMonth(day, firstMonth); day = addDays(day, 1)) {
      if (!isDisabled(day)) {
        tabStop = day;
        break;
      }
    }
  }
  const tabStopKey = tabStop ? dayKey(tabStop) : '';

  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    const node = nodes.current.get(dayKey(focusedDate)) as (View & { focus?: () => void }) | undefined;
    node?.focus?.();
  }, [focusedDate, firstMonth]);

  const onKeyDown = useCallback(
    (key: string, preventDefault: () => void) => {
      const next = moveFocusedDate(focusedDate, key, weekStartsOn);
      if (!next) return;
      preventDefault();
      focusAfterMove.current = true;
      setFocusedDate(next);
      showMonthOf(next);
      onPreviewDay?.(next);
    },
    [focusedDate, weekStartsOn, showMonthOf, onPreviewDay],
  );

  const handlePress = useCallback(
    (date: Date) => {
      setFocusedDate(date);
      onPressDay(date);
    },
    [onPressDay],
  );

  const registerNode = useCallback((key: string, node: View | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
  }, []);

  const todayKey = dayKey(today());
  const months = Array.from({ length: visibleMonths }, (_, index) => addMonths(firstMonth, index));

  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row', gap: MONTHS_GAP, alignSelf: 'flex-start' }, style]}
    >
      {months.map((month, index) => (
        <CalendarMonth
          key={`${month.getFullYear()}-${month.getMonth()}`}
          month={month}
          palette={palette}
          weekStartsOn={weekStartsOn}
          locale={locale}
          isRange={isRange}
          // Only the OUTER chevrons of a dual view are wired: the months
          // always stay adjacent, so there is one navigation state.
          onPrevious={index === 0 ? () => page(-1) : null}
          onNext={index === months.length - 1 ? () => page(1) : null}
          previousDisabled={previousDisabled}
          nextDisabled={nextDisabled}
          cellState={cellState}
          isDisabled={isDisabled}
          todayKey={todayKey}
          tabStopKey={tabStopKey}
          onPressDay={handlePress}
          onHoverDay={onPreviewDay ?? noop}
          onKeyDown={onKeyDown}
          registerNode={registerNode}
          accessibilityLabel={accessibilityLabel}
          testID={testID ? `${testID}-month-${index}` : undefined}
        />
      ))}
    </View>
  );
}

function noop() {}

export function Calendar({
  value,
  defaultValue = null,
  onChange,
  defaultMonth,
  ...rest
}: CalendarProps) {
  const [selected, setSelected] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: onChange ? (next) => next && onChange(next) : undefined,
  });
  const initialDate = useRef(defaultMonth ?? selected ?? today()).current;
  const cellState = useCallback((date: Date) => singleCellState(date, selected), [selected]);

  return (
    <CalendarFrame
      {...rest}
      isRange={false}
      visibleMonths={1}
      initialDate={initialDate}
      cellState={cellState}
      onPressDay={setSelected}
    />
  );
}

export function RangeCalendar({
  value,
  defaultValue = null,
  onChange,
  defaultMonth,
  visibleMonths = 1,
  ...rest
}: RangeCalendarProps) {
  const [range, setRange] = useControllableState<DateRange | null>({
    value,
    defaultValue,
    onChange: onChange ? (next) => next && onChange(next) : undefined,
  });
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [preview, setPreview] = useState<Date | null>(null);
  const initialDate = useRef(defaultMonth ?? range?.start ?? today()).current;

  const shown = anchor ? normalizeRange(anchor, preview ?? anchor) : range;
  const cellState = useCallback((date: Date) => rangeCellState(date, shown), [shown]);

  const onPressDay = useCallback(
    (date: Date) => {
      if (!anchor) {
        setAnchor(date);
        setPreview(date);
        return;
      }
      setAnchor(null);
      setPreview(null);
      setRange(normalizeRange(anchor, date));
    },
    [anchor, setRange],
  );

  // A pointer leaving a day is ignored: crossing the 12px gap between two days
  // would otherwise collapse the band to the anchor for a frame.
  const onPreviewDay = useCallback(
    (date: Date | null) => {
      if (anchor && date) setPreview(date);
    },
    [anchor],
  );

  return (
    <CalendarFrame
      {...rest}
      isRange
      visibleMonths={visibleMonths}
      initialDate={initialDate}
      cellState={cellState}
      onPressDay={onPressDay}
      onPreviewDay={onPreviewDay}
    />
  );
}
