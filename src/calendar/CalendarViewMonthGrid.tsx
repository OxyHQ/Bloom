import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { isSameDay, isSameMonth } from '../date-picker/calendar-grid';
import { PopoverContent } from '../popover';
import { PopoverProvider } from '../popover/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { Text, TYPE_SCALE } from '../typography';
import { useTheme } from '../theme/use-theme';
import { CalendarViewEventDetails } from './CalendarViewEventDetails';
import {
  createHueResolver,
  eventChipColors,
  resolveCalendarViewPalette,
  type CalendarViewPalette,
  type HueResolver,
} from './palette';
import {
  IS_WEB,
  dayKey,
  sixWeekGrid,
  useBreakpoint,
  useEventsByDay,
  visibleEvents,
  weekdayShortLabels,
  type CalendarViewBreakpoint,
  type WebDataSet,
} from './shared';
import type { CalendarViewEvent, CalendarViewMonthGridProps } from './types';

/**
 * The month grid: seven weekday
 * pills over an always-six-week, Sunday-first grid of day cards, each listing
 * its events as tinted chips.
 *
 * TWO LAYOUTS, switched at Tailwind's `sm` (640px viewport):
 *
 *                   below sm (dense)              sm and up
 *   grid            hairline lattice, no gaps     8px gaps, no lines
 *   weekday         11/16, padding 4/2            13/16 pill, radius 12, 5/10
 *   day card        square, min 72                radius 12, shadow-card,
 *                                                 min 94 · lg 105 · xl 128 · 2xl 164
 *   day number      11/16 medium, inset 6/6       13/16 medium, inset 8/10
 *   chips           10/12, radius 4, 2/4, gap 2,  13/12 title + 12/16 time at 70%,
 *                   no time                       radius 6, 2/6, gap 4 (5 between)
 *   events inset    4 sides/bottom                8
 *
 * The 13/12 and 11/16 steps: `leading-3`/`leading-4` sit next
 * to `sm:text-body-2-*` and win the cascade, so the computed line box is the
 * ramp's size on a tighter leading — reproduced from the rendered page.
 *
 * `compact` pins every day card to 76px for embedded previews.
 *
 * Colours: in-month days sit on the primary surface (dark: the dense grid keeps
 * every cell on the secondary surface — the lighter fill read as the disabled
 * state next to the near-black card), out-of-month days on tertiary at `sm`+.
 * The lattice is `separator-border-strong` (dark: `separator-border`).
 *
 * OVERFLOW: more than 3 events shows the LAST 4, bottom-anchored, under a
 * "+N more" label.
 *
 * Pressing a chip opens `CalendarViewEventDetails` beside its DAY (web: right
 * of the card, 6px away, flipping left when it does not fit; native: the bottom
 * sheet — the panel becomes a bottom sheet on phones too). A chip
 * dims to 95% brightness on hover. A highlighted day pulses a 2px accent ring
 * for 3s, then reports `onHighlightEnd`; under reduced motion the ring holds
 * still for the same 3s instead of pulsing.
 */

const MIN_HEIGHT: Record<CalendarViewBreakpoint, number> = {
  base: 72,
  sm: 94,
  lg: 105,
  xl: 128,
  '2xl': 164,
};
const COMPACT_MIN_HEIGHT = 76;
const GAP = 8;
const CARD_RADIUS = 12;

const CSS_ID = 'bloom-calendar-event-web-css';
const EVENT_SELECTOR = '[data-bloom-calendar-event]';
const EVENT_CSS = `${EVENT_SELECTOR} { outline: none; cursor: pointer; transition: filter 150ms ease; }
${EVENT_SELECTOR}:hover { filter: brightness(0.95); }
${EVENT_SELECTOR}:focus-visible { box-shadow: 0 0 0 2px var(--bloom-calendar-ring, currentColor); }`;

/** The pulse: opacity 0 → 1 → .35 → 1 → .35 → 1 → 0 over 3s, a 1.5% swell on each peak. */
const PULSE_MS = 3000;
const PULSE_TIMES = [0, 0.08, 0.28, 0.4, 0.6, 0.72, 1] as const;
const PULSE_OPACITY = [0, 1, 0.35, 1, 0.35, 1, 0] as const;
const PULSE_SCALE = [1, 1.015, 1, 1.015, 1, 1, 1] as const;
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

