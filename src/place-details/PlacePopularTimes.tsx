import React, { memo, useMemo } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { chartHueTone } from '../chart-cards/palette';
import { useChartCardPalette } from '../chart-cards/primitives/use-chart-palette';
import { roundedBarPath, singleBarSlot } from '../chart-cards/rounded-bar-geometry';
import { useContainerWidth } from '../hooks/use-container-width';
import { useControllableState } from '../hooks/use-controllable-state';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_DETAILS_GEOMETRY } from './constants';
import {
  busyTrendLabel,
  busyValue,
  describeBusyChart,
  hourLabelStep,
  resolvePlaceDetailsPaint,
} from './shared';
import type { PlacePopularTimesProps } from './types';

const IS_WEB = Platform.OS === 'web';

/** The width an hour label is centred in. Two or three characters, never more. */
const LABEL_SLOT = 40;

/**
 * The air above and below the plot that the current hour's outline is drawn
 * in. The outline surrounds the whole BAND rather than the bar, so it says
 * "this hour" and not "this reading", and it is clamped to the plot's own
 * width so the first and last hours cannot draw outside it.
 */
const RING_PAD = 4;
const RING_STROKE = 2;
const RING_RADIUS = 8;

/**
 * How busy a place is, hour by hour, for the day you pick.
 *
 * IT IS A CHART AND NOT A METER, and the difference is not decoration: a meter
 * answers "how full is this one thing", and every reading here only means
 * something against the twenty-three beside it. So it is drawn the way every
 * other chart in Bloom is drawn — `react-native-svg` bars on `chart-cards`'
 * own geometry (`singleBarSlot`, `roundedBarPath`) in one of `chart-cards`'
 * nine series hues, over the chart track colour. Nothing here invents a shape
 * or a palette.
 *
 *   plot     `height` tall (120 by default), one band per hour; the bar is the
 *            band less `barCategoryGap` on each side, radius 4
 *   track    the full plot height behind every bar, so a quiet hour is still a
 *            hit target's worth of drawing and a CLOSED hour reads as a gap
 *            rather than as a missing one
 *   domain   a fixed 0–100. A per-day maximum would make Tuesday's quiet peak
 *            as tall as Saturday's queue, which is the one comparison this
 *            chart exists to allow
 *   now      the current hour takes the hue's `active` step and keeps its axis
 *            label even when its neighbours' are dropped
 *   axis     every hour is labelled where they fit; below that, every second
 *            or third, because twenty-four labels across a phone is 16px each
 *
 * ## Which chart card this is NOT
 *
 * `StepsCard` draws exactly these bars — and draws them inside the medical
 * card's fixed 244 height, under its own headline, its week pill and its
 * count-up, with seven labelled bands. A place sheet has a section header
 * already and needs twenty-four bands with a day switch, so reusing that card
 * would have meant suppressing four of its five parts. The BAR maths is what
 * was worth sharing, and that is what is imported.
 *
 * ## The day switch drops "now" with the day
 *
 * `currentHourIndex` is a property of a DAY, so switching to Tuesday removes
 * the marker and the live line. Tuesday has no "now", and a marker that stayed
 * put would be a reading of a different day.
 */
