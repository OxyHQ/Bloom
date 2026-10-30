import { memo } from 'react';
import { View } from 'react-native';

import { RiStarFill } from '../icons/remix/RiStarFill';
import { formatNumber, formatPercent } from '../locale/format-number';
import { useMessages } from '../locale/messages';
import { Meter } from '../stat-bar';
import { IS_WEB } from '../styles/platform';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { RATING_MESSAGES } from './messages';
import type { RatingSummaryProps } from './types';

const STARS = [5, 4, 3, 2, 1] as const;
/** The distribution's star glyphs: 8 each, 1 apart, right-aligned in 44. */
const GLYPH = 8;
const GLYPH_COLUMN = 5 * GLYPH + 4;

/**
 * A product's ratings at a glance: the average beside the 5→1 distribution.
 *
 *   average      display-2-bold, text-primary, one decimal in the locale's digits
 *   scale        body-2-semibold, text-secondary ("out of 5")
 *   rows         5…1 stars (8px glyphs, text-secondary, right-aligned in 44)
 *                beside a 4px `Meter` of that star's share, 3 apart
 *   count        body-2-regular, text-secondary, right-aligned under the bars
 *
 * Every bar is its star's share of `count`, so the bars always agree with the
 * count printed under them. With `average: null` (no ratings) only
 * `noRatingsLabel` is drawn: an empty distribution next to a "0.0" would say
 * the product was rated badly.
 *
 * Semantics: the average and scale are one element, named "Rated 4.5 out of 5,
 * 128 reviews"; each bar is a `progressbar` named by its stars ("4 stars") with
 * its share as `aria-valuetext` ("12%"); the glyphs are decoration.
 */
function RatingSummaryComponent({
  average,
  count,
  distribution,
  countLabel,
  outOfLabel,
  noRatingsLabel,
  accessibilityLabel,
  style,
  testID,
}: RatingSummaryProps) {
  const { locale, messages } = useMessages(RATING_MESSAGES);
  const theme = useTheme();
  const secondary = theme.colors.textSecondary;

  if (average === null) {
    return (
      <View style={style} testID={testID}>
        <Text
          variant="body-regular"
          style={{ color: secondary }}
          testID={testID ? `${testID}-empty` : undefined}
        >
          {noRatingsLabel ?? messages.noRatings}
        </Text>
      </View>
    );
  }

  const value = formatNumber(average, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const reviews = countLabel ?? messages.reviews(formatNumber(count, locale));
  const total = Math.max(0, count);

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 24 }, style]}
      testID={testID}
    >
      <View
        accessible
        role="img"
        accessibilityLabel={accessibilityLabel ?? messages.ratedWithReviews(value, reviews)}
        style={{ alignItems: 'center' }}
        testID={testID ? `${testID}-average` : undefined}
      >
        <Text variant="display-2-bold" style={{ color: theme.colors.text }}>
          {value}
        </Text>
        <Text variant="body-2-semibold" style={{ color: secondary }}>
          {outOfLabel ?? messages.outOfFive}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3, paddingBottom: 2 }}>
        {STARS.map((stars) => {
          const share = total > 0 ? Math.max(0, distribution[stars] ?? 0) / total : 0;
          return (
            <View key={stars} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(IS_WEB ? { 'aria-hidden': true } : null)}
                style={{
                  width: GLYPH_COLUMN,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 1,
                }}
              >
                {STARS.slice(5 - stars).map((glyph) => (
                  <RiStarFill key={glyph} width={GLYPH} height={GLYPH} fill={secondary} />
                ))}
              </View>
              <Meter
                value={share}
                max={1}
                height={4}
                accessibilityLabel={messages.star(stars, 5)}
                valueText={formatPercent(share, locale)}
                style={{ flex: 1, minWidth: 0 }}
                testID={testID ? `${testID}-bar-${stars}` : undefined}
                fillTestID={testID ? `${testID}-fill-${stars}` : undefined}
              />
            </View>
          );
        })}
        <Text
          variant="body-2-regular"
          style={{ color: secondary, textAlign: 'right', marginTop: 4 }}
          testID={testID ? `${testID}-count` : undefined}
        >
          {reviews}
        </Text>
      </View>
    </View>
  );
}

export const RatingSummary = memo(RatingSummaryComponent);
RatingSummary.displayName = 'RatingSummary';