function sequence(values: readonly number[]) {
  const steps = values.slice(1).map((value, index) =>
    withTiming(value, {
      duration: (PULSE_TIMES[index + 1]! - PULSE_TIMES[index]!) * PULSE_MS,
      easing: EASE_IN_OUT,
    }),
  );
  return withSequence(...steps);
}

function HighlightRing({ color, radius, onEnd }: { color: string; radius: number; onEnd: () => void }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue<number>(reducedMotion ? 1 : 0);
  const scale = useSharedValue<number>(1);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    const finish = () => onEndRef.current();
    if (reducedMotion) {
      const timer = setTimeout(finish, PULSE_MS);
      return () => clearTimeout(timer);
    }
    scale.value = sequence(PULSE_SCALE);
    opacity.value = withSequence(
      sequence(PULSE_OPACITY),
      withTiming(0, { duration: 0 }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
    return undefined;
  }, [reducedMotion, opacity, scale]);

  const animated = useAnimatedStyle(
    () => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }),
    [opacity, scale],
  );

  return (
    <Animated.View
      aria-hidden
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: Z_INDEX.raised,
          borderWidth: 2,
          borderColor: color,
          borderRadius: radius,
        },
        animated,
      ]}
    />
  );
}

function EventChip({
  event,
  dense,
  hue,
  palette,
  onPress,
  testID,
}: {
  event: CalendarViewEvent;
  dense: boolean;
  hue: HueResolver;
  palette: CalendarViewPalette;
  onPress: (event: CalendarViewEvent) => void;
  testID?: string;
}) {
  const colors = eventChipColors(hue, event.color, palette.isDark);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarEvent: '' } } : {};
  const style: WebCssStyle = {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: dense ? 2 : 4,
    borderRadius: dense ? 4 : 6,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: dense ? 4 : 6,
    paddingRight: dense ? 4 : 6,
    backgroundColor: colors.background,
    '--bloom-calendar-ring': palette.ring,
  };
  const titleStyle: TextStyle = dense
    ? // `text-[10px] leading-3` and no weight: the medium only arrives with `sm:`.
      { fontSize: 10, lineHeight: 12, fontWeight: '400', letterSpacing: 0 }
    : { ...TYPE_SCALE['body-2-medium'], lineHeight: 12 };
  return (
    <Pressable
      {...hook}
      role="button"
      accessibilityLabel={event.time ? `${event.title}, ${event.time}` : event.title}
      onPress={() => onPress(event)}
      style={style}
      testID={testID}
    >
      <Text numberOfLines={1} style={[titleStyle, { flexShrink: 1, color: colors.title }]}>
        {event.title}
      </Text>
      {event.time && !dense ? (
        <Text
          variant="caption-1-medium"
          numberOfLines={1}
          style={{ flexShrink: 0, opacity: 0.7, color: colors.time }}
        >
          {event.time}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface DayCellProps {
  date: Date;
  inMonth: boolean;
  column: number;
  row: number;
  events: readonly CalendarViewEvent[];
  highlighted: boolean;
  breakpoint: CalendarViewBreakpoint;
  compact: boolean;
  /** The dense grid's shared row height (card, without its hairline). */
  denseHeight: number;
  palette: CalendarViewPalette;
  hue: HueResolver;
  onHighlightEnd: () => void;
  onSelectEvent: (event: CalendarViewEvent, card: View | null) => void;
  testID?: string;
}

const DayCell = memo(function DayCell({
  date,
  inMonth,
  column,
  row,
  events,
  highlighted,
  breakpoint,
  compact,
  denseHeight,
  palette,
  hue,
  onHighlightEnd,
  onSelectEvent,
  testID,
}: DayCellProps) {
  const card = useRef<View>(null);
  const dense = breakpoint === 'base';
  const { visible, hidden } = visibleEvents(events);
  // The last dense row has no hairline under it, so its card takes that pixel.
  const minHeight = dense
    ? denseHeight + (row === 5 ? 1 : 0)
    : compact
      ? COMPACT_MIN_HEIGHT
      : MIN_HEIGHT[breakpoint];
  const numberStyle: TextStyle = dense
    ? { fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0 }
    : { ...TYPE_SCALE['body-2-medium'], lineHeight: 16 };
  const background = dense
    ? inMonth
      ? palette.denseDayCurrent
      : palette.denseDayOutside
    : inMonth
      ? palette.dayCurrent
      : palette.dayOutside;
  const pressEvent = useCallback(
    (event: CalendarViewEvent) => onSelectEvent(event, card.current),
    [onSelectEvent],
  );

  const outer: ViewStyle = dense
    ? {
        flex: 1,
        minWidth: 0,
        borderRightWidth: column === 6 ? 0 : 1,
        borderBottomWidth: row === 5 ? 0 : 1,
        borderColor: palette.gridLine,
      }
    : { flex: 1, minWidth: 0 };
  const cardStyle: WebCssStyle = {
    flex: 1,
    minHeight,
    overflow: 'hidden',
    borderRadius: dense ? 0 : CARD_RADIUS,
    backgroundColor: background,
    boxShadow: !dense && inMonth ? palette.shadowCard : undefined,
  };

  return (
    <View role="cell" style={outer} testID={testID}>
      {highlighted ? (
        <HighlightRing color={palette.ring} radius={dense ? 0 : CARD_RADIUS} onEnd={onHighlightEnd} />
      ) : null}
      <View ref={card} style={cardStyle}>
        <Text
          style={[
            numberStyle,
            {
              paddingTop: dense ? 6 : 8,
              paddingLeft: dense ? 6 : 10,
              color: inMonth ? palette.text : palette.textSecondary,
            },
          ]}
        >
          {date.getDate()}
        </Text>
        {events.length > 0 ? (
          <View
            style={{
              marginTop: 'auto',
              gap: dense ? 2 : 5,
              paddingLeft: dense ? 4 : 8,
              paddingRight: dense ? 4 : 8,
              paddingBottom: dense ? 4 : 8,
            }}
          >
            {hidden > 0 ? (
              <Text
                style={[
                  dense
                    ? {
                        fontSize: 10,
                        lineHeight: 12,
                        fontWeight: '500',
                        letterSpacing: 0,
                      }
                    : { ...TYPE_SCALE['body-2-medium'], lineHeight: 12 },
                  { color: palette.textSecondary },
                ]}
              >
                {`+${hidden} more`}
              </Text>
            ) : null}
            {visible.map((event) => (
              <EventChip
                key={event.id}
                event={event}
                dense={dense}
                hue={hue}
                palette={palette}
                onPress={pressEvent}
                testID={testID ? `${testID}-event-${event.id}` : undefined}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
});

export function CalendarViewMonthGrid({
  month,
  events,
  highlightedDate = null,
  onHighlightEnd,
  compact = false,
  onSelectEvent,
  showEventDetails = true,
  locale,
  gmtLabel,
  onJoinMeeting,
  onEditTimeZone,
  onEditParticipants,
  onEditReminders,
  style,
  testID,
}: CalendarViewMonthGridProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarViewPalette(theme), [theme]);
  const hue = useMemo(() => createHueResolver(theme.colors.primary), [theme.colors.primary]);
  const breakpoint = useBreakpoint();
  const dense = breakpoint === 'base';
  const byDay = useEventsByDay(events);
  const days = useMemo(() => sixWeekGrid(month), [month]);
  const weekdays = useMemo(() => weekdayShortLabels(locale), [locale]);

  // `selected` outlives `open`, so the panel keeps its content while it animates out.
  const [selected, setSelected] = useState<CalendarViewEvent | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View | null>(null);
  const popover = useMemo(() => ({ open, setOpen, anchorRef }), [open]);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(CSS_ID, EVENT_CSS);
  }, []);

  const handleSelect = useCallback(
    (event: CalendarViewEvent, card: View | null) => {
      onSelectEvent?.(event);
      if (!showEventDetails) return;
      anchorRef.current = card;
      setSelected(event);
      setOpen(true);
    },
    [onSelectEvent, showEventDetails],
  );
  const handleHighlightEnd = useCallback(() => onHighlightEnd?.(), [onHighlightEnd]);

  // The dense grid's rows are `repeat(6, minmax(0, 1fr))`: every row as tall as
  // the tallest. React Native has no fractional tracks, so the tallest card is
  // computed (a dense cell's content is fixed-height lines) and shared.
  const denseHeight = useMemo(() => {
    let tallest = compact ? COMPACT_MIN_HEIGHT : MIN_HEIGHT.base;
    for (const { date } of days) {
      tallest = Math.max(tallest, denseCardHeight(byDay.get(dayKey(date)) ?? NO_EVENTS));
    }
    return tallest;
  }, [days, byDay, compact]);

  const weeks = [0, 1, 2, 3, 4, 5].map((row) => days.slice(row * 7, row * 7 + 7));

  const detailsStyle: WebCssStyle | undefined = Platform.select<WebCssStyle | undefined>({
    web: {
      // The event-details surface is the popover panel with its own
      // width, a 20px corner and a deeper shadow; border, surface and
      // `p-2.5` are the popover's defaults.
      width: 302,
      overflow: 'visible',
      borderRadius: 20,
      boxShadow: palette.shadowDetails,
    },
    default: undefined,
  });

  return (
    <View
      role="table"
      accessibilityLabel="Month"
      testID={testID}
      style={[
        dense
          ? {
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: palette.gridLine,
            }
          : { gap: GAP },
        style,
      ]}
    >
      <View
        role="row"
        style={[
          { flexDirection: 'row', gap: dense ? 0 : GAP },
          dense ? { borderBottomWidth: 1, borderColor: palette.gridLine } : null,
        ]}
      >
        {weekdays.map((weekday, index) => (
          <View
            key={weekday.long}
            role="columnheader"
            accessibilityLabel={weekday.long}
            style={{
              flex: 1,
              minWidth: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.pill,
              borderRadius: dense ? 0 : CARD_RADIUS,
              borderRightWidth: dense && index < 6 ? 1 : 0,
              borderColor: palette.gridLine,
              paddingTop: dense ? 4 : 5,
              paddingBottom: dense ? 4 : 5,
              paddingLeft: dense ? 2 : 10,
              paddingRight: dense ? 2 : 10,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                dense
                  ? {
                      fontSize: 11,
                      lineHeight: 16,
                      fontWeight: '400',
                      letterSpacing: 0,
                    }
                  : { ...TYPE_SCALE['body-2-regular'], lineHeight: 16 },
                { color: palette.textSecondary, textAlign: 'center' },
              ]}
            >
              {weekday.short}
            </Text>
          </View>
        ))}
      </View>
      <View style={dense ? { flex: 1, minHeight: 0 } : { gap: GAP }}>
        {weeks.map((week, row) => (
          <View
            key={dayKey(week[0]!.date)}
            role="row"
            style={[{ flexDirection: 'row', gap: dense ? 0 : GAP }, dense ? { flex: 1 } : null]}
          >
            {week.map(({ date, inMonth }, column) => (
              <DayCell
                key={dayKey(date)}
                date={date}
                inMonth={inMonth && isSameMonth(date, month)}
                column={column}
                row={row}
                events={byDay.get(dayKey(date)) ?? NO_EVENTS}
                highlighted={highlightedDate != null && isSameDay(date, highlightedDate)}
                breakpoint={breakpoint}
                compact={compact}
                denseHeight={denseHeight}
                palette={palette}
                hue={hue}
                onHighlightEnd={handleHighlightEnd}
                onSelectEvent={handleSelect}
                testID={testID ? `${testID}-day-${dayKey(date)}` : undefined}
              />
            ))}
          </View>
        ))}
      </View>
      {showEventDetails ? (
        // The popover's own context, provided here rather than through
        // `<Popover>`: the anchor is the DAY CARD, not a trigger, and it changes
        // with every chip pressed — `PopoverTrigger` can only wrap a fixed one.
        <PopoverProvider value={popover}>
          <PopoverContent
            label="Event details"
            side="right"
            align="start"
            sideOffset={6}
            style={detailsStyle}
            testID={testID ? `${testID}-details` : undefined}
          >
            {selected ? (
              <CalendarViewEventDetails
                bare
                event={selected}
                locale={locale}
                gmtLabel={gmtLabel}
                onJoinMeeting={onJoinMeeting}
                onEditTimeZone={onEditTimeZone}
                onEditParticipants={onEditParticipants}
                onEditReminders={onEditReminders}
              />
            ) : null}
          </PopoverContent>
        </PopoverProvider>
      ) : null}
    </View>
  );
}

const NO_EVENTS: readonly CalendarViewEvent[] = [];

/** 6 + 16 number line; then 2px-spaced 12px label and 16px chips over a 4px inset. */
function denseCardHeight(events: readonly CalendarViewEvent[]): number {
  const { visible, hidden } = visibleEvents(events);
  if (visible.length === 0) return 22;
  const lines = visible.length * 16 + (hidden > 0 ? 12 : 0);
  const gaps = (visible.length + (hidden > 0 ? 1 : 0) - 1) * 2;
  return 22 + lines + gaps + 4;
}
