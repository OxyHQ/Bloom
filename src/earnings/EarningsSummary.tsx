import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EarningsChartCard } from '../chart-cards';
import { useContainerWidth } from '../hooks/use-container-width';
import { useControllableState } from '../hooks/use-controllable-state';
import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EARNINGS_GEOMETRY, EARNINGS_LABELS } from './constants';
import { EarningsBreakdown } from './EarningsBreakdown';
import { EarningsPayoutRow } from './EarningsPayoutRow';
import {
  earningsHeadline,
  earningsHeadlineLabel,
  resolveEarningsPaint,
  resolveEarningsPeriod,
} from './shared';
import type { EarningsSummaryProps } from './types';

/**
 * What the work paid, for one period.
 *
 *   chart      `chart-cards`' `EarningsChartCard`, which already OWNS the
 *              figure, the delta chip, the period switch and the bars
 *   tiles      the period's readings, in `ai-profile-card`'s tile: the value
 *              over its label. One row from 640, two columns below
 *   breakdown  `EarningsBreakdown` — `price-breakdown`'s itemisation, by kind
 *   payout     `EarningsPayoutRow` — an `item` row with the amount, the date
 *              and the state
 *
 * ## Why this is built AROUND the chart card rather than beside it
 *
 * `EarningsChartCard` is already four of the five things a courier's earnings
 * screen needs: the period's figure, the change on the period before, the
 * Day / Week / Month switch and the bars of the last weeks. Drawing a second
 * figure and a second switch above it would have put two of everything on one
 * panel. So this family draws NONE of that — it hands the chart card the
 * period's data and adds the three things the chart card has no opinion about:
 * where the money came from, what the period's other readings were, and when
 * it reaches the bank.
 *
 * ## The money is never computed, and the headline is the proof
 *
 * `EarningsChartCard` formats its headline from a NUMBER, which is exactly what
 * this family must not do. So the headline is CHOSEN, not produced: this
 * component owns the chart's active index, and `format` returns the period's
 * own `total` at rest and the hovered bar's own `amount` over a bar — both
 * strings the app formatted. A bar's `value` is geometry and is never drawn.
 *
 * Two consequences, both deliberate:
 *
 *  - **The headline does not roll.** `ChartHeadline` counts a number up over
 *    320ms; a pre-formatted amount has nothing to count. The 220ms fade still
 *    plays, so the change is still visible.
 *  - **The Y axis prints a number.** A tick is a position on a scale the chart
 *    chose, not a sum the app made, so no string exists for it to have
 *    formatted. The default prints the rounded number with no currency;
 *    `formatAxisValue` is where an app puts its own.
 *
 * **A jest test cannot see the hover.** The plot surface that carries the
 * pointer handlers only exists after `onLayout`, which jsdom never fires —
 * gutting `setActiveIndex` to a no-op leaves `Earnings.test.tsx` green. The
 * choice itself (`earningsHeadline`) is pure and pinned there; that the panel
 * owns the active bar is pinned in `scripts/verify-earnings-headline.mjs`.
 *
 * ## The period is controlled here, and the chart is remounted to follow it
 *
 * `useChartRange` inside `chart-cards` is uncontrolled — it has a `defaultRange`
 * and no `range` — so a period changed from OUTSIDE cannot reach the chart's own
 * segmented control. The chart is therefore keyed on the period id: an external
 * change remounts it with the new default rather than letting the switch and the
 * panel disagree. The cost is that the bars grow in again instead of morphing.
 */

/** The axis's last resort: a number, rounded, with nobody's currency on it. */
const roundedAxisValue = (value: number) => String(Math.round(value));

