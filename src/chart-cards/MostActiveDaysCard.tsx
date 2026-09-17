import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { chartHueTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { groupThousands } from './primitives/format';
import { useChartCardPalette } from './primitives/use-chart-palette';
import {
  MEDICAL_CARD_HEIGHT,
  MEDICAL_CARD_STYLE,
  MedicalHeader,
  MedicalHeadline,
  WeekRangePill,
  useChartFocusRing,
  useMedicalPalette,
  type MedicalPalette,
} from './medical-parts';

/**
 * A whole year as one continuous vertical calendar of activity rings.
 *
 *   panel    `background-inner`, radius 10, 10px side padding, filling the
 *            card under the header; the scroll content carries 10px top and
 *            bottom so the first and last rows keep their air
 *   months   January → December, 16px apart; each a 3-letter title
 *            (`title-3-medium`, 4px inset), 10px, then a 7-column grid with
 *            5px between columns and none between rows
 *   day      78 tall, radius 10, a 2px border (transparent unless selected, so
 *            selecting never shifts the grid), padding 10: the day number
 *            (`body-medium`), 10px, a 28px three-ring chart. Hover washes
 *            `background-primary-hover`; selected is `background-primary`
 *            with a `border-button-hover` border; colours ease 150ms
 *   rings    radii 12 / 8.4 / 4.8, stroke 2.2, starting at 12 o'clock: a 16%
 *            track and a round-capped arc for the day's fraction. A day with
 *            no data (`rings` returns null — the future) draws tracks only
 *   pill     128px `WeekRangePill` naming the month whose title sits within
 *            24px of the viewport top; its chevrons scroll to the previous /
 *            next month's title (9px of air above it). On mount the calendar
 *            glides from January to `initialMonth`.
 */

/** A calendar day: `month` 0–11, `day` 1–31. */
export interface ActivityDay {
  month: number;
  day: number;
}

export interface MostActiveDaysCardProps {
  /** The year laid out (month lengths, leap years). Default: the current year. */
  year?: number;
  /**
   * Each ring's fill fraction (0–1) for a day, outermost first — three rings
   * (move, exercise, running). Return `null` for a day with no data yet: its
   * rings draw as empty tracks.
   */
  rings: (day: ActivityDay) => readonly number[] | null;
  /** Ring colours, outermost first. Default chart-3-active (pink), chart-2 (lime), chart-4 (sky). */
  ringColors?: readonly [string, string, string];
  /** The month the calendar glides to on mount (0–11). Default: January (no glide). */
  initialMonth?: number;
  /** Header label. Default `"Most active days"`. */
  title?: string;
  /** The headline number. */
  headline: number;
  /** Suffix after the number. Default `"total steps"`. */
  suffix?: string;
  format?: (value: number) => string;
  /** Month names, January first. Default English; titles use the first three letters. */
  monthNames?: readonly string[];
  /** The selected day, outlined. */
  selectedDay?: ActivityDay | null;
  onSelectDay?: (day: ActivityDay) => void;
  /** A day cell's accessible name. Default `"Activity for July 8"`. */
  getDayLabel?: (day: ActivityDay, monthName: string) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Air above a month's title when a chevron scrolls it to the top. */
export const REST_OFFSET = 9;
/** A month counts as current once its title is within this of the viewport top. */
export const CURRENT_THRESHOLD = 24;
const RING_RADII = [12, 8.4, 4.8] as const;
const RING_STROKE = 2.2;
const RING_TRACK_OPACITY = 0.16;
const CELL_HEIGHT = 78;
const COLUMN_GAP = 5;

const EMPTY_CELL: ViewStyle = {
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
  borderWidth: 2,
  borderColor: 'transparent',
  paddingLeft: 10,
  paddingRight: 10,
};

const defaultDayLabel = (d: ActivityDay, name: string) => `Activity for ${name} ${d.day}`;

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** The index of the month whose title top is within the threshold of the viewport top. */
export function currentMonthAt(scrollY: number, monthTops: readonly (number | undefined)[]): number {
  let active = 0;
  monthTops.forEach((top, i) => {
    if (top !== undefined && top - scrollY <= CURRENT_THRESHOLD) active = i;
  });
  return active;
}

function MiniActivityRings({ fractions, colors }: { fractions: readonly number[] | null; colors: readonly string[] }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" style={{ flexShrink: 0 }} aria-hidden>
      {RING_RADII.map((radius, index) => {
        const circumference = 2 * Math.PI * radius;
        const fraction = fractions ? Math.min(1, Math.max(0, fractions[index] ?? 0)) : 0;
        const dash = circumference * fraction;
        const color = colors[index]!;
        return (
          <G key={index} transform="rotate(-90 14 14)">
            <Circle cx={14} cy={14} r={radius} fill="none" stroke={color} strokeWidth={RING_STROKE} opacity={RING_TRACK_OPACITY} />
            {fractions ? (
              <Circle
                cx={14}
                cy={14}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
              />
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

interface DayCellProps {
  month: number;
  day: number;
  monthName: string;
  selected: boolean;
  fractions: readonly number[] | null;
  ringColors: readonly string[];
  text: string;
  selectedBackground: string;
  medical: MedicalPalette;
  getDayLabel: (day: ActivityDay, monthName: string) => string;
  onSelectDay?: (day: ActivityDay) => void;
  testID?: string;
}

const DayCell = memo(function DayCell({
  month,
  day,
  monthName,
  selected,
  fractions,
  ringColors,
  text,
  selectedBackground,
  medical,
  getDayLabel,
  onSelectDay,
  testID,
}: DayCellProps) {
  const [hovered, setHovered] = useState(false);
  const { hook, ring } = useChartFocusRing('inset', medical.focusRing);
  const ease: WebCssStyle | null =
    Platform.OS === 'web'
      ? { transitionProperty: 'background-color, border-color', transitionDuration: '150ms', transitionTimingFunction: 'ease' }
      : null;
  return (
    <Pressable
      {...hook}
      testID={testID}
      role="button"
      aria-pressed={selected}
      accessibilityState={{ selected }}
      accessibilityLabel={getDayLabel({ month, day }, monthName)}
      onPress={() => onSelectDay?.({ month, day })}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          flex: 1,
          flexBasis: 0,
          minWidth: 0,
          height: CELL_HEIGHT,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? medical.buttonBorderHover : 'transparent',
          backgroundColor: selected ? selectedBackground : hovered ? medical.cellHover : 'transparent',
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
        },
        ease,
        ring,
      ]}>
      {/* The 20px number, 10px and the 28px rings overflow the 54px content box by
          4px, centred — as the CSS flex column does. Nothing may shrink. */}
      <Text variant="body-medium" style={{ flexShrink: 0, color: text }}>
        {String(day)}
      </Text>
      <MiniActivityRings fractions={fractions} colors={ringColors} />
    </Pressable>
  );
});

/** The calendar scrolls inside the card; its overscroll must not drag the page (web). */
const SCROLL_STYLE: WebCssStyle = { flex: 1, overscrollBehavior: 'contain' };

export function MostActiveDaysCard({
  year = new Date().getFullYear(),
  rings,
  ringColors: ringColorsProp,
  initialMonth = 0,
  title = 'Most active days',
  headline,
  suffix = 'total steps',
  format = groupThousands,
  monthNames = MONTH_NAMES,
  selectedDay = null,
  onSelectDay,
  getDayLabel = defaultDayLabel,
  style,
  testID,
}: MostActiveDaysCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const medical = useMedicalPalette();
  const ringColors = useMemo(
    () => ringColorsProp ?? [chartHueTone(theme, 3).activeColor, chartHueTone(theme, 2).color, chartHueTone(theme, 4).color],
    [ringColorsProp, theme],
  );

  const scrollRef = useRef<ScrollView>(null);
  const monthTops = useRef<(number | undefined)[]>([]);
  const scrollY = useRef(0);
  const glided = useRef(false);
  const [currentMonth, setCurrentMonth] = useState(0);

  const scrollToMonth = useCallback((m: number, animated = true) => {
    const target = Math.min(11, Math.max(0, m));
    const top = monthTops.current[target];
    if (top === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, top - REST_OFFSET), animated });
  }, []);

  const onMonthLayout = (month: number) => (event: LayoutChangeEvent) => {
    monthTops.current[month] = event.nativeEvent.layout.y;
    // Glide from January to the initial month once every month is laid out.
    if (!glided.current && monthTops.current.filter((t) => t !== undefined).length === 12) {
      glided.current = true;
      if (initialMonth > 0) scrollToMonth(initialMonth, true);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    const next = currentMonthAt(scrollY.current, monthTops.current);
    setCurrentMonth((prev) => (prev === next ? prev : next));
  };

  return (
    <ChartCardSurface height={MEDICAL_CARD_HEIGHT} style={[MEDICAL_CARD_STYLE, style]} testID={testID}>
      <MedicalHeader>
        <MedicalHeadline label={title} value={headline} format={format} suffix={suffix} testID={testID} />
        <WeekRangePill
          width={128}
          label={monthNames[currentMonth] ?? ''}
          onPrev={() => scrollToMonth(currentMonth - 1)}
          onNext={() => scrollToMonth(currentMonth + 1)}
          prevLabel="Previous month"
          nextLabel="Next month"
          testID={testID ? `${testID}-month` : undefined}
        />
      </MedicalHeader>

      <View
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: 10,
          backgroundColor: palette.inner,
          paddingLeft: 10,
          paddingRight: 10,
        }}>
        <ScrollView
          ref={scrollRef}
          testID={testID ? `${testID}-scroll` : undefined}
          style={SCROLL_STYLE}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 10, gap: 16 }}
          onScroll={onScroll}
          scrollEventThrottle={16}>
          {monthNames.slice(0, 12).map((monthName, month) => {
            const count = daysIn(year, month);
            const weeks: number[][] = [];
            for (let d = 1; d <= count; d += 7) {
              weeks.push(Array.from({ length: Math.min(7, count - d + 1) }, (_, k) => d + k));
            }
            return (
              <View key={monthName} onLayout={onMonthLayout(month)} style={{ flexDirection: 'column', gap: 10 }}>
                <Text variant="title-3-medium" style={{ paddingLeft: 4, color: palette.text }}>
                  {monthName.slice(0, 3)}
                </Text>
                <View>
                  {weeks.map((week) => (
                    <View key={week[0]} style={{ flexDirection: 'row', columnGap: COLUMN_GAP }}>
                      {week.map((day) => (
                        <DayCell
                          key={day}
                          month={month}
                          day={day}
                          monthName={monthName}
                          selected={selectedDay?.month === month && selectedDay?.day === day}
                          fractions={rings({ month, day })}
                          ringColors={ringColors}
                          text={palette.text}
                          selectedBackground={palette.pill.background}
                          medical={medical}
                          getDayLabel={getDayLabel}
                          onSelectDay={onSelectDay}
                          testID={testID ? `${testID}-day-${month}-${day}` : undefined}
                        />
                      ))}
                      {/* Empty tracks with the cells' own box (padding + border): flex
                          shares out the space AFTER that box, so a bare filler would
                          leave the short week's columns wider than the grid's. */}
                      {Array.from({ length: 7 - week.length }, (_, k) => (
                        <View key={`empty-${k}`} style={EMPTY_CELL} />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ChartCardSurface>
  );
}
