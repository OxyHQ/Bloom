import React, { memo } from 'react';
import { Platform, Pressable, View, type Role, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text, TYPE_SCALE } from '../typography';
import {
  buildMonthGrid,
  dayCellPaint,
  formatAccessibleDate,
  formatMonthTitle,
  weekdayLabels,
  type DayCellState,
} from './calendar-grid';
import type { CalendarPalette } from './palette';
import type { WeekStart } from './types';

/**
 * One month panel: header, weekday row and day grid.
 *
 *   panel            326 wide, radius 16, padding 15, shadow-xs, card surface
 *   header           16px chevron buttons either side of a centred 14/20 title
 *   header → grid    20
 *   weekday row      24 tall, two-letter `short` weekday, text-secondary
 *   day              32×32, radius 8, 14/20 medium
 *   cell gap         12 both ways
 *
 * The prev/next chevrons are full pills, like every other button-shaped
 * Bloom control.
 *
 * Outside-month positions are empty space.
 */

export const MONTH_PANEL_WIDTH = 326;
const PANEL_PADDING = 15;
const HEADER_GAP = 20;
export const DAY_SIZE = 32;
const CELL_GAP = 12;
const WEEKDAY_ROW_HEIGHT = 24;
const NAV_SIZE = 16;
const DAY_RADIUS = 8;

const IS_WEB = Platform.OS === 'web';

/**
 * ARIA's `gridcell` — the role that carries `aria-selected` in a `grid`. React
 * Native's `Role` union has `grid` and `cell` but not `gridcell`; react-native-web
 * writes any role straight onto the element. A value-level widening, like
 * `styles/web-view-style.ts`'s `WEB_POSITION_FIXED`.
 */
const GRIDCELL_ROLE = 'gridcell' as Role;

/** `dataSet` is react-native-web's channel for a `data-*` attribute; RN has no type for it. */
type WebDataSet = { dataSet?: Record<string, string> };
/** `aria-current` is forwarded by react-native-web and untyped in React Native. */
type WebCurrentProps = { 'aria-current'?: 'date' };

export const DAY_SELECTOR = '[data-bloom-calendar-day]';
export const NAV_SELECTOR = '[data-bloom-calendar-nav]';

/** The panel's web rules: an inset `ring-2` on a keyboard-focused day or chevron. */
export const CALENDAR_CSS = `${DAY_SELECTOR}, ${NAV_SELECTOR} { outline: none; cursor: pointer; }
${DAY_SELECTOR}[aria-disabled="true"], ${NAV_SELECTOR}[aria-disabled="true"] { cursor: default; }
${DAY_SELECTOR}:focus-visible { box-shadow: inset 0 0 0 2px var(--bloom-calendar-ring, currentColor); }
${NAV_SELECTOR}:focus-visible { box-shadow: 0 0 0 2px var(--bloom-calendar-ring, currentColor); }
${DAY_SELECTOR} { transition: background-color 100ms ease-out; }
${NAV_SELECTOR} { transition: background-color 150ms ease; }`;

/**
 * A `transition-[opacity,border-radius] duration-100 ease-out` on the two
 * range layers: a band fades rather than pops, and its corners ease toward square
 * in step with the fade. Web only.
 */
const LAYER_TRANSITION: WebCssStyle | null = IS_WEB
  ? { transitionProperty: 'opacity, border-radius', transitionDuration: '100ms', transitionTimingFunction: 'ease-out' }
  : null;

/** `text-body-medium`, in Inter (the typography `Text`). */
const BODY_MEDIUM: TextStyle = TYPE_SCALE['body-medium'];

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

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
  disabled,
  palette,
}: {
  direction: 'left' | 'right';
  label: string;
  onPress: () => void;
  disabled: boolean;
  palette: CalendarPalette;
}) {
  const [hovered, setHovered] = React.useState(false);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarNav: '' } } : {};
  const style: WebCssStyle = {
    width: NAV_SIZE,
    height: NAV_SIZE,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered && !disabled ? palette.hover : 'transparent',
    '--bloom-calendar-ring': palette.ring,
  };
  return (
    <Pressable
      {...hook}
      role="button"
      accessibilityLabel={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={8}
      style={style}
    >
      <Chevron direction={direction} color={disabled ? palette.disabledText : palette.secondaryText} />
    </Pressable>
  );
}