function PlacePopularTimesComponent({
  days,
  day,
  defaultDay,
  onDayChange,
  height = PLACE_DETAILS_GEOMETRY.chartHeight,
  hue = 1,
  daysLabel = 'Day',
  accessibilityLabel,
  emptyLabel = 'No data for this day',
  style,
  testID,
}: PlacePopularTimesProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceDetailsPaint(theme, surface), [theme, surface]);
  const chart = useChartCardPalette();
  const tone = useMemo(() => chartHueTone(theme, hue), [theme, hue]);
  const { width, onLayout } = useContainerWidth();

  const fallbackDay = days.find((entry) => entry.currentHourIndex != null)?.id ?? days[0]?.id ?? '';
  const [selected, setSelected] = useControllableState<string>({
    value: day,
    defaultValue: defaultDay ?? fallbackDay,
    onChange: onDayChange,
  });

  const current = days.find((entry) => entry.id === selected) ?? days[0];
  const hours = current?.hours ?? [];
  const count = hours.length;
  const currentIndex =
    current?.currentHourIndex != null && current.currentHourIndex >= 0 && current.currentHourIndex < count
      ? current.currentHourIndex
      : null;
  const trend = current ? busyTrendLabel(current) : null;

  const band = count > 0 && width != null && width > 0 ? width / count : 0;
  const slot = band > 0 ? singleBarSlot(band, PLACE_DETAILS_GEOMETRY.barCategoryGap) : null;
  const step = hourLabelStep(count, width ?? 0, PLACE_DETAILS_GEOMETRY.hourLabelPitch);

  return (
    <View style={[{ gap: PLACE_DETAILS_GEOMETRY.blockGap }, style]} testID={testID}>
      {days.length > 1 ? (
        <SegmentedControl
          type="radio"
          size="small"
          label={daysLabel}
          value={selected}
          onValueChange={setSelected}
          testID={testID ? `${testID}-days` : undefined}
        >
          {days.map((entry) => (
            <SegmentedControlItem
              key={entry.id}
              value={entry.id}
              accessibilityLabel={entry.accessibilityLabel}
            >
              <SegmentedControlItemText>{entry.label}</SegmentedControlItemText>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      ) : null}

      {currentIndex != null && current ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          testID={testID ? `${testID}-live` : undefined}
        >
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone.activeColor }}
          />
          <Text variant="body-regular" style={{ flex: 1, minWidth: 0, color: paint.text }}>
            {trend
              ? `${hours[currentIndex]!.label} · ${trend}`
              : (hours[currentIndex]!.label as string)}
          </Text>
        </View>
      ) : null}

      {count === 0 ? (
        <Text variant="body-regular" style={{ color: paint.textSecondary }}>
          {emptyLabel}
        </Text>
      ) : (
        <View
          onLayout={onLayout}
          accessible
          accessibilityLabel={accessibilityLabel ?? (current ? describeBusyChart(current) : undefined)}
          {...(IS_WEB ? { role: 'img' as const } : null)}
          testID={testID ? `${testID}-chart` : undefined}
        >
          <View style={{ height: height + RING_PAD * 2 }}>
            {slot && width != null ? (
              <Svg width={width} height={height + RING_PAD * 2}>
                {hours.map((hour, index) => {
                  const x = index * band + slot.offset;
                  const barWidth = slot.size;
                  const track = roundedBarPath(
                    x,
                    RING_PAD,
                    barWidth,
                    height,
                    PLACE_DETAILS_GEOMETRY.barRadius,
                  );
                  const value = hour.closed ? 0 : busyValue(hour.value);
                  const barHeight = (value / 100) * height;
                  return (
                    <React.Fragment key={`${hour.label}-${index}`}>
                      <Path d={track} fill={chart.track} />
                      {barHeight > 0 ? (
                        <Path
                          d={roundedBarPath(
                            x,
                            RING_PAD + height - barHeight,
                            barWidth,
                            barHeight,
                            PLACE_DETAILS_GEOMETRY.barRadius,
                          )}
                          fill={index === currentIndex ? tone.activeColor : tone.color}
                          testID={testID ? `${testID}-bar-${index}` : undefined}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
                {currentIndex != null
                  ? (() => {
                      const left = Math.max(RING_STROKE / 2, currentIndex * band + RING_STROKE / 2);
                      const right = Math.min(width - RING_STROKE / 2, (currentIndex + 1) * band - RING_STROKE / 2);
                      if (right <= left) return null;
                      return (
                        <Path
                          d={roundedBarPath(
                            left,
                            RING_STROKE / 2,
                            right - left,
                            height + RING_PAD * 2 - RING_STROKE,
                            RING_RADIUS,
                          )}
                          fill="none"
                          stroke={tone.activeColor}
                          strokeWidth={RING_STROKE}
                          testID={testID ? `${testID}-now` : undefined}
                        />
                      );
                    })()
                  : null}
              </Svg>
            ) : null}
          </View>
          <View style={{ height: PLACE_DETAILS_GEOMETRY.chartAxis }}>
            {band > 0
              ? hours.map((hour, index) => {
                  if (index !== currentIndex && index % step !== 0) return null;
                  const centre = index * band + band / 2;
                  // Clamped into the plot: the first and last labels are
                  // centred on a band that starts at the edge, and a 40-wide
                  // slot centred there would hang outside the block.
                  const left = Math.max(0, Math.min((width ?? 0) - LABEL_SLOT, centre - LABEL_SLOT / 2));
                  return (
                    <Text
                      key={`label-${index}`}
                      variant="caption-2-regular"
                      numberOfLines={1}
                      style={{
                        position: 'absolute',
                        left,
                        width: LABEL_SLOT,
                        top: 6,
                        textAlign: 'center',
                        color: index === currentIndex ? paint.text : paint.textTertiary,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {hour.label}
                    </Text>
                  );
                })
              : null}
          </View>
        </View>
      )}
    </View>
  );
}

export const PlacePopularTimes = memo(PlacePopularTimesComponent);
PlacePopularTimes.displayName = 'PlacePopularTimes';
