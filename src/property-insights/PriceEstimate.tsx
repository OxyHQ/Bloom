import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { useContainerWidth } from '../hooks/use-container-width';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { AccentTone } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PROPERTY_INSIGHTS_CSS,
  PROPERTY_INSIGHTS_STYLE_ID,
  formatEuros,
  resolveInsightPalette,
} from './shared';
import type { EstimateConfidence, PriceEstimateProps, PriceVerdict } from './types';

/**
 * An explainable price estimate: the range, where the asking price sits in it,
 * how sure the estimate is, and why.
 *
 *   card        radius 20, card surface (dark neutral-900), 1px neutral-200
 *               (dark neutral-800) border, padding
 *               20 (longhands), gap 20
 *   heading     `title` body-medium text-secondary; the range "€360,000 –
 *               €395,000" title-2-semibold
 *   bar         an 8-tall neutral-100 (dark neutral-800) track, radius 4; the
 *               estimate band low → high in accent-200 (dark accent-800); the
 *               point `estimate` a 2×16 text-primary tick; the asking price a
 *               2×24 text-primary marker with "Asking €385,000"
 *               (caption-1-semibold) above it; low and high under the band
 *               (caption-1-regular, text-secondary). Labels are clamped inside
 *               the bar's width.
 *   verdict     a subtle `Chip`: "Fair price" success, "Below estimate by 6%"
 *               success, "Above estimate by 8%" warning up to
 *               `highAboveRatio` (10%) above the high end, error beyond
 *   confidence  a 3-segment meter (16×6 each, radius 3, 3 apart; filled
 *               segments text-primary, empty neutral-100 / dark neutral-800)
 *               + "Medium confidence" body-2-semibold + the note
 *   reasons     a "Why this estimate" toggle (body-semibold + chevron) that
 *               expands the bullets (body-regular) and the comparables line
 *   footer      method · version · updated, caption-1-regular text-tertiary
 *
 * CONFIDENCE CHANGES WHAT IS DRAWN, not just a label. The band is widened
 * by a share of the range on each side, painted accent-100 (dark accent-900):
 * nothing at `high`, 25% at `medium`, 50% at `low` — and at `low` the core
 * band is painted in that same soft colour, so the bar shows no firm edges,
 * the point-estimate tick is hidden, and the verdict is REPLACED by
 * "Not enough data for a verdict". A low-confidence estimate must not look
 * like a precise one.
 */

const TRACK_HEIGHT = 8;
const MARKER_HEIGHT = 24;
const LABEL_SLOT = 140;

const WIDEN: Record<EstimateConfidence, number> = { high: 0, medium: 0.25, low: 0.5 };
const FILLED: Record<EstimateConfidence, number> = { low: 1, medium: 2, high: 3 };
const DEFAULT_CONFIDENCE_LABELS: Record<EstimateConfidence, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};

/** Where `asking` sits against `[low, high]`, as a share of the nearest edge. */
export function computePriceVerdict(low: number, high: number, asking: number): PriceVerdict {
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  if (asking > hi) return { position: 'above', ratio: hi > 0 ? (asking - hi) / hi : 0 };
  if (asking < lo) return { position: 'below', ratio: lo > 0 ? (lo - asking) / lo : 0 };
  return { position: 'within', ratio: 0 };
}

const percent = (ratio: number) => `${Math.max(1, Math.round(ratio * 100))}%`;

export function defaultFormatVerdict(verdict: PriceVerdict): string {
  if (verdict.position === 'above') return `Above estimate by ${percent(verdict.ratio)}`;
  if (verdict.position === 'below') return `Below estimate by ${percent(verdict.ratio)}`;
  return 'Fair price';
}

export function priceVerdictTone(verdict: PriceVerdict, highAboveRatio = 0.1): AccentTone {
  if (verdict.position !== 'above') return 'success';
  return verdict.ratio > highAboveRatio ? 'error' : 'warning';
}