interface DayCellProps {
  date: Date;
  column: number;
  state: DayCellState;
  isRange: boolean;
  isDisabled: boolean;
  isToday: boolean;
  isTabStop: boolean;
  label: string;
  palette: CalendarPalette;
  onPress: (date: Date) => void;
  onHover: (date: Date | null) => void;
  registerNode: (key: string, node: View | null) => void;
  testID?: string;
}

const DayCell = memo(function DayCell({
  date,
  column,
  state,
  isRange,
  isDisabled,
  isToday,
  isTabStop,
  label,
  palette,
  onPress,
  onHover,
  registerNode,
  testID,
}: DayCellProps) {
  const [hovered, setHovered] = React.useState(false);
  const paint = dayCellPaint(state, column, isRange, DAY_SIZE);
  const key = dayKey(date);
  const hook: WebDataSet = IS_WEB ? { dataSet: { bloomCalendarDay: '' } } : {};
  const current: WebCurrentProps = isToday ? { 'aria-current': 'date' } : {};
  const dayStyle: WebCssStyle = {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    // Hover fill only when unselected and enabled.
    backgroundColor: !state.isSelected && hovered && !isDisabled ? palette.hover : 'transparent',
    '--bloom-calendar-ring': palette.ring,
  };
  const textStyle: TextStyle = {
    ...BODY_MEDIUM,
    color: isDisabled ? palette.disabledText : palette.text,
  };

  return (
    <View
      role={GRIDCELL_ROLE}
      // Both spellings: react-native-web reads only `aria-selected`, React Native
      // reads `accessibilityState`.
      aria-selected={state.isSelected}
      accessibilityState={{ selected: state.isSelected }}
      style={{ width: DAY_SIZE, height: DAY_SIZE }}
    >
      <View
        pointerEvents="none"
        style={[LAYER_TRANSITION, {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: paint.band.left,
          right: paint.band.right,
          backgroundColor: palette.rangeBand,
          opacity: paint.band.visible ? 1 : 0,
          borderTopLeftRadius: paint.band.roundLeft ? DAY_RADIUS : 0,
          borderBottomLeftRadius: paint.band.roundLeft ? DAY_RADIUS : 0,
          borderTopRightRadius: paint.band.roundRight ? DAY_RADIUS : 0,
          borderBottomRightRadius: paint.band.roundRight ? DAY_RADIUS : 0,
        }]}
      />
      <Pressable
        {...hook}
        {...current}
        ref={(node) => registerNode(key, node)}
        role="button"
        accessibilityLabel={label}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        tabIndex={isTabStop ? 0 : -1}
        onPress={() => onPress(date)}
        onHoverIn={() => {
          setHovered(true);
          onHover(date);
        }}
        onHoverOut={() => {
          setHovered(false);
          onHover(null);
        }}
        style={dayStyle}
        testID={testID}
      >
        <View
          pointerEvents="none"
          style={[LAYER_TRANSITION, {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: palette.rangeEdge,
            opacity: paint.edge.visible ? 1 : 0,
            borderTopLeftRadius: paint.edge.roundLeft ? DAY_RADIUS : 0,
            borderBottomLeftRadius: paint.edge.roundLeft ? DAY_RADIUS : 0,
            borderTopRightRadius: paint.edge.roundRight ? DAY_RADIUS : 0,
            borderBottomRightRadius: paint.edge.roundRight ? DAY_RADIUS : 0,
          }]}
        />
        <Text style={textStyle}>{date.getDate()}</Text>
      </Pressable>
    </View>
  );
});

