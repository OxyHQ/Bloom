import React, { memo } from 'react';
import { Platform, View } from 'react-native';

import { RiStarFill } from '../icons/remix/RiStarFill';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import type { RatingProps, RatingSize } from './types';

/**
 * Bloom's compact rating: a star, the value, and an optional review count.
 *
 *             star   value              count
 *   small     14     body-2-semibold    body-2-regular
 *   medium    16     body-semibold      body-regular
 *
 * Star and value are text-primary, the count text-secondary; 4px between the
 * star and the value, 4px before the count.
 *
 * It reads as ONE element: a single accessible name ("Rated 4.92 out of 5, 128
 * reviews") on the row — `role="img"` on web, where a plain `div` with an
 * `aria-label` is not announced, and one `accessible` element on native — so a
 * screen reader never reads "star, 4.92, open paren, 128".
 *
 * `variant="stars"` draws five stars before the value instead of one, 2px
 * apart, each filled to its share of the value: the unfilled star in
 * `emptyStarColor` (border), and over it the filled star clipped to the
 * fraction. The fill comes from `fillValue` when given, else from `value`
 * (parsed by `parseRatingValue` when it is a localised string). The clip is anchored with a LOGICAL inset (`insetInlineStart`) so a
 * right-to-left row fills from the right — the root carries
 * `useDirectionProps()` for react-native-web to resolve it.
 *
 * `color` / `starColor` / `countColor` recolour it for a surface the theme's
 * text pair cannot sit on (a brand-coloured hero).
 */

const SIZE_CONFIG: Record<RatingSize, { star: number; value: TypeScaleVariant; count: TypeScaleVariant }> = {
  small: { star: 14, value: 'body-2-semibold', count: 'body-2-regular' },
  medium: { star: 16, value: 'body-semibold', count: 'body-regular' },
};

/** 5 → "5.0", 4.9 → "4.9", 4.923 → "4.92". */
export function formatRatingValue(value: number | string): string {
  if (typeof value === 'string') return value;
  if (Number.isInteger(value)) return value.toFixed(1);
  return String(Math.round(value * 100) / 100);
}

const IS_WEB = Platform.OS === 'web';

/** The number of stars in the `stars` variant. */
const STAR_COUNT = 5;
const STAR_GAP = 2;

/**
 * Bidi isolates and marks (U+2066–U+2069 LRI/RLI/FSI/PDI, U+200E/U+200F
 * LRM/RLM, U+061C ALM) a localised string is wrapped in. None of them are
 * part of the number.
 */
const FORMAT_CHARACTERS = /[\u2066-\u2069\u200E\u200F\u061C]/g;
/** Arabic-Indic (U+0660) and extended Arabic-Indic (U+06F0) digit zeros. */
const ARABIC_ZERO = 0x0660;
const EXTENDED_ARABIC_ZERO = 0x06f0;

/**
 * The number a drawn rating value stands for, for the `stars` fill: a number
 * is itself; a string is read after dropping bidi/format characters, with a
 * comma or Arabic decimal separator (U+066B) accepted as the decimal point and
 * Arabic-Indic digits accepted — so "4,5" wrapped in FSI…PDI is 4.5. Otherwise it is
 * `Number()`'s reading, so anything unreadable is `NaN` (no fill).
 */
export function parseRatingValue(value: number | string): number {
  if (typeof value === 'number') return value;
  const text = value
    .replace(FORMAT_CHARACTERS, '')
    .trim()
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - ARABIC_ZERO))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - EXTENDED_ARABIC_ZERO))
    .replace(/[,\u066B]/, '.');
  return Number(text);
}

/** How much of star `index` (0-based) a rating fills, `0..1`. */
export function starFill(rating: number, index: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.min(1, Math.max(0, rating - index));
}

/** A fill on the five-star scale, clamped to `0..5`; `NaN` stays `NaN` (no fill). */
function clampRating(rating: number): number {
  return Math.min(STAR_COUNT, Math.max(0, rating));
}

function StarRow({
  rating,
  size,
  fill,
  empty,
  testID,
}: {
  rating: number;
  size: number;
  fill: string;
  empty: string;
  testID?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: STAR_GAP }} testID={testID}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const share = starFill(rating, index);
        return (
          <View key={index} style={{ width: size, height: size }}>
            <RiStarFill width={size} height={size} fill={empty} />
            {share > 0 ? (
              <View
                testID={testID ? `${testID}-${index}` : undefined}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  insetInlineStart: 0,
                  width: size * share,
                  overflow: 'hidden',
                  alignItems: 'flex-start',
                }}
              >
                <RiStarFill width={size} height={size} fill={fill} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function RatingComponent({
  value,
  count,
  countStyle = 'parenthesis',
  reviewsLabel = 'reviews',
  newLabel = 'New',
  size = 'medium',
  variant = 'compact',
  color,
  starColor,
  countColor,
  emptyStarColor,
  fillValue,
  accessibilityLabel,
  style,
  testID,
}: RatingProps) {
  const theme = useTheme();
  const directionProps = useDirectionProps();
  const textColor = color ?? theme.colors.text;
  const starPaint = starColor ?? textColor;
  const countPaint = countColor ?? color ?? theme.colors.textSecondary;
  const config = SIZE_CONFIG[size];
  const rated = value != null && value !== '';
  const shownValue = rated ? formatRatingValue(value) : newLabel;
  const hasCount = rated && count != null && count !== '';
  const countText = hasCount
    ? countStyle === 'reviews'
      ? `· ${count} ${reviewsLabel}`
      : `(${count})`
    : null;
  const name =
    accessibilityLabel ??
    (rated
      ? `Rated ${shownValue} out of 5${hasCount ? `, ${count} ${reviewsLabel}` : ''}`
      : newLabel);

  return (
    <View
      {...directionProps}
      testID={testID}
      accessible
      accessibilityLabel={name}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}
    >
      {variant === 'stars' && rated ? (
        <StarRow
          rating={clampRating(fillValue ?? parseRatingValue(value))}
          size={config.star}
          fill={starPaint}
          empty={emptyStarColor ?? theme.colors.border}
          testID={testID ? `${testID}-stars` : undefined}
        />
      ) : variant === 'stars' ? null : (
        <RiStarFill width={config.star} height={config.star} fill={starPaint} />
      )}
      <Text variant={config.value} style={{ color: textColor, fontVariant: ['tabular-nums'] }}>
        {shownValue}
      </Text>
      {countText != null && (
        <Text variant={config.count} style={{ color: countPaint }}>
          {countText}
        </Text>
      )}
    </View>
  );
}

export const Rating = memo(RatingComponent);
Rating.displayName = 'Rating';
