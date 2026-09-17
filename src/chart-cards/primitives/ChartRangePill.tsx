import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../dropdown-menu';
import { RiArrowDownSLine, RiCalendarLine, RiCheckLine } from '../../icons/remix';
import { Text } from '../../typography';
import type { ChartRangeOption } from './use-chart-range';
import { useChartCardPalette } from './use-chart-palette';
import { useWebTransition } from './use-web-transition';

const ICON = 16;
/** `w-[188px]` on the period menu. */
export const RANGE_MENU_WIDTH = 188;

/**
 * `RANGE_PILL`: 32 tall, radius 10 (`rounded-2lg` — a panel radius,
 * the pill is not a button), 1px `border-button`, `background-primary`,
 * `shadow-xs`, calendar glyph then label 6px apart, padding 8 left / 10 right.
 */
function pillStyle(palette: ReturnType<typeof useChartCardPalette>): ViewStyle {
  return {
    height: 32,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.pill.border,
    backgroundColor: palette.pill.background,
    boxShadow: palette.pill.shadow,
    paddingLeft: 8,
    paddingRight: 10,
  };
}

/**
 * The anchored panel's geometry. Web only: native presents the same
 * `DropdownMenuContent` as a bottom sheet, which must keep the sheet's width.
 */
const MENU_PANEL_STYLE: ViewStyle = {
  width: RANGE_MENU_WIDTH,
  minWidth: RANGE_MENU_WIDTH,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  paddingRight: 8,
};

export interface ChartRangePillProps {
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `ChartRangePill`: the static period pill ("Jan – Jun 2024"). */
export function ChartRangePill({ label, style, testID }: ChartRangePillProps) {
  const palette = useChartCardPalette();
  return (
    <View testID={testID} style={[pillStyle(palette), style]}>
      <RiCalendarLine width={ICON} height={ICON} fill={palette.textSecondary} />
      <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  );
}

export interface ChartRangeSelectProps {
  ranges: readonly ChartRangeOption[];
  /** Selected id; the first range when unset or unknown. */
  value?: string;
  onChange?: (id: string) => void;
  /** Accessible name of the trigger. Default `"Change period"`. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `ChartRangeSelect`: the pill as a dropdown — padding right 6, a
 * chevron that turns 180° while open (200ms ease-out), the hover wash
 * (`background-primary-hover`, 150ms) — over Bloom's `DropdownMenu`: a 188px
 * panel with 8px padding, rows `px-2 py-1.5` 4px apart, a check on the
 * current period. Opens under the pill, aligned to its end.
 */
export function ChartRangeSelect({
  ranges,
  value,
  onChange,
  label = 'Change period',
  style,
  testID,
}: ChartRangeSelectProps) {
  const palette = useChartCardPalette();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const current = ranges.find((r) => r.id === value) ?? ranges[0];
  const transition = useWebTransition('background-color', 150);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild label={label}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={label}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={[
            pillStyle(palette),
            { paddingRight: 6, backgroundColor: hovered ? palette.pill.hover : palette.pill.background },
            transition,
            style,
          ]}>
          <RiCalendarLine width={ICON} height={ICON} fill={palette.textSecondary} />
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
            {current?.label}
          </Text>
          <TurningChevron open={open} color={palette.textSecondary} />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        label="Period"
        side="bottom"
        align="end"
        minWidth={RANGE_MENU_WIDTH}
        style={Platform.OS === 'web' ? MENU_PANEL_STYLE : undefined}
        testID={testID ? `${testID}-menu` : undefined}>
        <DropdownMenuRadioGroup
          value={current?.id}
          onValueChange={(id) => {
            onChange?.(id);
            setOpen(false);
          }}>
          {ranges.map((r) => (
            <DropdownMenuRadioItem
              key={r.id}
              value={r.id}
              indicatorPosition="trailing"
              indicator={<RiCheckLine width={ICON} height={ICON} fill={palette.textSecondary} />}
              style={{ paddingTop: 6, paddingBottom: 6 }}
              testID={testID ? `${testID}-option-${r.id}` : undefined}>
              {r.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TurningChevron({ open, color }: { open: boolean; color: string }) {
  const reducedMotion = useReducedMotion();
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    if (reducedMotion) {
      turn.setValue(open ? 1 : 0);
      return;
    }
    const animation = Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0, 0, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [open, reducedMotion, turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Animated.View style={{ width: ICON, height: ICON, transform: [{ rotate }] }}>
      <RiArrowDownSLine width={ICON} height={ICON} fill={color} />
    </Animated.View>
  );
}
