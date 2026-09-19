import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { Avatar } from '../avatar';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  IS_WEB,
  LISTING_DETAILS_CSS,
  LISTING_DETAILS_STYLE_ID,
  resolveListingPalette,
  type ListingPalette,
} from './shared';
import type { ReviewCardProps } from './types';

/**
 * One guest review.
 *
 *   author     avatar 48 + name headline-semibold + subtitle body-2-regular
 *              text-secondary, gap 12
 *   meta       five 10px stars (filled text-primary, empty neutral-300 /
 *              dark neutral-700), "·", date body-2-medium; one accessible
 *              element for the stars ("Rated 5 out of 5")
 *   text       body-regular, clamped to `numberOfLines` (4)
 *   show more  body-semibold underlined, drawn only when the text IS clamped —
 *              measured, not guessed from its length: an invisible unclamped
 *              copy is laid out behind the clamped text and the two heights
 *              compared. `aria-expanded` on web, `expanded` on native.
 *   response   a radius-12 block (neutral-50, dark neutral-900), padding 16:
 *              title body-2-semibold, date caption-1-regular, text body-regular
 */

const STAR_SIZE = 10;

function Stars({ rating, palette, testID }: { rating: number; palette: ListingPalette; testID?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View
      accessible
      accessibilityLabel={`Rated ${filled} out of 5`}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
      testID={testID}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <RiStarFill
          key={index}
          width={STAR_SIZE}
          height={STAR_SIZE}
          fill={index < filled ? palette.text : palette.starEmpty}
        />
      ))}
    </View>
  );
}

function ReviewCardComponent({
  name,
  avatar,
  subtitle,
  rating,
  date,
  text,
  numberOfLines = 4,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  expanded: expandedProp,
  onExpandedChange,
  hostResponse,
  avatarVariant = 'thumb',
  style,
  testID,
}: ReviewCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
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
      // Only the collapsed height says whether the text is clamped.
      if (!expanded) setClampedHeight(Math.round(event.nativeEvent.layout.height));
    },
    [expanded],
  );
  const onFullLayout = useCallback((event: LayoutChangeEvent) => {
    setFullHeight(Math.round(event.nativeEvent.layout.height));
  }, []);
  const truncatable = clamps && clampedHeight > 0 && fullHeight > clampedHeight + 1;

  const ring: WebCssStyle = { '--bloom-listing-ring': palette.ring, borderRadius: 4, alignSelf: 'flex-start' };

  return (
    <View style={[{ gap: 12 }, style]} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar source={avatar} variant={avatarVariant} size={48} name={name} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="headline-semibold" numberOfLines={1} style={{ color: palette.text }}>
            {name}
          </Text>
          {subtitle ? (
            <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rating != null || date ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {rating != null ? (
            <Stars rating={rating} palette={palette} testID={testID ? `${testID}-stars` : undefined} />
          ) : null}
          {rating != null && date ? (
            <Text
              variant="body-2-regular"
              importantForAccessibility="no"
              accessibilityElementsHidden
              style={{ color: palette.textSecondary }}
            >
              ·
            </Text>
          ) : null}
          {date ? (
            <Text variant="body-2-medium" style={{ color: palette.text }}>
              {date}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <View style={{ overflow: 'hidden' }}>
          <Text
            variant="body-regular"
            numberOfLines={clamps && !expanded ? numberOfLines : undefined}
            onLayout={onClampedLayout}
            style={{ color: palette.text }}
            testID={testID ? `${testID}-text` : undefined}
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
            {...webDataSet({ bloomListingPress: '' })}
            accessibilityRole="button"
            accessibilityLabel={expanded ? showLessLabel : showMoreLabel}
            aria-expanded={expanded}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={ring}
            testID={testID ? `${testID}-toggle` : undefined}
          >
            <Text variant="body-semibold" style={{ color: palette.text, textDecorationLine: 'underline' }}>
              {expanded ? showLessLabel : showMoreLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {hostResponse ? (
        <View
          style={{
            marginTop: 4,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 12,
            backgroundColor: palette.responseSurface,
            gap: 4,
          }}
          testID={testID ? `${testID}-response` : undefined}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8 }}>
            <Text variant="body-2-semibold" style={{ color: palette.text }}>
              {hostResponse.title}
            </Text>
            {hostResponse.date ? (
              <Text variant="caption-1-regular" style={{ color: palette.textSecondary }}>
                {hostResponse.date}
              </Text>
            ) : null}
          </View>
          <Text variant="body-regular" style={{ color: palette.text }}>
            {hostResponse.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const ReviewCard = memo(ReviewCardComponent);
ReviewCard.displayName = 'ReviewCard';
