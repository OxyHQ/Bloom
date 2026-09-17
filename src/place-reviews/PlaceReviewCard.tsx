import React, { memo, useCallback, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Chip } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import {
  RiCheckLine,
  RiCloseLine,
  RiFlagLine,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
} from '../icons/remix';
import { useContainerWidth } from '../listing-details/use-container-width';
import { Rating, RatingBar } from '../rating';
import type { WebCssStyle } from '../styles/web-view-style';
import { HousingCard, HousingToggleButton, useHousingPalette, useHousingWebCss } from '../tenancy/parts';
import { IS_WEB, webData } from '../tenancy/shared';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_REVIEW_CATEGORIES_WIDE_MIN_WIDTH } from './constants';
import type { PlaceReviewCardProps } from './types';

/**
 * One past tenant's review of a building.
 *
 *   card        the housing card, 16 between blocks
 *   author      an optional 40 initial disc, the anonymised author line
 *               body-semibold and the date caption-1-regular text-secondary;
 *               the overall `Rating` (small) on the right
 *   chips       small subtle `Chip`s with a 12 icon: would recommend (success)
 *               or not (neutral); deposit returned (success) or not (error)
 *   categories  `RatingBar`s, 2 columns 24 apart from 520 wide, 1 below
 *   text        body-regular clamped to 4 lines; "Show more" (body-semibold,
 *               underlined) only when the text IS clamped — measured against an
 *               invisible unclamped copy. `aria-expanded` + `expanded`.
 *   footer      a hairline, then the "Helpful" pill toggle with its count
 *               (`aria-pressed` + `selected`) and a secondary link "Report" button
 */

function ChipIcon({ icon: Icon, tone }: { icon: typeof RiCheckLine; tone: AccentTone }) {
  const theme = useTheme();
  const color = resolveAccentColors(theme.colors, tone, 'subtle').foreground;
  return <Icon width={12} height={12} fill={color} />;
}

