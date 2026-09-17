import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../button';
import { chartHueTone } from '../chart-cards/palette';
import { bandSize } from '../chart-cards/geometry';
import { CartesianPlot } from '../chart-cards/primitives/CartesianPlot';
import { ChartCardSurface } from '../chart-cards/primitives/ChartCardSurface';
import { TABULAR } from '../chart-cards/primitives/ChartHeader';
import { describeDeltaRatio, groupThousands } from '../chart-cards/primitives/format';
import { useActiveIndex } from '../chart-cards/primitives/use-active-index';
import { useChartCardPalette } from '../chart-cards/primitives/use-chart-palette';
import { roundedBarPath, singleBarSlot } from '../chart-cards/rounded-bar-geometry';
import { lerp, useChartProgress } from '../chart-cards/use-chart-progress';
import { Chip } from '../chip';
import { Divider } from '../divider';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { PayoutSummaryCardLabels, PayoutSummaryCardProps } from './types';

/**
 * `PayoutSummaryCard`: what the artist has earned and when it arrives.
 *
 *   card      `ChartCardSurface`, content-sized, gap 16
 *   headline  label `body-medium` text-secondary; the estimate `title-1-medium`
 *             tabular + the delta `Chip` (status lime / rose / neutral)
 *   bars      a 112px `CartesianPlot` (band scale, no Y axis, month labels):
 *             rounded bars (radius 6, 30% category gap, max 28 wide) in
 *             `chart-track`, the current (last) month in `chart-6`; the hovered
 *             bar takes `chart-6-active` and its month and value replace the
 *             caption over the bars
 *   facts     two rows — Last payout (amount + date) and Next payout (date) —
 *             label `body-2-regular` text-secondary, value `body-2-medium`
 *             tabular, a hairline between the plot and the rows
 *   link      "View statements" link button with a chevron
 */

export const PAYOUT_SUMMARY_LABELS: PayoutSummaryCardLabels = {
  estimated: 'Estimated earnings this month',
  lastPayout: 'Last payout',
  nextPayout: 'Next payout',
  statements: 'View statements',
  chart: 'Monthly earnings',
};

const PLOT_HEIGHT = 112;
const BAR_RADIUS = 6;

const defaultFormat = (value: number) => `$${groupThousands(Math.round(value))}`;

function PayoutSummaryCardComponent({
  estimated,
  delta,
  lastPayout,
  nextPayoutDate,
  months,
  format = defaultFormat,
  onViewStatements,
  statementsHref,
  labels: labelOverrides,
  style,
  testID,
}: PayoutSummaryCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const labels = { ...PAYOUT_SUMMARY_LABELS, ...labelOverrides };
  const tone = useMemo(() => chartHueTone(theme, 6), [theme]);
  const [activeIndex, setActiveIndex] = useActiveIndex(months.length, undefined, undefined);

  const values = useMemo(() => months.map((m) => m.value), [months]);
  const categories = useMemo(() => months.map((m) => m.label), [months]);
  const max = Math.max(1, ...values);
  const anim = useChartProgress(values);
  const chip = delta !== undefined ? describeDeltaRatio(delta) : undefined;
  const chipPaint = chip
    ? chip.tone === 'positive'
      ? palette.positive
      : chip.tone === 'negative'
        ? palette.negative
        : palette.neutral
    : null;
  const hovered = activeIndex !== null ? months[activeIndex] : undefined;
  const summary = `${labels.chart}: ${months.map((m) => `${m.label} ${format(m.value)}`).join(', ')}`;

  return (
    <ChartCardSurface height="auto" style={style} testID={testID}>
      <View style={styles.headline}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {labels.estimated}
        </Text>
        <View style={styles.valueRow}>
          <Text
            variant="title-1-medium"
            numberOfLines={1}
            testID={testID ? `${testID}-estimate` : undefined}
            style={[{ color: palette.text }, TABULAR]}
          >
            {estimated}
          </Text>
          {chip && chipPaint ? (
            <Chip
              size="medium"
              testID={testID ? `${testID}-delta` : undefined}
              style={{ backgroundColor: chipPaint.background }}
              textStyle={{ color: chipPaint.foreground }}
            >
              {chip.label}
            </Chip>
          ) : null}
        </View>
      </View>

      <View>
        <Text
          variant="caption-1-medium"
          numberOfLines={1}
          testID={testID ? `${testID}-caption` : undefined}
          style={[{ color: hovered ? palette.text : palette.textTertiary }, TABULAR]}
        >
          {hovered ? `${hovered.label} · ${format(hovered.value)}` : labels.chart}
        </Text>
        <View style={{ height: PLOT_HEIGHT, width: '100%' }}>
          <CartesianPlot
            categories={categories}
            xScale="band"
            yAxisWidth={0}
            yDomain={[0, max]}
            yTicks={[]}
            formatYTick={() => ''}
            outside="clear"
            onActiveIndexChange={setActiveIndex}
            palette={palette}
            accessibilityLabel={summary}
            testID={testID ? `${testID}-plot` : undefined}
          >
            {({ size, box, y }) => {
              const band = bandSize(months.length, box);
              const slot = singleBarSlot(band, 0.3, 28);
              return (
                <Svg width={size.width} height={size.height} pointerEvents="none">
                  {values.map((v, i) => {
                    const shown = anim.from && anim.from.length === values.length ? lerp(anim.from[i]!, v, anim.progress) : v * anim.progress;
                    const top = y(shown);
                    const current = i === months.length - 1;
                    const fill =
                      activeIndex === i ? tone.activeColor : current ? tone.color : palette.track;
                    return (
                      <Path
                        key={`bar-${i}`}
                        testID={testID ? `${testID}-bar-${i}` : undefined}
                        d={roundedBarPath(box.left + i * band + slot.offset, top, slot.size, Math.max(0, box.bottom - top), BAR_RADIUS)}
                        fill={fill}
                      />
                    );
                  })}
                </Svg>
              );
            }}
          </CartesianPlot>
        </View>
      </View>

      <Divider />

      <View style={styles.facts}>
        {lastPayout ? (
          <View style={styles.fact}>
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
              {labels.lastPayout}
            </Text>
            <Text variant="body-2-medium" numberOfLines={1} style={[styles.factValue, { color: palette.text }, TABULAR]}>
              {`${lastPayout.amount} · ${lastPayout.date}`}
            </Text>
          </View>
        ) : null}
        {nextPayoutDate ? (
          <View style={styles.fact}>
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
              {labels.nextPayout}
            </Text>
            <Text variant="body-2-medium" numberOfLines={1} style={[styles.factValue, { color: palette.text }, TABULAR]}>
              {nextPayoutDate}
            </Text>
          </View>
        ) : null}
      </View>

      {onViewStatements || statementsHref ? (
        <Button
          variant="link"
          size="small"
          trailingIcon={RiArrowRightSLine}
          onPress={onViewStatements}
          href={statementsHref}
          style={styles.link}
          testID={testID ? `${testID}-statements` : undefined}
        >
          {labels.statements}
        </Button>
      ) : null}
    </ChartCardSurface>
  );
}

export const PayoutSummaryCard = memo(PayoutSummaryCardComponent);
PayoutSummaryCard.displayName = 'PayoutSummaryCard';

const styles = StyleSheet.create({
  headline: { gap: 2, minWidth: 0 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  facts: { gap: 8 },
  fact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  factValue: { flexShrink: 1, textAlign: 'right' },
  link: { alignSelf: 'flex-start' },
});
