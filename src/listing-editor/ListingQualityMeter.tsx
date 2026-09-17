import React, { memo, useEffect, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckboxBlankCircleLine } from '../icons/remix/RiCheckboxBlankCircleLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiLightbulbFlashLine } from '../icons/remix/RiLightbulbFlashLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ListingQualityItem, ListingQualityMeterProps } from './types';

/**
 * How complete a listing is: a score ring, a checklist of what is left, and
 * tips.
 *
 *   head      the 72 ring (6 stroke, track neutral-200 / dark neutral-700,
 *             progress accent-500, round cap) with the score (headline-semibold)
 *             in it; title (headline-semibold) and summary (body-regular,
 *             text-secondary) beside it
 *   rows      12 apart; a 20 glyph — filled success check when done, an empty
 *             neutral-400 circle when not — the label (body-medium; done rows in
 *             text-secondary) and the tip under an open row (caption-1-regular,
 *             text-secondary). A row with `onPress` is a button with a chevron,
 *             neutral-50 wash on hover (dark neutral-900), radius 12
 *   tips      a neutral-50 panel (dark neutral-900), radius 16, p 16, a
 *             lightbulb glyph and the tips as lines
 *
 * The score defaults to the done items' share of the total weight, rounded.
 * The ring eases on web over 400ms (not under reduced motion); native snaps.
 *
 * Accessibility: the ring is a `progressbar` 0..100 named by
 * `accessibilityLabel`; each row's name carries its state ("Add at least 5
 * photos, To do").
 */

const IS_WEB = Platform.OS === 'web';
const RING = 72;
const STROKE = 6;

const STYLE_ID = 'bloom-listing-quality-web-css';
const ARC = '[data-bloom-quality-arc]';
const ROW = '[data-bloom-quality-row]';
const CSS = `
${ARC} circle:last-child {
  transition: stroke-dashoffset 400ms ease-out;
}
${ROW} {
  outline: none;
  cursor: pointer;
}
${ROW}:focus-visible {
  outline: 2px solid var(--bloom-quality-ring, currentColor);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  ${ARC} circle:last-child {
    transition: none;
  }
}
`;

/** The weighted share of done items, 0..100, rounded. Pure. */
export function listingQualityScore(items: ReadonlyArray<ListingQualityItem>): number {
  let total = 0;
  let done = 0;
  for (const item of items) {
    const weight = Math.max(0, item.weight ?? 1);
    total += weight;
    if (item.done) done += weight;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

interface QualityPaint {
  track: string;
  progress: string;
  text: string;
  textSecondary: string;
  done: string;
  todo: string;
  wash: string;
  ring: string;
}

function resolveQualityPaint(theme: Theme): QualityPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    track: dark ? n[700] : n[200],
    progress: accent[500],
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    done: theme.colors.success,
    todo: n[400],
    wash: dark ? n[900] : n[50],
    ring: accent[500],
  };
}

function ListingQualityMeterComponent({
  items,
  score: scoreProp,
  title = 'Listing quality',
  summary,
  tips,
  tipsTitle = 'Tips',
  formatScore = (score) => `${score}`,
  accessibilityLabel = 'Listing quality score',
  doneLabel = 'Done',
  todoLabel = 'To do',
  style,
  testID,
}: ListingQualityMeterProps) {
  const theme = useTheme();
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  const paint = useMemo(() => resolveQualityPaint(theme), [theme]);
  const score = Math.min(100, Math.max(0, Math.round(scoreProp ?? listingQualityScore(items))));
  const line = summary ?? (score < 50 ? 'Needs work' : score < 80 ? 'Good' : 'Excellent');
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View testID={testID} style={[{ gap: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          role="progressbar"
          accessibilityLabel={accessibilityLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-valuetext={`${formatScore(score)}, ${line}`}
          testID={testID ? `${testID}-ring` : undefined}
          style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}
        >
          <View {...webDataSet({ bloomQualityArc: '' })} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke={paint.track} strokeWidth={STROKE} fill="none" />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={radius}
                stroke={paint.progress}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap={score > 0 ? 'round' : 'butt'}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
            </Svg>
          </View>
          <Text variant="headline-semibold" style={{ color: paint.text, fontVariant: ['tabular-nums'] }}>
            {formatScore(score)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="headline-semibold" style={{ color: paint.text }}>
            {title}
          </Text>
          <Text variant="body-regular" style={{ color: paint.textSecondary }}>
            {line}
          </Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        {items.map((item) => (
          <QualityRow
            key={item.key}
            item={item}
            paint={paint}
            doneLabel={doneLabel}
            todoLabel={todoLabel}
            testID={testID ? `${testID}-item-${item.key}` : undefined}
          />
        ))}
      </View>

      {tips && tips.length > 0 ? (
        <View
          testID={testID ? `${testID}-tips` : undefined}
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 16,
            backgroundColor: paint.wash,
          }}
        >
          <RiLightbulbFlashLine width={20} height={20} fill={paint.text} />
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text variant="body-semibold" style={{ color: paint.text }}>
              {tipsTitle}
            </Text>
            {tips.map((tip) => (
              <Text key={tip} variant="body-2-regular" style={{ color: paint.textSecondary }}>
                {tip}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function QualityRow({
  item,
  paint,
  doneLabel,
  todoLabel,
  testID,
}: {
  item: ListingQualityItem;
  paint: QualityPaint;
  doneLabel: string;
  todoLabel: string;
  testID?: string;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const name = `${item.label}, ${item.done ? doneLabel : todoLabel}`;
  const Glyph = item.done ? RiCheckboxCircleFill : RiCheckboxBlankCircleLine;

  const content = (
    <>
      <View style={{ paddingTop: 1 }}>
        <Glyph width={20} height={20} fill={item.done ? paint.done : paint.todo} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body-medium" style={{ color: item.done ? paint.textSecondary : paint.text }}>
          {item.label}
        </Text>
        {item.tip && !item.done ? (
          <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
            {item.tip}
          </Text>
        ) : null}
      </View>
    </>
  );

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    marginLeft: -8,
    marginRight: -8,
    borderRadius: 12,
    '--bloom-quality-ring': paint.ring,
  };

  if (!item.onPress) {
    return (
      <View accessible accessibilityLabel={name} testID={testID} style={rowStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      role="button"
      accessibilityLabel={name}
      onPress={item.onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...webDataSet({ bloomQualityRow: '' })}
      testID={testID}
      style={{ ...rowStyle, backgroundColor: hovered || pressed ? paint.wash : 'transparent' }}
    >
      {content}
      <View style={{ paddingTop: 1 }}>
        <RiArrowRightSLine width={20} height={20} fill={paint.textSecondary} />
      </View>
    </Pressable>
  );
}

export const ListingQualityMeter = memo(ListingQualityMeterComponent);
ListingQualityMeter.displayName = 'ListingQualityMeter';