export interface CalendarMonthProps {
  month: Date;
  palette: CalendarPalette;
  weekStartsOn: WeekStart;
  locale?: string;
  isRange: boolean;
  /** `null` renders a 16px spacer in the chevron's place. */
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  previousDisabled: boolean;
  nextDisabled: boolean;
  cellState: (date: Date) => DayCellState;
  isDisabled: (date: Date) => boolean;
  todayKey: string;
  tabStopKey: string;
  onPressDay: (date: Date) => void;
  onHoverDay: (date: Date | null) => void;
  onKeyDown: (key: string, preventDefault: () => void) => void;
  registerNode: (key: string, node: View | null) => void;
  accessibilityLabel?: string;
  testID?: string;
}

/** `onKeyDown` is forwarded by react-native-web and absent from React Native's `View` type. */
type WebKeyProps = {
  onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
};

export function CalendarMonth({
  month,
  palette,
  weekStartsOn,
  locale,
  isRange,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  cellState,
  isDisabled,
  todayKey,
  tabStopKey,
  onPressDay,
  onHoverDay,
  onKeyDown,
  registerNode,
  accessibilityLabel,
  testID,
}: CalendarMonthProps) {
  const title = formatMonthTitle(month, locale);
  const weekdays = weekdayLabels(weekStartsOn, locale);
  const weeks = buildMonthGrid(month, weekStartsOn);
  const headerText: TextStyle = BODY_MEDIUM;
  const keyProps: WebKeyProps = {
    onKeyDown: (event) => onKeyDown(event.key, () => event.preventDefault()),
  };

  return (
    <View
      testID={testID}
      style={{
        width: MONTH_PANEL_WIDTH,
        flexShrink: 0,
        borderRadius: 16,
        backgroundColor: palette.panel,
        // Longhands, so a caller's override wins on web too.
        paddingTop: PANEL_PADDING,
        paddingBottom: PANEL_PADDING,
        paddingLeft: PANEL_PADDING,
        paddingRight: PANEL_PADDING,
        boxShadow: palette.shadowXs,
        gap: HEADER_GAP,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {onPrevious ? (
          <NavButton
            direction="left"
            label="Previous month"
            onPress={onPrevious}
            disabled={previousDisabled}
            palette={palette}
          />
        ) : (
          <View style={{ width: NAV_SIZE, height: NAV_SIZE }} />
        )}
        <Text
          role="heading"
          style={{ ...headerText, flex: 1, textAlign: 'center', color: palette.text }}
        >
          {title}
        </Text>
        {onNext ? (
          <NavButton
            direction="right"
            label="Next month"
            onPress={onNext}
            disabled={nextDisabled}
            palette={palette}
          />
        ) : (
          <View style={{ width: NAV_SIZE, height: NAV_SIZE }} />
        )}
      </View>
      <View
        role="grid"
        accessibilityLabel={accessibilityLabel ?? title}
        {...keyProps}
        style={{ alignSelf: 'flex-start', gap: CELL_GAP }}
      >
        <View role="row" style={{ flexDirection: 'row', gap: CELL_GAP }}>
          {weekdays.map((weekday) => (
            <View
              key={weekday.long}
              role="columnheader"
              accessibilityLabel={weekday.long}
              style={{ width: DAY_SIZE, height: WEEKDAY_ROW_HEIGHT, alignItems: 'center' }}
            >
              <Text style={{ ...headerText, color: palette.secondaryText, textAlign: 'center' }}>
                {weekday.short}
              </Text>
            </View>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={dayKey(week[0]!.date)} role="row" style={{ flexDirection: 'row', gap: CELL_GAP }}>
            {week.map(({ date, inMonth }, column) => {
              const key = dayKey(date);
              return inMonth ? (
                <DayCell
                  key={key}
                  date={date}
                  column={column}
                  state={cellState(date)}
                  isRange={isRange}
                  isDisabled={isDisabled(date)}
                  isToday={key === todayKey}
                  isTabStop={key === tabStopKey}
                  label={formatAccessibleDate(date, locale)}
                  palette={palette}
                  onPress={onPressDay}
                  onHover={onHoverDay}
                  registerNode={registerNode}
                  testID={testID ? `${testID}-day-${date.getDate()}` : undefined}
                />
              ) : (
                <View key={key} role={GRIDCELL_ROLE} style={{ width: DAY_SIZE, height: DAY_SIZE }} />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
