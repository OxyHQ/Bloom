import React, { memo, useEffect, useMemo } from 'react';
import { Image, Pressable, View, type ViewStyle } from 'react-native';

import { Button } from '../button';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { ListingFacts, ListingOfferings, ListingPriceLines } from '../listing-card/parts';
import { resolvePriceLines } from '../listing-card/shared';
import { Rating } from '../rating';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MAP_MARKER_CSS,
  MAP_MARKER_STYLE_ID,
  mapWebData,
  resolveMapMarkerPaint,
  type MapMarkerPaint,
} from './shared';
import type { MapListingPreviewProps } from './types';

/**
 * The small card a map shows when a marker is pressed.
 *
 *   card        327 wide, radius 16, surface + hairline + shadow-m
 *   vertical    photo 200 tall on top (inner radius 15), body 12 padding
 *   compact     photo 112 wide on the left, full height; body beside it
 *   body        title body-2-semibold + Rating small on one line,
 *               subtitle body-2-regular secondary, 4 · price line:
 *               [original struck, secondary] price body-2-semibold, detail body-2-regular secondary
 *   housing     offerings: small tinted badges above the title; `priceLines`
 *               stacked; facts a 14px-icon row under them — the SAME parts
 *               `ListingCard` draws (`listing-card/parts.tsx`)
 *   close       Button secondary xs iconOnly — over the photo's top-left
 *               (vertical) or the card's top-right (compact)
 *   heart       24 round surface pill, 14px heart — the photo's other top corner;
 *               a filled red heart when saved
 *
 * The card never clips (so the native shadow survives); the photo clips
 * itself to the card's inner radius.
 *
 * The open target is a `button` laid over the whole card BESIDE the close and
 * heart buttons rather than around them, so no button nests in another. The
 * heart is a toggle: `aria-pressed` plus native `accessibilityState.selected`.
 */

const DEFAULT_WIDTH = 327;
const RADIUS = 16;
const INNER_RADIUS = RADIUS - 1;
const PHOTO_HEIGHT = 200;
const COMPACT_PHOTO_WIDTH = 112;
const HEART_SIZE = 24;
const INSET = 8;

