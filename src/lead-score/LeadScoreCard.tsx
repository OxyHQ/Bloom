import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../card';
import { MeterRing } from '../stat-bar';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LEAD_FACTOR_MARK_RADIUS,
  LEAD_FACTOR_MARK_SIZE,
  LEAD_FACTOR_ROW_PADDING,
  LEAD_SCORE_BAND,
  LEAD_SCORE_CARD_PADDING,
  LEAD_SCORE_PANEL_GAP,
  LEAD_SCORE_PANEL_PADDING,
  LEAD_SCORE_PANEL_RADIUS,
  LEAD_SCORE_RING_SIZE,
  LEAD_SCORE_RING_THICKNESS,
  LEAD_SCORE_TREND,
  TABULAR,
} from './constants';
import {
  factorLine,
  formatContribution,
  resolveLeadScoreBand,
  resolveLeadScorePaint,
} from './shared';
import type { LeadScoreCardProps } from './types';

/**
 * How good a lead is, and WHY.
 *
 * It is drawn the way Bloom draws a score — `chart-cards`' `SleepScoreCard` is
 * the register, and the `BesideTheReference` story puts the two in one shot:
 * TWO PANELS inside one card, the verdict on a tinted one and the breakdown on
 * a neutral one.
 *
 *   header   a panel washed in the band's tone: the quiet `body-medium` label
 *            ("Lead score") over the `title-1-medium` verdict ("Hot") with the
 *            band's glyph, the trend as a quiet icon-and-label line, and then
 *            the ring — 132 across, CENTRED, with the score at
 *            `display-4-medium` inside it
 *   factors  a neutral panel, padded on the LEFT only so the rules run to its
 *            right edge: one row per factor — a small mark, the label and its
 *            detail as one reading line, and the signed contribution
 *            right-aligned and tabular, with a hairline under every row but the
 *            last
 *
 * **THERE ARE NO BARS.** Five of them down a card is a chart pretending to be a
 * measurement, and it is the single thing that made this card read as another
 * product's dashboard. A contribution is a NUMBER, it is printed, and the mark
 * beside it says which way it pulls. The one measurement here is the score, and
 * it is a ring, because there is one of it.
 *
 * **The card must be named by a prop.** ARIA computes no name for a
 * `progressbar` from its contents and the ring draws a bare number, so
 * `accessibilityLabel` is required at the type level. The ring is `stat-bar`'s,
 * which owns the geometry and the FLAT `aria-value*` props — react-native-web
 * drops `accessibilityValue` entirely.
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
  const resolvedBand = band ?? resolveLeadScoreBand(score, max);
  const bandSpec = LEAD_SCORE_BAND[resolvedBand];
  const BandIcon = bandSpec.icon;
  const paint = useMemo(
    () => resolveLeadScorePaint(theme, theme.colors.card, bandSpec.tone),
    [theme, bandSpec.tone],
  );
  const bandAccent = resolveAccentColors(theme.colors, bandSpec.tone, 'subtle');

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
            gap: LEAD_SCORE_PANEL_GAP,
            ...surfaceFillVars(paint.surface),
          },
          style,
        ]}
        testID={testID}
      >
        {/* The tinted panel is a SURFACE of its own: everything inside it reads
            its text rungs off the wash, not off the card. */}
        <SurfaceLevelProvider level={2} fill={paint.header}>
          <View
            testID={id('header')}
            style={{
              borderRadius: LEAD_SCORE_PANEL_RADIUS,
              backgroundColor: paint.header,
              paddingTop: LEAD_SCORE_PANEL_PADDING,
              paddingBottom: LEAD_SCORE_PANEL_PADDING,
              paddingLeft: LEAD_SCORE_PANEL_PADDING,
              paddingRight: LEAD_SCORE_PANEL_PADDING,
              gap: 12,
              ...surfaceFillVars(paint.header),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  variant="body-medium"
                  numberOfLines={1}
                  style={{ color: paint.headerText.textSecondary }}
                  testID={id('title')}
                >
                  {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BandIcon width={20} height={20} fill={bandAccent.foreground} />
                  <Text
                    variant="title-1-medium"
                    numberOfLines={1}
                    style={{ flexShrink: 1, color: paint.headerText.text }}
                    testID={id('band')}
                  >
                    {bandLabel ?? bandSpec.label}
                  </Text>
                </View>
                {trend && TrendIcon ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendIcon width={16} height={16} fill={paint.headerText.textSecondary} />
                    <Text
                      variant="body-2-regular"
                      numberOfLines={1}
                      style={{ flexShrink: 1, color: paint.headerText.textSecondary }}
                      testID={id('trend')}
                    >
                      {trend.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ alignItems: 'center' }}>
              <MeterRing
                value={score}
                max={max}
                size={LEAD_SCORE_RING_SIZE}
                thickness={LEAD_SCORE_RING_THICKNESS}
                fill={paint.fill}
                track={paint.track}
                accessibilityLabel={accessibilityLabel}
                valueText={valueText}
                testID={id('ring')}
              >
                <Text
                  variant="display-4-medium"
                  style={[{ color: paint.headerText.text }, TABULAR]}
                  testID={id('score')}
                >
                  {String(score)}
                </Text>
              </MeterRing>
            </View>
          </View>
        </SurfaceLevelProvider>

        {factors?.length ? (
          <SurfaceLevelProvider level={2} fill={paint.panel}>
            <View
              testID={id('factors')}
              style={{
                borderRadius: LEAD_SCORE_PANEL_RADIUS,
                backgroundColor: paint.panel,
                // Padded on the LEFT only, so every rule runs to the panel's
                // right edge and stays inset on the left.
                paddingLeft: LEAD_SCORE_PANEL_PADDING,
                ...surfaceFillVars(paint.panel),
              }}
            >
              {factorsLabel ? (
                <Text
                  variant="body-2-medium"
                  numberOfLines={1}
                  style={{
                    color: paint.panelText.textSecondary,
                    paddingTop: LEAD_FACTOR_ROW_PADDING,
                    paddingBottom: LEAD_FACTOR_ROW_PADDING,
                    paddingRight: LEAD_SCORE_PANEL_PADDING,
                    borderBottomWidth: 1,
                    borderBottomColor: paint.rowRule,
                  }}
                  testID={id('factors-label')}
                >
                  {factorsLabel}
                </Text>
              ) : null}
              {factors.map((factor, index) => {
                const positive = factor.contribution >= 0;
                const points = formatContribution(factor.contribution);
                const key = factor.id ?? factor.label;
                return (
                  <View
                    key={key}
                    testID={testID ? `${testID}-factor-${key}` : undefined}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      paddingTop: LEAD_FACTOR_ROW_PADDING,
                      paddingBottom: LEAD_FACTOR_ROW_PADDING,
                      paddingRight: LEAD_SCORE_PANEL_PADDING,
                      borderBottomWidth: index < factors.length - 1 ? 1 : 0,
                      borderBottomColor: paint.rowRule,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        flexShrink: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* The mark is the only thing carrying the sign
                          graphically: the accent for a factor that pushes the
                          score up, the quiet graphical neutral for one that
                          pulls it down. */}
                      <View
                        style={{
                          width: LEAD_FACTOR_MARK_SIZE,
                          height: LEAD_FACTOR_MARK_SIZE,
                          flexShrink: 0,
                          borderRadius: LEAD_FACTOR_MARK_RADIUS,
                          backgroundColor: positive ? paint.fill : paint.negativeMark,
                        }}
                        testID={testID ? `${testID}-factor-${key}-mark` : undefined}
                      />
                      <Text
                        variant="body-regular"
                        numberOfLines={1}
                        style={{ flexShrink: 1, color: paint.panelText.textSecondary }}
                      >
                        {factorLine(factor.label, factor.detail)}
                      </Text>
                    </View>
                    <Text
                      variant="body-medium"
                      numberOfLines={1}
                      style={[{ flexShrink: 0, color: paint.panelText.text }, TABULAR]}
                      testID={testID ? `${testID}-factor-${key}-points` : undefined}
                    >
                      {points}
                    </Text>
                  </View>
                );
              })}
            </View>
          </SurfaceLevelProvider>
        ) : null}
      </Card>
    </SurfaceLevelProvider>
  );
}

export const LeadScoreCard = memo(LeadScoreCardComponent);
LeadScoreCard.displayName = 'LeadScoreCard';
