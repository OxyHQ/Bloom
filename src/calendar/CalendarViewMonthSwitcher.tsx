import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  buildMonthGrid,
  formatAccessibleDate,
  formatMonthTitle,
  isSameMonth,
  moveFocusedDate,
  startOfMonth,
  today,
  weekdayLabels,
} from '../date-picker/calendar-grid';
import { CALENDAR_CSS } from '../date-picker/CalendarMonth';
import { borderRadius } from '../styles/tokens';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { resolveCalendarViewPalette, type CalendarViewPalette } from './palette';
import { BREAKPOINT, IS_WEB, dayKey, formatShortMonth, type WebDataSet } from './shared';
import type { CalendarViewMonthSwitcherProps } from './types';

/**
 * `CalendarMonthSwitcher`: a pill with prev/next chevrons around the month
 * title that ENLARGES IN PLACE into a single-month day grid — one continuous
 * surface, not a popover. The pill's
 * own row stays the only header (the grid has none), and the surface is
 * absolutely positioned inside a fixed 36px footprint, so growing it never
 * pushes the month grid or the buttons beside it.
 *
 *   footprint   36 tall; `width` (320) at `sm`+, flex-1 below
 *   surface     radius 10, 1px border-button-default, primary surface,
 *               shadow-dropdown, clipped
 *   header row  padding 8; 16px chevron buttons; body-medium title
 *   grid        296 wide inside 12px side/bottom padding: 24px weekday row,
 *               32px days with 12px gaps, radius 8, hover secondary-hover
 *   motion      height 0 → auto 380ms `cubic-bezier(.34,1.2,.64,1)` (a small
 *               overshoot), opacity 280ms ease-out; both ways
 *
 * Picking a day commits immediately (`onSelectDate`) and closes — no
 * persistent selection. Below `sm` the title is the short month and pressing
 * it does nothing (there is no room to grow).
 *
 * The chevron buttons are full pills — Bloom's rule for button-like
 * controls — as in `date-picker`'s panel.
 */

const DEFAULT_WIDTH = 320;
const FOOTPRINT_HEIGHT = 36;
const NAV_SIZE = 16;
const DAY_SIZE = 32;
const CELL_GAP = 12;
const GRID_WIDTH = DAY_SIZE * 7 + CELL_GAP * 6;
const HEIGHT_MS = 380;
const OPACITY_MS = 280;
const HEIGHT_EASING = Easing.bezier(0.34, 1.2, 0.64, 1);
const OPACITY_EASING = Easing.bezier(0, 0, 0.58, 1);
const CSS_ID = 'bloom-calendar-web-css';

