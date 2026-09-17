import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Sparkline } from '../chart-cards/primitives/Sparkline';
import { RiBookmarkLine } from '../icons/remix/RiBookmarkLine';
import { RiHeadphoneLine } from '../icons/remix/RiHeadphoneLine';
import { RiPlayLine } from '../icons/remix/RiPlayLine';
import { RiUserFollowLine } from '../icons/remix/RiUserFollowLine';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { StatCards } from '../stat-cards/StatCards';
import type { StatCardsDeltaColor, StatCardsItem } from '../stat-cards/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveCreatorStudioPaint } from './shared';
import type { AudienceMetricKind, AudienceOverviewProps, CreatorOption, CreatorTrend } from './types';

/**
 * `AudienceOverview`: the dashboard's opening row — a heading with a period
 * `SegmentedControl`, over `StatCards` (plain) whose tiles carry a
 * `Sparkline` accessory.
 *
 *   header   heading `headline-semibold` + optional caption `body-2-regular`
 *            text-secondary; the switcher on the right, top-aligned. Below
 *            560px of its OWN width the switcher drops under the heading
 *   gap      16 between the header and the tiles
 *   tiles    `StatCards` — 2 columns, 4 from a 1024px window
 *   spark    72 × 28, the trend's status colour (up → positive, down →
 *            negative, flat → text-tertiary), hidden from assistive tech: the
 *            value and delta chip already say it
 */

export const AUDIENCE_PERIODS: readonly CreatorOption[] = [
  { value: '7d', label: '7 days' },
  { value: '28d', label: '28 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
];

const KIND_ICONS: Record<AudienceMetricKind, StatCardsItem['icon']> = {
  listeners: RiHeadphoneLine,
  streams: RiPlayLine,
  followers: RiUserFollowLine,
  saves: RiBookmarkLine,
};

/** A trend onto the stat card's delta colour. */
export const TREND_DELTA_COLORS: Record<CreatorTrend, StatCardsDeltaColor> = {
  up: 'lime',
  down: 'rose',
  flat: 'neutral',
};

const TREND_SPARK_TONES = { up: 'positive', down: 'negative', flat: 'neutral' } as const;

/** Below this own width the switcher stacks under the heading. */
const STACK_BELOW = 560;

function AudienceOverviewComponent({
  metrics,
  period,
  onPeriodChange,
  periods = AUDIENCE_PERIODS,
  title = 'Audience',
  caption,
  periodLabel = 'Period',
  style,
  testID,
}: AudienceOverviewProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  const stacked = width > 0 && width < STACK_BELOW;

  const stats = useMemo<StatCardsItem[]>(
    () =>
      metrics.map((metric) => ({
        icon: metric.icon ?? KIND_ICONS[metric.kind],
        label: metric.label,
        value: metric.value,
        delta: metric.delta,
        deltaColor: TREND_DELTA_COLORS[metric.trend],
        accessory:
          metric.series && metric.series.length > 1 ? (
            <Sparkline data={metric.series} tone={TREND_SPARK_TONES[metric.trend]} />
          ) : undefined,
      })),
    [metrics],
  );

  return (
    <View testID={testID} onLayout={onLayout} style={[styles.root, style]}>
      <View style={stacked ? styles.headerStacked : styles.header}>
        <View style={styles.heading}>
          <Text variant="headline-semibold" role="heading" numberOfLines={1} style={{ color: paint.text }}>
            {title}
          </Text>
          {caption ? (
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
              {caption}
            </Text>
          ) : null}
        </View>
        <View testID={testID ? `${testID}-period` : undefined} style={stacked ? styles.periodStacked : null}>
          <SegmentedControl label={periodLabel} type="radio" size="small" value={period} onChange={onPeriodChange}>
            {periods.map((option) => (
              <SegmentedControlItem
                key={option.value}
                value={option.value}
                testID={testID ? `${testID}-period-${option.value}` : undefined}
              >
                <SegmentedControlItemText>{option.label}</SegmentedControlItemText>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </View>
      </View>
      <StatCards stats={stats} testID={testID ? `${testID}-stats` : undefined} />
    </View>
  );
}

export const AudienceOverview = memo(AudienceOverviewComponent);
AudienceOverview.displayName = 'AudienceOverview';

const styles = StyleSheet.create({
  root: { width: '100%', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  headerStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  heading: { flexShrink: 1, minWidth: 0, gap: 2 },
  periodStacked: { alignSelf: 'flex-start', maxWidth: '100%' },
});
