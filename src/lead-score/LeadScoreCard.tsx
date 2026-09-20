import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../card';
import { Meter, MeterRing } from '../stat-bar';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LEAD_FACTOR_BAR_HEIGHT,
  LEAD_FACTOR_ROW_GAP,
  LEAD_SCORE_BAND,
  LEAD_SCORE_CARD_PADDING,
  LEAD_SCORE_RING_SIZE,
  LEAD_SCORE_RING_THICKNESS,
  LEAD_SCORE_TREND,
  TABULAR,
} from './constants';
import {
  factorScale,
  formatContribution,
  resolveLeadScoreBand,
  resolveLeadScorePaint,
} from './shared';
import type { LeadScoreCardProps } from './types';

/**
 * How good a lead is, and WHY.
 *
 * The hierarchy is the one every Bloom score card uses (`SleepScoreCard`, and
 * `PriceEstimate` for the figure): a quiet `body-medium` LABEL over a
 * `title-1-medium` VERDICT, the measurement as a ring beside it, and the
 * detail underneath.
 *
 *   header    "Lead score" (body-medium, text-secondary) over the band —
 *             "Hot" at `title-1-medium` with the band's glyph — then the trend
 *             as a quiet icon-and-label line; a 72 `MeterRing` on the right
 *             carrying the score over the scale
 *   factors   `NeighbourhoodScores`' row exactly: the label (body-medium) with
 *             the signed points right-aligned (body-semibold, tabular), a
 *             6-tall `Meter` under it, and the detail (body-2-regular,
 *             text-secondary) under that; rows 24 apart
 *
 * **ONE MEASURED LANGUAGE.** Every bar and the ring fill with the ACCENT over
 * the shared neutral rail, because that is what a meter means in Bloom: how
 * much of one thing there is. Status colours say something else — a green ring
 * claims "healthy", which is not the claim "82 of 100" makes — and five
 * saturated green and red bars stacked down a card is a chart pretending to be
 * a measurement. The SIGN carries the direction: it is printed (`+24`, `-9`),
 * and a negative bar fills with the quiet graphical neutral read off the rail
 * rather than with error red.
 *
 * **The card must be named by a prop.** ARIA computes no name for a
 * `progressbar` from its contents and the ring draws a bare number, so
 * `accessibilityLabel` is required at the type level. The ring and every bar
 * are `stat-bar`'s, which own the geometry, the rail and the FLAT `aria-value*`
 * props — react-native-web drops `accessibilityValue` entirely.
 */
function LeadScoreCardComponent({
  score,
  max = 100,
  band,
  bandLabel,
  accessibilityLabel,
  valueText,
  title = 'Lead score',
  factors,
  factorsLabel = 'What it is made of',
  trend,
  style,
  testID,
}: LeadScoreCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveLeadScorePaint(theme, theme.colors.card), [theme]);
  const resolvedBand = band ?? resolveLeadScoreBand(score, max);
  const bandSpec = LEAD_SCORE_BAND[resolvedBand];
  const BandIcon = bandSpec.icon;
  const bandAccent = resolveAccentColors(theme.colors, bandSpec.tone, 'subtle');
  const scale = factors?.length ? factorScale(factors) : 1;

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const TrendIcon = trend === undefined ? undefined : LEAD_SCORE_TREND[trend.direction].icon;

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-20"
        style={[
          {
            paddingTop: LEAD_SCORE_CARD_PADDING,
            paddingBottom: LEAD_SCORE_CARD_PADDING,
            paddingLeft: LEAD_SCORE_CARD_PADDING,
            paddingRight: LEAD_SCORE_CARD_PADDING,
            gap: 20,
            ...surfaceFillVars(paint.surface),
          },
          style,
        ]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              variant="body-medium"
              numberOfLines={1}
              style={{ color: paint.textSecondary }}
              testID={id('title')}
            >
              {title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* The band's glyph is the only tinted mark in the header: the
                  word beside it is the verdict, and a pill saying the same word
                  twice is the duplication a verdict line removes. */}
              <BandIcon width={20} height={20} fill={bandAccent.foreground} />
              <Text
                variant="title-1-medium"
                numberOfLines={1}
                style={{ flexShrink: 1, color: paint.text }}
                testID={id('band')}
              >
                {bandLabel ?? bandSpec.label}
              </Text>
            </View>
            {trend && TrendIcon ? (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
              >
                <TrendIcon width={16} height={16} fill={paint.textSecondary} />
                <Text
                  variant="body-2-regular"
                  numberOfLines={1}
                  style={{ flexShrink: 1, color: paint.textSecondary }}
                  testID={id('trend')}
                >
                  {trend.label}
                </Text>
              </View>
            ) : null}
          </View>

          <MeterRing
            value={score}
            max={max}
            size={LEAD_SCORE_RING_SIZE}
            thickness={LEAD_SCORE_RING_THICKNESS}
            accessibilityLabel={accessibilityLabel}
            valueText={valueText}
            testID={id('ring')}
          >
            <Text
              variant="title-3-semibold"
              style={[{ color: paint.text }, TABULAR]}
              testID={id('score')}
            >
              {String(score)}
            </Text>
            <Text variant="caption-2-regular" style={[{ color: paint.textTertiary }, TABULAR]}>
              {`of ${max}`}
            </Text>
          </MeterRing>
        </View>

        {factors?.length ? (
          <View
            style={{
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: paint.hairline,
              gap: LEAD_FACTOR_ROW_GAP,
            }}
            testID={id('factors')}
          >
            <Text variant="body-medium" style={{ color: paint.textSecondary }}>
              {factorsLabel}
            </Text>
            {factors.map((factor) => {
              const positive = factor.contribution >= 0;
              const points = formatContribution(factor.contribution);
              const key = factor.id ?? factor.label;
              return (
                <View key={key} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      variant="body-medium"
                      numberOfLines={1}
                      style={{ flex: 1, minWidth: 0, color: paint.text }}
                    >
                      {factor.label}
                    </Text>
                    <Text
                      variant="body-semibold"
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                      style={[{ color: paint.text, flexShrink: 0 }, TABULAR]}
                      testID={testID ? `${testID}-factor-${key}-points` : undefined}
                    >
                      {points}
                    </Text>
                  </View>
                  <Meter
                    value={Math.abs(factor.contribution)}
                    max={scale}
                    height={LEAD_FACTOR_BAR_HEIGHT}
                    // Positive takes the accent — the meter default, and what
                    // every other measurement in Bloom fills with. Negative
                    // takes the QUIET graphical neutral, read off the rail so
                    // it clears it (`neutralSeries` is `neutral-800` in dark and
                    // would vanish on one).
                    fill={positive ? undefined : paint.negativeFill}
                    accessibilityLabel={factor.label}
                    valueText={`${points} points`}
                    testID={testID ? `${testID}-factor-${key}` : undefined}
                  />
                  {factor.detail ? (
                    <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
                      {factor.detail}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>
    </SurfaceLevelProvider>
  );
}

export const LeadScoreCard = memo(LeadScoreCardComponent);
LeadScoreCard.displayName = 'LeadScoreCard';