function PlaceReviewCardComponent({
  authorLabel,
  authorInitial,
  date,
  rating,
  categories,
  depositReturned,
  depositReturnedLabel = 'Deposit returned',
  depositNotReturnedLabel = 'Deposit not returned',
  wouldRecommend,
  recommendLabel = 'Would recommend',
  notRecommendLabel = "Wouldn't recommend",
  text,
  numberOfLines = 4,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  expanded: expandedProp,
  onExpandedChange,
  helpfulCount,
  helpful = false,
  onHelpfulChange,
  helpfulLabel = 'Helpful',
  onReport,
  reportLabel = 'Report',
  layout = 'auto',
  style,
  testID,
}: PlaceReviewCardProps) {
  useHousingWebCss();
  const palette = useHousingPalette();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const { width, onLayout } = useContainerWidth();
  const wide =
    layout === 'wide' || (layout === 'auto' && width != null && width >= PLACE_REVIEW_CATEGORIES_WIDE_MIN_WIDTH);

  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: false,
    onChange: onExpandedChange,
  });
  const clamps = numberOfLines > 0;
  const [clampedHeight, setClampedHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const onClampedLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!expanded) setClampedHeight(Math.round(event.nativeEvent.layout.height));
    },
    [expanded],
  );
  const onFullLayout = useCallback((event: LayoutChangeEvent) => {
    setFullHeight(Math.round(event.nativeEvent.layout.height));
  }, []);
  const truncatable = clamps && clampedHeight > 0 && fullHeight > clampedHeight + 1;

  const ring: WebCssStyle = { '--bloom-housing-ring': palette.ring, borderRadius: 4, alignSelf: 'flex-start' };

  const helpfulText = helpfulCount != null && helpfulCount > 0 ? `${helpfulLabel} · ${helpfulCount}` : helpfulLabel;
  const cellWidth = wide && width != null ? Math.floor((width - 24) / 2) : undefined;

  return (
    <HousingCard style={style} testID={testID}>
      <View onLayout={onLayout} style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {authorInitial ? <Avatar name={authorInitial} size={40} testID={id('avatar')} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="body-semibold" numberOfLines={1} style={{ color: palette.text }} testID={id('author')}>
              {authorLabel}
            </Text>
            {date ? (
              <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                {date}
              </Text>
            ) : null}
          </View>
          <Rating value={rating} size="small" testID={id('rating')} />
        </View>

        {wouldRecommend != null || depositReturned != null ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {wouldRecommend != null ? (
              <Chip
                size="small"
                variant="subtle"
                color={wouldRecommend ? 'success' : 'default'}
                startIcon={
                  <ChipIcon
                    icon={wouldRecommend ? RiThumbUpLine : RiThumbDownLine}
                    tone={wouldRecommend ? 'success' : 'default'}
                  />
                }
                testID={id('recommend')}
              >
                {wouldRecommend ? recommendLabel : notRecommendLabel}
              </Chip>
            ) : null}
            {depositReturned != null ? (
              <Chip
                size="small"
                variant="subtle"
                color={depositReturned ? 'success' : 'error'}
                startIcon={
                  <ChipIcon
                    icon={depositReturned ? RiCheckLine : RiCloseLine}
                    tone={depositReturned ? 'success' : 'error'}
                  />
                }
                testID={id('deposit')}
              >
                {depositReturned ? depositReturnedLabel : depositNotReturnedLabel}
              </Chip>
            ) : null}
          </View>
        ) : null}

        {categories && categories.length > 0 ? (
          <View
            testID={id('categories')}
            style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 8 }}
          >
            {categories.map((category, index) => (
              <RatingBar
                key={`${category.label}-${index}`}
                label={category.label}
                value={category.value}
                display={category.display ?? category.value.toFixed(1)}
                style={{ width: cellWidth ?? '100%' }}
                testID={id(`category-${index}`)}
              />
            ))}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <View style={{ overflow: 'hidden' }}>
            <Text
              variant="body-regular"
              numberOfLines={clamps && !expanded ? numberOfLines : undefined}
              onLayout={onClampedLayout}
              style={{ color: palette.text }}
              testID={id('text')}
            >
              {text}
            </Text>
            {clamps ? (
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(IS_WEB ? { 'aria-hidden': true } : null)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}
              >
                <Text variant="body-regular" onLayout={onFullLayout}>
                  {text}
                </Text>
              </View>
            ) : null}
          </View>
          {truncatable ? (
            <Pressable
              {...webData({ bloomHousingFocus: '' })}
              accessibilityRole="button"
              accessibilityLabel={expanded ? showLessLabel : showMoreLabel}
              aria-expanded={expanded}
              accessibilityState={{ expanded }}
              onPress={() => setExpanded(!expanded)}
              style={ring}
              testID={id('toggle')}
            >
              <Text variant="body-semibold" style={{ color: palette.text, textDecorationLine: 'underline' }}>
                {expanded ? showLessLabel : showMoreLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {onHelpfulChange || onReport ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: palette.hairline,
            }}
          >
            {onHelpfulChange ? (
              <HousingToggleButton
                label={helpfulText}
                accessibilityLabel={
                  helpfulCount != null ? `${helpfulLabel}, ${helpfulCount}` : helpfulLabel
                }
                pressed={helpful}
                onPress={() => onHelpfulChange(!helpful)}
                icon={RiThumbUpLine}
                pressedIcon={RiThumbUpFill}
                testID={id('helpful')}
              />
            ) : (
              <View />
            )}
            {onReport ? (
              <Button
                variant="link"
                linkTone="secondary"
                size="small"
                leadingIcon={RiFlagLine}
                onPress={onReport}
                testID={id('report')}
              >
                {reportLabel}
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    </HousingCard>
  );
}

export const PlaceReviewCard = memo(PlaceReviewCardComponent);
PlaceReviewCard.displayName = 'PlaceReviewCard';
