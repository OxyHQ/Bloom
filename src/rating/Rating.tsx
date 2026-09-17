import React, { memo } from 'react';
import { Platform, View } from 'react-native';

import { RiStarFill } from '../icons/remix/RiStarFill';
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

function RatingComponent({
  value,
  count,
  countStyle = 'parenthesis',
  reviewsLabel = 'reviews',
  newLabel = 'New',
  size = 'medium',
  accessibilityLabel,
  style,
  testID,
}: RatingProps) {
  const theme = useTheme();
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
      testID={testID}
      accessible
      accessibilityLabel={name}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}
    >
      <RiStarFill width={config.star} height={config.star} fill={theme.colors.text} />
      <Text variant={config.value} style={{ color: theme.colors.text, fontVariant: ['tabular-nums'] }}>
        {shownValue}
      </Text>
      {countText != null && (
        <Text variant={config.count} style={{ color: theme.colors.textSecondary }}>
          {countText}
        </Text>
      )}
    </View>
  );
}

export const Rating = memo(RatingComponent);
Rating.displayName = 'Rating';