/** The drawn band and the bar's domain, in currency units. */
export function estimateGeometry(
  low: number,
  high: number,
  confidence: EstimateConfidence,
  extra: readonly (number | undefined)[],
): { band: [number, number]; soft: [number, number]; domain: [number, number] } {
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  const span = Math.max(hi - lo, hi * 0.01, 1);
  const widen = span * WIDEN[confidence];
  const soft: [number, number] = [lo - widen, hi + widen];
  const all = [soft[0], soft[1], ...extra.filter((v): v is number => v != null)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.12;
  return { band: [lo, hi], soft, domain: [min - pad, max + pad] };
}

function PriceEstimateComponent({
  low,
  high,
  estimate,
  asking,
  confidence,
  confidenceNote,
  format = formatEuros,
  title = 'Estimated price',
  askingLabel = 'Asking',
  formatVerdict = defaultFormatVerdict,
  highAboveRatio = 0.1,
  confidenceLabels,
  lowConfidenceVerdictLabel = 'Not enough data for a verdict',
  reasons,
  reasonsLabel = 'Why this estimate',
  expanded: expandedProp,
  onExpandedChange,
  comparables,
  comparablesLabel = (n) => `Based on ${n} comparable homes`,
  method,
  version,
  updated,
  style,
  testID,
}: PriceEstimateProps) {
  const theme = useTheme();
  useInteractiveWebCss(PROPERTY_INSIGHTS_STYLE_ID, PROPERTY_INSIGHTS_CSS);
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: false,
    onChange: onExpandedChange,
  });

  const lowConfidence = confidence === 'low';
  const geometry = estimateGeometry(low, high, confidence, [asking, estimate]);
  const [dMin, dMax] = geometry.domain;
  const px = (v: number) => (width == null || dMax === dMin ? 0 : ((v - dMin) / (dMax - dMin)) * width);
  const pct = (v: number) => (dMax === dMin ? 0 : ((v - dMin) / (dMax - dMin)) * 100);

  const verdict = asking != null ? computePriceVerdict(low, high, asking) : undefined;
  const confidenceLabel = confidenceLabels?.[confidence] ?? DEFAULT_CONFIDENCE_LABELS[confidence];
  const rangeText = `${format(Math.min(low, high))} – ${format(Math.max(low, high))}`;
  const footer = [method, version, updated].filter(Boolean).join(' · ');
  const hasReasons = (reasons && reasons.length > 0) || comparables != null;

  /** A label centred on `x`, clamped inside the bar. */
  const placed = (x: number): WebCssStyle => {
    if (width == null) return { position: 'absolute', left: 0, width: LABEL_SLOT, opacity: 0 };
    const slot = Math.min(LABEL_SLOT, width);
    const left = Math.min(Math.max(0, x - slot / 2), width - slot);
    const align = x - slot / 2 < 0 ? 'flex-start' : x + slot / 2 > width ? 'flex-end' : 'center';
    return { position: 'absolute', left, width: slot, alignItems: align };
  };

  const ring: WebCssStyle = { '--bloom-insight-ring': palette.ring };
  const barName = [
    `${title} ${rangeText}`,
    asking != null ? `${askingLabel} ${format(asking)}` : undefined,
    confidenceLabel,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      testID={testID}
      style={[
        {
          width: '100%',
          gap: 20,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: palette.hairline,
          backgroundColor: palette.card,
        },
        style,
      ]}
    >
      <View style={{ gap: 2 }}>
        <Text variant="body-medium" style={{ color: palette.textSecondary }}>
          {title}
        </Text>
        <Text
          variant="title-2-semibold"
          style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
          testID={testID ? `${testID}-range` : undefined}
        >
          {rangeText}
        </Text>
      </View>

      {/* The bar: one image with a composed name; its labels are part of the picture. */}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={barName}
        onLayout={onLayout}
        testID={testID ? `${testID}-bar` : undefined}
        style={{ width: '100%', height: asking != null ? 72 : 44 }}
      >
        {asking != null ? (
          <View style={[placed(px(asking)), { top: 0 }]}>
            <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {`${askingLabel} ${format(asking)}`}
            </Text>
          </View>
        ) : null}
        <View
          testID={testID ? `${testID}-track` : undefined}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: asking != null ? 28 : 0,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: palette.track,
            overflow: 'hidden',
          }}
        >
          {geometry.soft[0] < geometry.band[0] ? (
            <View
              testID={testID ? `${testID}-soft-band` : undefined}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${pct(geometry.soft[0])}%`,
                width: `${pct(geometry.soft[1]) - pct(geometry.soft[0])}%`,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: palette.bandSoft,
              }}
            />
          ) : null}
          <View
            testID={testID ? `${testID}-band` : undefined}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${pct(geometry.band[0])}%`,
              width: `${pct(geometry.band[1]) - pct(geometry.band[0])}%`,
              borderRadius: TRACK_HEIGHT / 2,
              backgroundColor: lowConfidence ? palette.bandSoft : palette.band,
            }}
          />
        </View>
        {estimate != null && !lowConfidence ? (
          <View
            testID={testID ? `${testID}-estimate` : undefined}
            style={{
              position: 'absolute',
              left: `${pct(estimate)}%`,
              marginLeft: -1,
              top: (asking != null ? 28 : 0) + TRACK_HEIGHT / 2 - 8,
              width: 2,
              height: 16,
              borderRadius: 1,
              backgroundColor: palette.muted,
            }}
          />
        ) : null}
        {asking != null ? (
          <View
            testID={testID ? `${testID}-asking` : undefined}
            style={{
              position: 'absolute',
              left: `${pct(asking)}%`,
              marginLeft: -1,
              top: 28 + TRACK_HEIGHT / 2 - MARKER_HEIGHT / 2,
              width: 2,
              height: MARKER_HEIGHT,
              borderRadius: 1,
              backgroundColor: palette.text,
            }}
          />
        ) : null}
        <View style={[placed(px(geometry.band[0])), { top: asking != null ? 50 : 20 }]}>
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary, fontVariant: ['tabular-nums'] }}>
            {format(geometry.band[0])}
          </Text>
        </View>
        <View style={[placed(px(geometry.band[1])), { top: asking != null ? 50 : 20 }]}>
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary, fontVariant: ['tabular-nums'] }}>
            {format(geometry.band[1])}
          </Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {verdict ? (
          lowConfidence ? (
            <Text variant="body-medium" style={{ color: palette.textSecondary }} testID={testID ? `${testID}-verdict` : undefined}>
              {lowConfidenceVerdictLabel}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row' }}>
              <Chip
                variant="subtle"
                size="large"
                color={priceVerdictTone(verdict, highAboveRatio)}
                testID={testID ? `${testID}-verdict` : undefined}
              >
                {formatVerdict(verdict)}
              </Chip>
            </View>
          )
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 4 }}>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={confidenceLabel}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={FILLED[confidence]}
            aria-valuetext={confidenceLabel}
            testID={testID ? `${testID}-meter` : undefined}
            style={{ flexDirection: 'row', gap: 3 }}
          >
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                testID={testID ? `${testID}-meter-${i}` : undefined}
                style={{
                  width: 16,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i < FILLED[confidence] ? palette.text : palette.track,
                }}
              />
            ))}
          </View>
          <Text
            variant="body-2-semibold"
            importantForAccessibility="no"
            accessibilityElementsHidden
            style={{ color: palette.text }}
          >
            {confidenceLabel}
          </Text>
          {confidenceNote ? (
            <Text variant="body-2-regular" style={{ color: palette.textSecondary, flexShrink: 1 }}>
              {confidenceNote}
            </Text>
          ) : null}
        </View>
      </View>

      {hasReasons ? (
        <View style={{ gap: 10 }}>
          <Pressable
            {...webDataSet({ bloomInsightPress: '' })}
            accessibilityRole="button"
            accessibilityLabel={reasonsLabel}
            aria-expanded={expanded}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 4 }, ring]}
            testID={testID ? `${testID}-reasons-toggle` : undefined}
          >
            <Text variant="body-semibold" style={{ color: palette.text }}>
              {reasonsLabel}
            </Text>
            {expanded ? (
              <RiArrowUpSLine width={18} height={18} fill={palette.text} />
            ) : (
              <RiArrowDownSLine width={18} height={18} fill={palette.text} />
            )}
          </Pressable>
          {expanded ? (
            <View style={{ gap: 8 }} testID={testID ? `${testID}-reasons` : undefined}>
              {reasons && reasons.length > 0 ? (
                <View role="list" style={{ gap: 6 }}>
                  {reasons.map((reason, i) => (
                    <View key={`${reason}-${i}`} role="listitem" style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 8, backgroundColor: palette.textSecondary }} />
                      <Text variant="body-regular" style={{ flex: 1, minWidth: 0, color: palette.text }}>
                        {reason}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {comparables != null ? (
                <Text variant="body-2-regular" style={{ color: palette.textSecondary }} testID={testID ? `${testID}-comparables` : undefined}>
                  {comparablesLabel(comparables)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {footer ? (
        <Text variant="caption-1-regular" style={{ color: palette.muted }} testID={testID ? `${testID}-footer` : undefined}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export const PriceEstimate = memo(PriceEstimateComponent);
PriceEstimate.displayName = 'PriceEstimate';
