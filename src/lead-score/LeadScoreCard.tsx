import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Card } from '../card';
import { Meter, MeterRing } from '../stat-bar';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LEAD_FACTOR_BAR_HEIGHT,
  LEAD_FACTOR_TONE,
  LEAD_SCORE_BAND,
  LEAD_SCORE_CARD_PADDING,
  LEAD_SCORE_RING_SIZE,
  LEAD_SCORE_RING_THICKNESS,
  LEAD_SCORE_TREND,
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
 *   ring      `MeterRing` at 96 with an 8 stroke, filled in the band's tone,
 *             with the score over the scale in the middle
 *   band      a pill — `Cold` / `Warm` / `Hot` — beside the title, with the
 *             trend against the last period under it
 *   factors   one `Meter` per contribution, all measured against the widest
 *             absolute contribution in the set, positive in the positive tone
 *             and negative in the negative one, with the signed points beside
 *             the label
 *
 * **Nothing here is hand-rolled.** The ring and every bar are `stat-bar`'s
 * `MeterRing` and `Meter`, which own the geometry, the track and the flat
 * `aria-value*` props — `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and
 * `aria-valuetext`, because react-native-web drops `accessibilityValue`
 * entirely and a ring setting only that announces its role and no value.
 *
 * **The card must be named by a prop.** A `progressbar` takes no name from its
 * contents, and the ring draws a bare number, so `accessibilityLabel` is
 * required at the type level rather than defaulted to something plausible.
 *
 * **The band is a TONE, never a colour.** `resolveAccentColors` decides what
 * "warning" looks like on this surface, in this mode, in all 64 presets; a card
 * that picked an orange would be wrong in most of them.
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
  const bandSolid = resolveAccentColors(theme.colors, bandSpec.tone, 'solid').background;
  const scale = factors?.length ? factorScale(factors) : 1;

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const TrendIcon = trend === undefined ? undefined : LEAD_SCORE_TREND[trend.direction].icon;
  const trendColor =
    trend === undefined
      ? paint.textSecondary
      : resolveAccentColors(theme.colors, LEAD_SCORE_TREND[trend.direction].tone, 'subtle').foreground;

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-16"
        style={[{ padding: LEAD_SCORE_CARD_PADDING, ...surfaceFillVars(paint.surface) }, style]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <MeterRing
            value={score}
            max={max}
            size={LEAD_SCORE_RING_SIZE}
            thickness={LEAD_SCORE_RING_THICKNESS}
            fill={bandSolid}
            track={paint.track}
            accessibilityLabel={accessibilityLabel}
            valueText={valueText}
            testID={id('ring')}
          >
            <Text variant="title-2-semibold" style={{ color: paint.text }} testID={id('score')}>
              {String(score)}
            </Text>
            <Text variant="caption-2-regular" style={{ color: paint.textTertiary }}>
              {`of ${max}`}
            </Text>
          </MeterRing>

          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }} testID={id('title')}>
              {title}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Badge
                content={bandLabel ?? bandSpec.label}
                icon={bandSpec.icon}
                variant="subtle"
                color={bandSpec.tone}
                size="label-medium"
                testID={id('band')}
              />
            </View>
            {trend && TrendIcon ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TrendIcon width={14} height={14} fill={trendColor} />
                <Text
                  variant="caption-1-medium"
                  numberOfLines={1}
                  style={{ color: trendColor, flexShrink: 1 }}
                  testID={id('trend')}
                >
                  {trend.label}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {factors?.length ? (
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: paint.hairline,
              gap: 12,
            }}
            testID={id('factors')}
          >
            <Text variant="caption-1-semibold" style={{ color: paint.textSecondary }}>
              {factorsLabel}
            </Text>
            {factors.map((factor) => {
              const positive = factor.contribution >= 0;
              const tone = positive ? LEAD_FACTOR_TONE.positive : LEAD_FACTOR_TONE.negative;
              const fill = resolveAccentColors(theme.colors, tone, 'solid').background;
              const points = formatContribution(factor.contribution);
              const key = factor.id ?? factor.label;
              return (
                <View key={key} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text
                      variant="body-2-medium"
                      numberOfLines={1}
                      style={{ color: paint.text, flex: 1, minWidth: 0 }}
                    >
                      {factor.label}
                    </Text>
                    <Text
                      variant="body-2-semibold"
                      style={{
                        color: resolveAccentColors(theme.colors, tone, 'subtle').foreground,
                        flexShrink: 0,
                      }}
                      testID={testID ? `${testID}-factor-${key}-points` : undefined}
                    >
                      {points}
                    </Text>
                  </View>
                  <Meter
                    value={Math.abs(factor.contribution)}
                    max={scale}
                    height={LEAD_FACTOR_BAR_HEIGHT}
                    fill={fill}
                    track={paint.track}
                    accessibilityLabel={factor.label}
                    valueText={`${points} points`}
                    testID={testID ? `${testID}-factor-${key}` : undefined}
                  />
                  {factor.detail ? (
                    <Text variant="caption-1-regular" style={{ color: paint.textTertiary }}>
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
