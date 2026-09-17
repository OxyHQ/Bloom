import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RatingBar } from '../rating';
import { formatRatingValue } from '../rating/Rating';
import { RiStarFill } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { REVIEW_SUMMARY_WIDE_MIN_WIDTH } from './constants';
import { IS_WEB, resolveListingPalette } from './shared';
import type { ReviewSummaryProps } from './types';
import { useContainerWidth } from './use-container-width';

/**
 * The top of a reviews section.
 *
 *   score          a 32 star + the rating in display-2-semibold, text-primary;
 *                  `title` headline-semibold and `description` body-regular
 *                  text-secondary beside it. One accessible element ("Rated
 *                  4.92 out of 5").
 *   distribution   `distributionLabel` (body-2-semibold) over five `RatingBar`s
 *                  with `labelWidth` 12, `max` 1
 *   categories     16px icon + `RatingBar` (label flexes, bar 96), in 2
 *                  columns from 640 wide, 1 below; rows 12 apart, columns 32
 *   layout         from 640 wide the distribution (width 240) sits left of
 *                  the categories, with a hairline between; below, stacked
 */
const DISTRIBUTION_WIDTH = 240;
const COLUMN_GAP = 32;

function ReviewSummaryComponent({
  rating,
  title,
  description,
  categories,
  distribution,
  distributionLabel = 'Overall rating',
  accessibilityLabel,
  style,
  testID,
}: ReviewSummaryProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();
  const wide = width != null && width >= REVIEW_SUMMARY_WIDE_MIN_WIDTH;
  const shown = formatRatingValue(rating);

  const score = (
    <View
      accessible
      accessibilityLabel={
        accessibilityLabel ??
        [`Rated ${shown} out of 5`, title, description].filter(Boolean).join(', ')
      }
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
      testID={testID ? `${testID}-score` : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <RiStarFill width={32} height={32} fill={palette.text} />
        <Text
          variant="display-2-semibold"
          style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
          testID={testID ? `${testID}-value` : undefined}
        >
          {shown}
        </Text>
      </View>
      {title || description ? (
        <View style={{ flexShrink: 1, gap: 2 }}>
          {title ? (
            <Text variant="headline-semibold" style={{ color: palette.text }}>
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="body-regular" style={{ color: palette.textSecondary }}>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const distributionBlock =
    distribution && distribution.length > 0 ? (
      <View
        style={{ gap: 8, width: wide ? DISTRIBUTION_WIDTH : '100%' }}
        testID={testID ? `${testID}-distribution` : undefined}
      >
        <Text variant="body-2-semibold" style={{ color: palette.text }}>
          {distributionLabel}
        </Text>
        {distribution.map((row, index) => (
          <RatingBar
            key={`${row.label}-${index}`}
            label={row.label}
            labelWidth={12}
            value={row.value}
            max={1}
            display={row.display}
            testID={testID ? `${testID}-distribution-${index}` : undefined}
          />
        ))}
      </View>
    ) : null;

  const columns = wide ? 2 : 1;
  const categoriesWidth =
    width == null
      ? undefined
      : wide
        ? width - (distributionBlock ? DISTRIBUTION_WIDTH + COLUMN_GAP * 2 + 1 : 0)
        : width;
  const cellWidth =
    categoriesWidth != null && columns === 2
      ? Math.floor((categoriesWidth - COLUMN_GAP) / 2)
      : undefined;

  const categoriesBlock =
    categories && categories.length > 0 ? (
      <View
        style={[
          { flexDirection: 'row', flexWrap: 'wrap', columnGap: COLUMN_GAP, rowGap: 12, alignContent: 'flex-start' },
          wide ? { flex: 1, minWidth: 0 } : { width: '100%' },
        ]}
        testID={testID ? `${testID}-categories` : undefined}
      >
        {categories.map(({ label, value, display, icon: Icon }, index) => (
          <View
            key={`${label}-${index}`}
            style={{
              width: cellWidth ?? '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {Icon ? (
              <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <Icon width={16} height={16} fill={palette.textSecondary} />
              </View>
            ) : null}
            <RatingBar
              label={label}
              value={value}
              display={display ?? value.toFixed(1)}
              style={{ flex: 1, minWidth: 0 }}
              testID={testID ? `${testID}-category-${index}` : undefined}
            />
          </View>
        ))}
      </View>
    ) : null;

  return (
    <View onLayout={onLayout} style={[{ width: '100%', gap: 32 }, style]} testID={testID}>
      {score}
      {distributionBlock || categoriesBlock ? (
        <View
          style={
            wide
              ? { flexDirection: 'row', alignItems: 'flex-start', gap: COLUMN_GAP }
              : { flexDirection: 'column', gap: 32 }
          }
        >
          {distributionBlock}
          {wide && distributionBlock && categoriesBlock ? (
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: palette.hairline }} />
          ) : null}
          {categoriesBlock}
        </View>
      ) : null}
    </View>
  );
}

export const ReviewSummary = memo(ReviewSummaryComponent);
ReviewSummary.displayName = 'ReviewSummary';