function EarningsSummaryComponent({
  periods,
  period: periodProp,
  defaultPeriod,
  onPeriodChange,
  payout,
  onPressPayout,
  payoutAction,
  formatAxisValue = roundedAxisValue,
  chartHeight,
  breakdown,
  stats,
  labels: labelOverrides,
  accessibilityLabel = 'Earnings',
  style,
  testID,
}: EarningsSummaryProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveEarningsPaint(theme, surface), [theme, surface]);
  const labels = useMemo(
    () => ({
      ...EARNINGS_LABELS,
      ...labelOverrides,
      payoutState: { ...EARNINGS_LABELS.payoutState, ...labelOverrides?.payoutState },
    }),
    [labelOverrides],
  );

  const [periodId, setPeriodId] = useControllableState<string>({
    value: periodProp,
    defaultValue: defaultPeriod ?? periods[0]?.id ?? '',
    onChange: onPeriodChange,
  });
  const current = resolveEarningsPeriod(periods, periodId);

  // The chart's active bar is OWNED here: the headline has to be able to say
  // which amount it is showing, and only this component knows the strings.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const changePeriod = useCallback(
    (id: string) => {
      setActiveIndex(null);
      setPeriodId(id);
    },
    [setPeriodId],
  );

  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= EARNINGS_GEOMETRY.narrowWidth;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const bars = current?.bars;
  const total = current?.total ?? '';
  const chartData = useMemo(
    () => (bars ?? []).map((bar) => ({ label: bar.label, value: bar.value })),
    [bars],
  );
  const ranges = useMemo(
    () => periods.map((entry) => ({ id: entry.id, label: entry.label })),
    [periods],
  );

  // Both are CHOSEN from strings the app formatted, never produced from a
  // number: `format` ignores the value the count-up hands it on purpose.
  const headlineText = earningsHeadline(total, bars, activeIndex);
  const headlineLabel = earningsHeadlineLabel(labels.earned, bars, activeIndex);
  const format = useCallback(() => headlineText, [headlineText]);

  const periodStats = current?.stats ?? [];
  const showStats = (stats ?? true) && periodStats.length > 0;
  const periodLines = current?.lines ?? [];
  const showBreakdown = (breakdown ?? true) && periodLines.length > 0;
  const shownPayout = current?.payout ?? payout;

  const tileRows: number[][] = [];
  if (wide) {
    if (periodStats.length > 0) tileRows.push(periodStats.map((_unused, index) => index));
  } else {
    for (let i = 0; i < periodStats.length; i += 2)
      tileRows.push(i + 1 < periodStats.length ? [i, i + 1] : [i]);
  }

  return (
    <SurfaceLevelProvider level={0} fill={paint.surface}>
      <View
        onLayout={onLayout}
        role="group"
        accessibilityLabel={accessibilityLabel}
        style={[{ gap: EARNINGS_GEOMETRY.gap }, style]}
        testID={testID}
      >
        {/* Keyed on the period: see the note above about `useChartRange`. */}
        <EarningsChartCard
          key={periodId}
          title={headlineLabel}
          data={chartData}
          // The figure is a string, so the number behind it only has to be
          // STABLE — the fade replays on the period and the bar, not on it.
          headline={0}
          delta={current?.deltaRatio}
          ranges={ranges.length > 1 ? ranges : undefined}
          defaultRange={periodId}
          onRangeChange={changePeriod}
          rangesLabel={labels.period}
          format={format}
          formatAxisValue={formatAxisValue}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          accessibilityLabel={labels.chart(current?.label ?? '')}
          style={chartHeight === undefined ? undefined : { height: chartHeight }}
          testID={id('chart')}
        />

        {current?.caption ? (
          <Text
            variant="body-2-regular"
            style={{ color: paint.textSecondary }}
            testID={id('caption')}
          >
            {current.caption}
          </Text>
        ) : null}

        {showStats ? (
          <View style={{ gap: EARNINGS_GEOMETRY.tileGap }} testID={id('stats')}>
            {tileRows.map((row) => (
              <View
                key={`stat-row-${row[0]}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  gap: EARNINGS_GEOMETRY.tileGap,
                }}
              >
                {row.map((index) => {
                  const stat = periodStats[index]!;
                  return (
                    <View
                      key={`${index}-${stat.label}`}
                      style={[styles.tile, { backgroundColor: paint.tile }]}
                      testID={id(`stat-${index}`)}
                    >
                      <Text
                        variant="body-medium"
                        numberOfLines={1}
                        style={{ width: '100%', color: paint.tileText.text }}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        variant="body-2-medium"
                        numberOfLines={1}
                        style={{ width: '100%', color: paint.tileText.textSecondary }}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  );
                })}
                {/* An odd tile keeps its half of the two-column grid. */}
                {!wide && row.length === 1 ? <View style={styles.tileSpacer} /> : null}
              </View>
            ))}
          </View>
        ) : null}

        {showBreakdown ? (
          <EarningsBreakdown
            lines={periodLines}
            title={labels.breakdown}
            labels={labelOverrides}
            testID={id('breakdown')}
          />
        ) : null}

        {shownPayout ? (
          <EarningsPayoutRow
            payout={shownPayout}
            title={labels.payout}
            onPress={onPressPayout}
            action={payoutAction}
            labels={labelOverrides}
            testID={id('payout')}
          />
        ) : null}

        {!showStats && !showBreakdown && shownPayout === undefined ? (
          <Text
            variant="body-regular"
            style={{ color: paint.textSecondary }}
            testID={id('empty')}
          >
            {labels.empty}
          </Text>
        ) : null}
      </View>
    </SurfaceLevelProvider>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'flex-start',
    borderRadius: EARNINGS_GEOMETRY.tileRadius,
    paddingTop: EARNINGS_GEOMETRY.tilePadding,
    paddingBottom: EARNINGS_GEOMETRY.tilePadding,
    paddingLeft: EARNINGS_GEOMETRY.tilePadding,
    paddingRight: EARNINGS_GEOMETRY.tilePadding,
  },
  tileSpacer: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
});

export const EarningsSummary = memo(EarningsSummaryComponent);
EarningsSummary.displayName = 'EarningsSummary';
