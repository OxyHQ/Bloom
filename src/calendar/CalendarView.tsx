import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { addMonths, startOfMonth, today } from '../date-picker/calendar-grid';
import { useControllableState } from '../hooks/use-controllable-state';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { CalendarViewHeader } from './CalendarViewHeader';
import { CalendarViewMonthGrid } from './CalendarViewMonthGrid';
import { resolveCalendarViewPalette } from './palette';
import { useBreakpoint } from './shared';
import type { CalendarViewProps } from './types';

/**
 * A calendar view: the header over the month grid card. Does not include the
 * app shell around it.
 *
 *   column     max 1300 wide, 10px between header and card
 *   card       background-secondary-default, radius 24, padding 12 at `sm`+;
 *              flush and square below `sm`, where the grid draws its lattice
 *
 * The block owns the month and the transient highlight: picking a day in the
 * month switcher shows that day's month and pulses the day for ~3s.
 *
 * The sidebar and notification bell are the app shell's; pass the bell as
 * `actions` and the breadcrumb as `breadcrumb`.
 */
export function CalendarView({
  events,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  onSelectEvent,
  compact = false,
  locale,
  gmtLabel,
  onJoinMeeting,
  onEditTimeZone,
  onEditParticipants,
  onEditReminders,
  style,
  testID,
  ...header
}: CalendarViewProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarViewPalette(theme), [theme]);
  const dense = useBreakpoint() === 'base';
  const [month, setMonth] = useControllableState<Date>({
    value: monthProp ? startOfMonth(monthProp) : undefined,
    defaultValue: startOfMonth(defaultMonth ?? today()),
    onChange: onMonthChange,
  });
  const [highlighted, setHighlighted] = useState<Date | null>(null);

  const selectDate = useCallback(
    (date: Date) => {
      setMonth(startOfMonth(date));
      setHighlighted(date);
    },
    [setMonth],
  );

  return (
    <View testID={testID} style={[{ width: '100%', maxWidth: 1300, alignSelf: 'center', gap: 10 }, style]}>
      <View
        style={
          dense
            ? {
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 12,
                zIndex: Z_INDEX.floating,
              }
            : { zIndex: Z_INDEX.floating }
        }
      >
        <CalendarViewHeader
          {...header}
          month={month}
          locale={locale}
          onPreviousMonth={() => setMonth(addMonths(month, -1))}
          onNextMonth={() => setMonth(addMonths(month, 1))}
          onSelectDate={selectDate}
          testID={testID ? `${testID}-header` : undefined}
        />
      </View>
      <View
        style={
          dense
            ? {
                width: '100%',
                flex: 1,
                minHeight: 0,
                backgroundColor: palette.card,
              }
            : {
                width: '100%',
                backgroundColor: palette.card,
                borderRadius: 24,
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 12,
                paddingRight: 12,
              }
        }
      >
        <CalendarViewMonthGrid
          month={month}
          events={events}
          highlightedDate={highlighted}
          onHighlightEnd={() => setHighlighted(null)}
          compact={compact}
          onSelectEvent={onSelectEvent}
          locale={locale}
          gmtLabel={gmtLabel}
          onJoinMeeting={onJoinMeeting}
          onEditTimeZone={onEditTimeZone}
          onEditParticipants={onEditParticipants}
          onEditReminders={onEditReminders}
          testID={testID ? `${testID}-grid` : undefined}
        />
      </View>
    </View>
  );
}
