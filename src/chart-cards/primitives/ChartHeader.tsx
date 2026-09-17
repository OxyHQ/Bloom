import React from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Chip } from '../../chip';
import { Text } from '../../typography';
import { useCountUpPrecise } from '../use-count-up';
import { ChartRangePill, ChartRangeSelect } from './ChartRangePill';
import { FadeOnChange } from './FadeOnChange';
import { formatNumber, type ChartDelta } from './format';
import type { ChartRangeOption } from './use-chart-range';
import { useChartCardPalette } from './use-chart-palette';

export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

export interface ChartHeadlineProps {
  /** Secondary line above the number — swaps to the hovered item's name. */
  label: string;
  /**
   * Headline number; rolls between values (`useCountUp`, 320ms). Omit for a
   * single-line header (the ring charts keep their number in the centre).
   */
  value?: number;
  format?: (value: number) => string;
  /** Delta chip beside the number (`describeDeltaRatio`). */
  delta?: ChartDelta;
  /** Hides the chip — keeping its space — so a hovered value stands alone. */
  hovering?: boolean;
  /** Changing this replays the number's fade, e.g. `` `${rangeId}:${activeIndex}` ``. */
  fadeKey?: string | number;
  /** A line under the number (the dashboard cards' "… last year"). */
  caption?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The left column of every chart card header:
 *
 *   label     body-medium, text-secondary, one line, truncates
 *   number    title-1-medium, text-primary, tabular, count-up + 220ms fade
 *   delta     `Chip` bold (24 tall, px 6, radius 6, body-medium), 8px after
 *             the number, status lime / rose / neutral
 *   caption   body-2-medium, text-tertiary, tabular
 *
 * Label and number are 2px apart. testIDs: `-headline`, `-delta`.
 */
export function ChartHeadline({
  label,
  value,
  format = formatNumber,
  delta,
  hovering = false,
  fadeKey = 'rest',
  caption,
  style,
  testID,
}: ChartHeadlineProps) {
  const palette = useChartCardPalette();
  const display = useCountUpPrecise(value ?? 0);
  const chip = delta
    ? delta.tone === 'positive'
      ? palette.positive
      : delta.tone === 'negative'
        ? palette.negative
        : palette.neutral
    : null;
  return (
    <View style={[{ minWidth: 0, flexShrink: 1, flexDirection: 'column', gap: 2 }, style]}>
      <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {label}
      </Text>
      {value !== undefined ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Never shrinks: the number overflows rather than truncating to "3.."
              when a hidden delta chip still holds its width. */}
          <FadeOnChange fadeKey={fadeKey} style={{ flexShrink: 0 }}>
            <Text
              variant="title-1-medium"
              numberOfLines={1}
              testID={testID ? `${testID}-headline` : undefined}
              style={[{ color: palette.text }, TABULAR]}>
              {format(display)}
            </Text>
          </FadeOnChange>
          {delta && chip ? (
            <View
              style={{ opacity: hovering ? 0 : 1 }}
              aria-hidden={hovering}
              accessibilityElementsHidden={hovering}
              importantForAccessibility={hovering ? 'no-hide-descendants' : 'auto'}>
              <Chip
                size="medium"
                testID={testID ? `${testID}-delta` : undefined}
                style={{ backgroundColor: chip.background }}
                textStyle={{ color: chip.foreground }}>
                {delta.label}
              </Chip>
            </View>
          ) : null}
        </View>
      ) : null}
      {caption !== undefined ? (
        <Text variant="body-2-medium" style={[{ color: palette.textTertiary }, TABULAR]}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export interface ChartHeaderProps extends ChartHeadlineProps {
  /** Static period pill ("Jan – Jun 2024"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown. */
  ranges?: readonly ChartRangeOption[];
  rangeId?: string;
  onRangeChange?: (id: string) => void;
  /** Any other trailing control, rendered before the pill. */
  trailing?: React.ReactNode;
  /** Style of the whole header row. */
  headerStyle?: StyleProp<ViewStyle>;
}

/**
 * `ChartHeader`: `ChartHeadline` on the left (`flex-1`), then any
 * `trailing` control and the period pill / dropdown on the right, top-aligned,
 * 12px apart.
 */
export function ChartHeader({
  range,
  ranges,
  rangeId,
  onRangeChange,
  trailing,
  headerStyle,
  testID,
  ...headline
}: ChartHeaderProps) {
  return (
    <View
      testID={testID ? `${testID}-header` : undefined}
      style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, headerStyle]}>
      <ChartHeadline {...headline} testID={testID} style={[{ flex: 1 }, headline.style]} />
      {trailing}
      {ranges && ranges.length > 0 ? (
        <ChartRangeSelect
          ranges={ranges}
          value={rangeId}
          onChange={onRangeChange}
          testID={testID ? `${testID}-range` : undefined}
        />
      ) : range ? (
        <ChartRangePill label={range} testID={testID ? `${testID}-range` : undefined} />
      ) : null}
    </View>
  );
}