function FavoriteButton({
  favorite,
  label,
  paint,
  onToggle,
  testID,
}: {
  favorite: boolean;
  label: string;
  paint: MapMarkerPaint;
  onToggle: () => void;
  testID?: string;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = favorite ? RiHeart3Fill : RiHeart3Line;
  const style: WebCssStyle = {
    width: HEART_SIZE,
    height: HEART_SIZE,
    borderRadius: HEART_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: paint.border,
    backgroundColor: hovered ? paint.hoverSurface : paint.surface,
    '--bloom-map-ring': paint.ring,
    ...bloomShadowStyle('s'),
  };
  return (
    <Pressable
      {...mapWebData({ bloomMapPressable: '' })}
      role="button"
      accessibilityLabel={label}
      aria-pressed={favorite}
      accessibilityState={{ selected: favorite }}
      onPress={onToggle}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={testID}
      style={style}
    >
      <Icon width={14} height={14} fill={favorite ? paint.heart : paint.label} />
    </Pressable>
  );
}

function MapListingPreviewComponent({
  image,
  imageVariant,
  title,
  rating,
  reviewCount,
  subtitle,
  price,
  priceDetail,
  originalPrice,
  priceLines,
  facts,
  offerings,
  offeringLabels,
  favorite = false,
  onFavoriteChange,
  onClose,
  onPress,
  layout = 'vertical',
  width = DEFAULT_WIDTH,
  closeLabel = 'Close',
  favoriteLabel = 'Save',
  accessibilityLabel,
  style,
  testID,
}: MapListingPreviewProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const resolver = useImageResolver();
  useEffect(() => {
    adoptStyleSheet(MAP_MARKER_STYLE_ID, MAP_MARKER_CSS);
  }, []);

  const compact = layout === 'compact';
  const uri = image ? (isImageUrl(image) ? image : resolver?.(image, imageVariant)) : undefined;
  const showRating = rating !== undefined;

  const cardStyle: WebCssStyle = {
    width,
    maxWidth: '100%',
    flexDirection: compact ? 'row' : 'column',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: paint.border,
    backgroundColor: paint.surface,
    ...bloomShadowStyle('m'),
  };

  const photoStyle: ViewStyle = compact
    ? {
        width: COMPACT_PHOTO_WIDTH,
        minHeight: COMPACT_PHOTO_WIDTH,
        alignSelf: 'stretch',
        borderTopLeftRadius: INNER_RADIUS,
        borderBottomLeftRadius: INNER_RADIUS,
        overflow: 'hidden',
        backgroundColor: paint.placeholder,
      }
    : {
        height: PHOTO_HEIGHT,
        borderTopLeftRadius: INNER_RADIUS,
        borderTopRightRadius: INNER_RADIUS,
        overflow: 'hidden',
        backgroundColor: paint.placeholder,
      };

  const openStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: RADIUS,
    '--bloom-map-ring': paint.ring,
  };

  const closeButton = onClose ? (
    <Button
      variant="secondary"
      size="xs"
      iconOnly
      leadingIcon={RiCloseLine}
      accessibilityLabel={closeLabel}
      onPress={onClose}
      testID={testID ? `${testID}-close` : undefined}
    />
  ) : null;

  const heartButton = onFavoriteChange ? (
    <FavoriteButton
      favorite={favorite}
      label={favoriteLabel}
      paint={paint}
      onToggle={() => onFavoriteChange(!favorite)}
      testID={testID ? `${testID}-favorite` : undefined}
    />
  ) : null;

  return (
    <View testID={testID} style={[cardStyle, style]}>
      <View style={photoStyle} testID={testID ? `${testID}-image` : undefined}>
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        ) : null}
      </View>

      <View
        style={{
          flex: compact ? 1 : undefined,
          minWidth: 0,
          justifyContent: 'center',
          gap: 2,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          // Compact: clear the close button in the card's top-right corner.
          paddingRight: compact && onClose ? INSET + 24 + 8 : 12,
        }}
      >
        {offerings && offerings.length > 0 ? (
          <ListingOfferings
            offerings={offerings}
            labels={offeringLabels}
            size="small"
            variant="tinted"
            style={{ gap: 4, marginBottom: 4 }}
            testID={testID ? `${testID}-offerings` : undefined}
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            variant="body-2-semibold"
            numberOfLines={1}
            style={{ flex: 1, minWidth: 0, color: paint.label }}
          >
            {title}
          </Text>
          {showRating && !compact ? (
            <Rating size="small" value={rating} count={reviewCount} />
          ) : null}
        </View>
        {showRating && compact ? (
          <Rating size="small" value={rating} count={reviewCount} />
        ) : null}
        {subtitle ? (
          <Text variant="body-2-regular" numberOfLines={1} style={{ color: paint.labelSecondary }}>
            {subtitle}
          </Text>
        ) : null}
        {priceLines ? (
          <ListingPriceLines
            lines={resolvePriceLines({ priceLines })}
            size="small"
            color={paint.label}
            secondaryColor={paint.labelSecondary}
            style={{ marginTop: 4 }}
            testID={testID ? `${testID}-price` : undefined}
          />
        ) : price ? (
          <Text variant="body-2-regular" numberOfLines={1} style={{ marginTop: 4, color: paint.labelSecondary }}>
            {originalPrice ? (
              <Text
                variant="body-2-regular"
                style={{ color: paint.labelSecondary, textDecorationLine: 'line-through' }}
              >
                {originalPrice}{' '}
              </Text>
            ) : null}
            <Text variant="body-2-semibold" style={{ color: paint.label }}>
              {price}
            </Text>
            {priceDetail ? ` ${priceDetail}` : null}
          </Text>
        ) : null}
        {facts && facts.length > 0 ? (
          <ListingFacts
            facts={facts}
            size="small"
            color={paint.labelSecondary}
            style={{ marginTop: 4 }}
            testID={testID ? `${testID}-facts` : undefined}
          />
        ) : null}
      </View>

      {onPress ? (
        <Pressable
          {...mapWebData({ bloomMapPressable: '' })}
          role="button"
          accessibilityLabel={accessibilityLabel ?? title}
          onPress={onPress}
          testID={testID ? `${testID}-open` : undefined}
          style={openStyle}
        />
      ) : null}

      {compact ? (
        <>
          {heartButton ? (
            <View style={{ position: 'absolute', top: INSET, left: INSET }}>{heartButton}</View>
          ) : null}
          {closeButton ? (
            <View style={{ position: 'absolute', top: INSET, right: INSET }}>{closeButton}</View>
          ) : null}
        </>
      ) : (
        <>
          {closeButton ? (
            <View style={{ position: 'absolute', top: INSET, left: INSET }}>{closeButton}</View>
          ) : null}
          {heartButton ? (
            <View style={{ position: 'absolute', top: INSET, right: INSET }}>{heartButton}</View>
          ) : null}
        </>
      )}
    </View>
  );
}

export const MapListingPreview = memo(MapListingPreviewComponent);
MapListingPreview.displayName = 'MapListingPreview';
