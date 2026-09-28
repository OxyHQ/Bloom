import React, { memo } from 'react';
import { View } from 'react-native';

import { RiShieldCheckLine } from '../icons/remix/RiShieldCheckLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { ReviewSummary } from '../listing-details/ReviewSummary';
import { useMessages } from '../locale/messages';
import { useHousingPalette } from '../tenancy/parts';
import { Text } from '../typography';
import { PLACE_REVIEWS_MESSAGES } from './messages';
import type { PlaceReviewSummaryProps } from './types';

/**
 * The top of a building's reviews: `ReviewSummary` (the listing-details part,
 * reused — not copied) with housing categories, then the tenancy stat lines.
 *
 *   summary   `ReviewSummary`: the big rating, `title`, "46 reviews" and the
 *             category `RatingBar`s (2 columns from 640 wide)
 *   stats     a row that wraps, 24 apart: a 20 icon + body-medium line —
 *             "Deposit returned in 82% of tenancies", "91% would recommend
 *             living here"; each one accessible element
 *
 * The rates are fractions (0..1) and are rounded to whole percents here; every
 * sentence is a formatter prop for translation.
 */

const toPercent = (rate: number) => Math.round(Math.min(1, Math.max(0, rate)) * 100);

function PlaceReviewSummaryComponent({
  rating,
  title,
  reviewCount,
  formatReviewCount: formatReviewCountProp,
  categories,
  depositReturnedRate,
  formatDepositReturned: formatDepositReturnedProp,
  recommendRate,
  formatRecommend: formatRecommendProp,
  style,
  testID,
}: PlaceReviewSummaryProps) {
  const { messages } = useMessages(PLACE_REVIEWS_MESSAGES);
  // A string count is drawn as given; a number is counted in the language.
  const formatReviewCount =
    formatReviewCountProp ??
    ((count: number | string) => (typeof count === 'number' ? messages.reviewCount(count) : count));
  const formatDepositReturned = formatDepositReturnedProp ?? messages.depositRate;
  const formatRecommend = formatRecommendProp ?? messages.recommendRate;
  const palette = useHousingPalette();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const stats: { key: string; icon: typeof RiShieldCheckLine; text: string }[] = [];
  if (depositReturnedRate != null) {
    stats.push({ key: 'deposit', icon: RiShieldCheckLine, text: formatDepositReturned(toPercent(depositReturnedRate)) });
  }
  if (recommendRate != null) {
    stats.push({ key: 'recommend', icon: RiThumbUpLine, text: formatRecommend(toPercent(recommendRate)) });
  }

  return (
    <View style={[{ width: '100%', gap: 24 }, style]} testID={testID}>
      <ReviewSummary
        rating={rating}
        title={title}
        description={reviewCount != null ? formatReviewCount(reviewCount) : undefined}
        categories={categories}
        testID={id('summary')}
      />
      {stats.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 12 }}>
          {stats.map(({ key, icon: Icon, text }) => (
            <View
              key={key}
              accessible
              accessibilityLabel={text}
              testID={id(key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Icon width={20} height={20} fill={palette.text} />
              <Text variant="body-medium" style={{ color: palette.text }}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const PlaceReviewSummary = memo(PlaceReviewSummaryComponent);
PlaceReviewSummary.displayName = 'PlaceReviewSummary';