/** A `ChevronDownSmall`, turned to point left or right. */
function Chevron({ direction, color }: { direction: 'left' | 'right'; color: string }) {
  return (
    <Svg width={NAV_SIZE} height={NAV_SIZE} viewBox="0 0 16 16" fill="none">
      <Path
        d={
          direction === 'left'
            ? 'M9 4L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L9 12'
            : 'M7 4L10.2929 7.29289C10.6834 7.68342 10.6834 8.31658 10.2929 8.70711L7 12'
        }
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function NavButton({
  direction,
  label,
  onPress,
  palette,
}: {
  direction: 'left' | 'right';
  label: string;
  onPress: () => void;
  palette: CalendarViewPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarNav: '' } } : {};
  const style: WebCssStyle = {
    width: NAV_SIZE,
    height: NAV_SIZE,
    flexShrink: 0,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered ? palette.secondaryHover : 'transparent',
    '--bloom-calendar-ring': palette.ring,
  };
  return (
    <Pressable
      {...hook}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={8}
      style={style}
    >
      <Chevron direction={direction} color={palette.iconPrimary} />
    </Pressable>
  );
}

function SwitcherDay({
  date,
  isTabStop,
  locale,
  palette,
  onPress,
  registerNode,
}: {
  date: Date;
  isTabStop: boolean;
  locale?: string;
  palette: CalendarViewPalette;
  onPress: (date: Date) => void;
  registerNode: (key: string, node: View | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarDay: '' } } : {};
  const style: WebCssStyle = {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered ? palette.secondaryHover : 'transparent',
    '--bloom-calendar-ring': palette.ring,
  };
  const key = dayKey(date);
  return (
    <Pressable
      {...hook}
      ref={(node) => registerNode(key, node)}
      role="button"
      accessibilityLabel={formatAccessibleDate(date, locale)}
      tabIndex={isTabStop ? 0 : -1}
      onPress={() => onPress(date)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
    >
      <Text variant="body-medium">{date.getDate()}</Text>
    </Pressable>
  );
}

/** `onKeyDown` is forwarded by react-native-web and absent from React Native's `View` type. */
type WebKeyProps = {
  onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
};

function SwitcherGrid({
  month,
  locale,
  palette,
  onSelect,
  onPreviousMonth,
  onNextMonth,
}: {
  month: Date;
  locale?: string;
  palette: CalendarViewPalette;
  onSelect: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}) {
  const weeks = buildMonthGrid(month, 0);
  const weekdays = weekdayLabels(0, locale);
  const [focused, setFocused] = useState(() => (isSameMonth(today(), month) ? today() : startOfMonth(month)));
  const nodes = useRef(new Map<string, View>());
  const focusAfterMove = useRef(false);
  const tabStop = isSameMonth(focused, month) ? focused : startOfMonth(month);

  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    const node = nodes.current.get(dayKey(focused)) as (View & { focus?: () => void }) | undefined;
    node?.focus?.();
  }, [focused, month]);

  const registerNode = useCallback((key: string, node: View | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
  }, []);

  const keyProps: WebKeyProps = {
    onKeyDown: (event) => {
      const next = moveFocusedDate(focused, event.key, 0);
      if (!next) return;
      event.preventDefault();
      focusAfterMove.current = true;
      // Leaving the month pages the pill's own month, as react-aria's grid does.
      if (next < startOfMonth(month)) onPreviousMonth();
      else if (!isSameMonth(next, month)) onNextMonth();
      setFocused(next);
    },
  };

  return (
    <View
      role="grid"
      accessibilityLabel="Jump to date"
      {...keyProps}
      style={{ width: GRID_WIDTH, gap: CELL_GAP }}
    >
      <View role="row" style={{ flexDirection: 'row', gap: CELL_GAP }}>
        {weekdays.map((weekday) => (
          <View
            key={weekday.long}
            role="columnheader"
            accessibilityLabel={weekday.long}
            style={{ width: DAY_SIZE, height: 24, alignItems: 'center' }}
          >
            <Text variant="body-medium" style={{ color: palette.textSecondary, textAlign: 'center' }}>
              {weekday.short}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={dayKey(week[0]!.date)} role="row" style={{ flexDirection: 'row', gap: CELL_GAP }}>
          {week.map(({ date, inMonth }) =>
            inMonth ? (
              <SwitcherDay
                key={dayKey(date)}
                date={date}
                isTabStop={dayKey(date) === dayKey(tabStop)}
                locale={locale}
                palette={palette}
                onPress={onSelect}
                registerNode={registerNode}
              />
            ) : (
              <View key={dayKey(date)} style={{ width: DAY_SIZE, height: DAY_SIZE }} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

export function CalendarViewMonthSwitcher({
  month,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  width = DEFAULT_WIDTH,
  locale,
  style,
  testID,
}: CalendarViewMonthSwitcherProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveCalendarViewPalette(theme), [theme]);
  const { width: viewport } = useWindowDimensions();
  const isSm = viewport >= BREAKPOINT.sm;
  const reducedMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  // Mounted while open AND while the collapse plays out.
  const [mounted, setMounted] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(CSS_ID, CALENDAR_CSS);
  }, []);

  // Below `sm` there is no room to grow: a panel already open collapses.
  useEffect(() => {
    if (!isSm && open) setOpen(false);
  }, [isSm, open]);

  useEffect(() => {
    if (open) setMounted(true);
    const heightMs = reducedMotion ? 0 : HEIGHT_MS;
    const opacityMs = reducedMotion ? 0 : OPACITY_MS;
    fade.value = withTiming(open ? 1 : 0, {
      duration: opacityMs,
      easing: OPACITY_EASING,
    });
    progress.value = withTiming(open ? 1 : 0, { duration: heightMs, easing: HEIGHT_EASING }, (finished) => {
      if (finished && !open) runOnJS(setMounted)(false);
    });
  }, [open, reducedMotion, progress, fade]);

  const bodyStyle = useAnimatedStyle(
    () => ({ height: progress.value * contentHeight, opacity: fade.value }),
    [progress, fade, contentHeight],
  );

  const onMeasure = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  }, []);

  const select = useCallback(
    (date: Date) => {
      onSelectDate(date);
      setOpen(false);
    },
    [onSelectDate],
  );

  const openWidth = Math.min(DEFAULT_WIDTH, viewport - 24);
  const surface: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    ...(isSm ? {} : { right: 0 }),
    zIndex: Z_INDEX.floating,
    width: open ? openWidth : isSm ? width : undefined,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.panelBorder,
    backgroundColor: palette.panel,
    boxShadow: palette.shadowDropdown,
    ...(IS_WEB ? { transitionProperty: 'width', transitionDuration: '300ms' } : {}),
  };
  const titleHook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarNav: '' } } : {};
  const title = isSm ? formatMonthTitle(month, locale) : formatShortMonth(month, locale);

  return (
    <View
      testID={testID}
      style={[
        { position: 'relative', height: FOOTPRINT_HEIGHT, minWidth: 0 },
        isSm ? { width } : { flex: 1 },
        style,
      ]}
    >
      <View style={surface}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <NavButton direction="left" label="Previous month" onPress={onPreviousMonth} palette={palette} />
          <Pressable
            {...titleHook}
            role="button"
            accessibilityLabel={`${formatMonthTitle(month, locale)}, choose a date`}
            aria-expanded={open}
            disabled={!isSm}
            onPress={() => setOpen((current) => !current)}
            style={{ flex: 1, minWidth: 0 }}
            testID={testID ? `${testID}-title` : undefined}
          >
            <Text variant="body-medium" numberOfLines={1} style={{ textAlign: 'center' }}>
              {title}
            </Text>
          </Pressable>
          <NavButton direction="right" label="Next month" onPress={onNextMonth} palette={palette} />
        </View>
        {mounted ? (
          <Animated.View style={[{ overflow: 'hidden' }, bodyStyle]}>
            {/* Measured at its natural height; the clip above animates to it. */}
            <View
              onLayout={onMeasure}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                paddingLeft: 12,
                paddingRight: 12,
                paddingBottom: 12,
              }}
            >
              <SwitcherGrid
                month={startOfMonth(month)}
                locale={locale}
                palette={palette}
                onSelect={select}
                onPreviousMonth={onPreviousMonth}
                onNextMonth={onNextMonth}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
