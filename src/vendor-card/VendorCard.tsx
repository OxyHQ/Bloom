import React, { memo, useMemo } from 'react';
import { Image, Linking, Pressable, View, type GestureResponderEvent, type ViewStyle } from 'react-native';

import { Badge } from '../badge';
import { Chip } from '../chip';
import { RiPriceTag3Line } from '../icons/remix/RiPriceTag3Line';
import { useImageResolver } from '../image-resolver/context';
import { FavoriteButton } from '../listing-card';
import { ListingFacts, ListingStatusPill } from '../listing-card/parts';
import {
  COMPACT_PHOTO_RADIUS,
  COMPACT_PHOTO_SIZE,
  IS_WEB,
  LISTING_CARD_CSS,
  LISTING_CARD_STYLE_ID,
  PHOTO_RADIUS,
  resolveListingCardPaint,
  resolvePhoto,
  STATUS_WASH_OPACITY,
  type ListingCardPaint,
} from '../listing-card/shared';
import { OFFERING_BADGE_RUNG } from '../offering-badge/shared';
import type { OfferingBadgeSize } from '../offering-badge/types';
import { Rating } from '../rating';
import { Box as SkeletonBox } from '../skeleton';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  VENDOR_CUISINE_CHIP_HEIGHT,
  VENDOR_PHOTO_ASPECT_RATIO,
  VENDOR_TEXT_GAP,
} from './constants';
import {
  availabilityLabelFor,
  composeVendorName,
  VENDOR_CARD_CSS,
  VENDOR_CARD_STYLE_ID,
  vendorCuisines,
  vendorFacts,
} from './shared';
import type { VendorCardDensity, VendorCardProps } from './types';

/**
 * A restaurant or a shop in a list.
 *
 *   comfortable  a 16:9 cover (radius 16) with the marks over it, 12 below it
 *                the name + `Rating`, the cuisines, the "opens at" line and
 *                the fact row
 *   compact      a 112 square thumbnail (radius 12), 12 right of it the marks
 *                row, the name + small `Rating`, the cuisines, the "opens at"
 *                line and the fact row
 *   marks        the status pill first, then the promo — the reader decides
 *                "can I order at all" before "is it cheap"
 *   not open     the cover washed 50% toward the page, exactly as a home that
 *                is not available is
 *
 * IT IS `listing-card`'s CARD WITH A VENDOR'S DATA IN IT, deliberately. The
 * wash, the status pill, the fact row, the heart, the placeholder and every
 * colour are `listing-card`'s own parts — a food app and a housing app put the
 * same object on the screen, and this family owns only what is different: the
 * cover's shape, the cuisines, the four delivery readings and the promo mark.
 *
 * THE CARD IS A LINK AND THE CONTROLS ARE ITS SIBLINGS, NOT ITS CHILDREN — the
 * rule `ListingCard` records: a button inside an anchor is invalid HTML and
 * makes the heart's press open the vendor. The heart sits in an overlay laid
 * over the cover from outside the link.
 *
 * The cover is ONE picture. A vendor is not a gallery, so there is no pager, no
 * dots and no arrows; a shelf scrolls sideways through vendors, not through one
 * vendor's photos.
 */

// ---------------------------------------------------------------------------
//  Cover
// ---------------------------------------------------------------------------

function coverStyle(density: VendorCardDensity): ViewStyle {
  return density === 'compact'
    ? { width: COMPACT_PHOTO_SIZE, height: COMPACT_PHOTO_SIZE, borderRadius: COMPACT_PHOTO_RADIUS }
    : { width: '100%', aspectRatio: VENDOR_PHOTO_ASPECT_RATIO, borderRadius: PHOTO_RADIUS };
}

function Cover({
  photo,
  photoVariant,
  density,
  paint,
  washed,
  testID,
}: {
  photo?: string;
  photoVariant?: string;
  density: VendorCardDensity;
  paint: ListingCardPaint;
  washed: boolean;
  testID?: string;
}) {
  const resolver = useImageResolver();
  const uri = photo ? resolvePhoto(photo, resolver, photoVariant) : undefined;
  return (
    <View
      style={[
        coverStyle(density),
        { flexShrink: 0, overflow: 'hidden', backgroundColor: paint.photoPlaceholder },
      ]}
      testID={testID ? `${testID}-photo` : undefined}
    >
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
      {washed ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: paint.statusWash,
            opacity: STATUS_WASH_OPACITY,
          }}
          testID={testID ? `${testID}-wash` : undefined}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Marks — the status pill and the promo, in one wrapping row
// ---------------------------------------------------------------------------

function Marks({
  status,
  promo,
  promoTone,
  size,
  paint,
  testID,
}: {
  status: string | null;
  promo?: string;
  promoTone: NonNullable<VendorCardProps['promoTone']>;
  size: OfferingBadgeSize;
  paint: ListingCardPaint;
  testID?: string;
}) {
  if (!status && !promo) return null;
  return (
    <View
      pointerEvents="none"
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 6 }}
      testID={testID ? `${testID}-marks` : undefined}
    >
      {status ? (
        <ListingStatusPill
          label={status}
          fill={paint.statusFill}
          text={paint.statusText}
          size={size}
          testID={testID ? `${testID}-status` : undefined}
        />
      ) : null}
      {promo ? (
        <Badge
          content={promo}
          variant="solid"
          color={promoTone}
          size={OFFERING_BADGE_RUNG[size]}
          icon={RiPriceTag3Line}
          testID={testID ? `${testID}-promo` : undefined}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Cuisines
// ---------------------------------------------------------------------------

/**
 * The cuisines as pills, on ONE line. The row wraps inside a box one pill tall
 * and clips, so a pill that does not fit moves to a second line nobody sees —
 * cuisines drop out WHOLE from the end rather than each being truncated to
 * "Jap…". The card's accessible name carries every one of them.
 */
function Cuisines({
  cuisines,
  surface,
  style,
  testID,
}: {
  cuisines: readonly string[];
  surface: string;
  style?: ViewStyle;
  testID?: string;
}) {
  if (cuisines.length === 0) return null;
  return (
    <View
      // `aria-hidden` for the reason the doc comment gives: these words are
      // already in the card's own accessible name, in full, and a screen reader
      // reading the clipped row as well would say the first three twice.
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 6,
          rowGap: 6,
          height: VENDOR_CUISINE_CHIP_HEIGHT,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID ? `${testID}-cuisines` : undefined}
    >
      {cuisines.map((cuisine) => (
        <Chip key={cuisine} size="small" variant="subtle" color="default" surface={surface}>
          {cuisine}
        </Chip>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Skeleton
// ---------------------------------------------------------------------------

function VendorCardSkeleton({
  density,
  style,
  testID,
}: Pick<VendorCardProps, 'style' | 'testID'> & { density: VendorCardDensity }) {
  const compact = density === 'compact';
  return (
    <View
      aria-busy
      accessibilityLabel="Loading"
      style={[{ flexDirection: compact ? 'row' : 'column', alignItems: 'flex-start' }, style]}
      testID={testID}
    >
      {compact ? (
        <SkeletonBox
          width={COMPACT_PHOTO_SIZE}
          height={COMPACT_PHOTO_SIZE}
          borderRadius={COMPACT_PHOTO_RADIUS}
          style={{ flexShrink: 0 }}
        />
      ) : (
        <SkeletonBox
          borderRadius={PHOTO_RADIUS}
          style={{ width: '100%', aspectRatio: VENDOR_PHOTO_ASPECT_RATIO }}
        />
      )}
      <View
        style={{
          flex: compact ? 1 : undefined,
          alignSelf: compact ? 'center' : 'stretch',
          marginTop: compact ? 0 : VENDOR_TEXT_GAP,
          marginLeft: compact ? VENDOR_TEXT_GAP : 0,
          gap: 8,
        }}
      >
        <SkeletonBox width="60%" height={14} borderRadius={4} />
        <SkeletonBox width="45%" height={12} borderRadius={4} />
        <SkeletonBox width="70%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

function VendorCardComponent(props: VendorCardProps) {
  const {
    name,
    photo,
    photoVariant,
    cuisines,
    rating,
    reviewCount,
    newLabel,
    promo,
    promoTone = 'success',
    availability,
    availabilityLabel,
    opensAt,
    favorite = false,
    onFavoriteChange,
    saveLabel,
    removeLabel,
    onPress,
    href,
    loading = false,
    density = 'comfortable',
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  // The card adopts BOTH sheets: its own link ring, and `listing-card`'s, which
  // is where the heart's `:focus-visible` rule lives. `adoptStyleSheet` replaces
  // by id, so a page of vendor cards adopts each exactly once.
  useInteractiveWebCss(VENDOR_CARD_STYLE_ID, VENDOR_CARD_CSS);
  useInteractiveWebCss(LISTING_CARD_STYLE_ID, LISTING_CARD_CSS);
  const paint = useMemo(() => resolveListingCardPaint(theme), [theme]);

  const compact = density === 'compact';
  if (loading) return <VendorCardSkeleton density={density} style={style} testID={testID} />;

  const status = availabilityLabelFor(availability, availabilityLabel);
  const facts = vendorFacts(props);
  const shownCuisines = vendorCuisines(cuisines, density);
  const markSize: OfferingBadgeSize = compact ? 'small' : 'medium';
  const label = accessibilityLabel ?? composeVendorName(props);

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };

  const linkProps = {
    ...webDataSet({ bloomVendorCardLink: '' }),
    ...(IS_WEB && href ? { href } : null),
    role: href ? ('link' as const) : onPress ? ('button' as const) : undefined,
    accessibilityLabel: label,
    onPress: onPress || (!IS_WEB && href) ? handlePress : undefined,
    testID: testID ? `${testID}-link` : undefined,
  };

  const linkStyle: WebCssStyle = {
    flexDirection: compact ? 'row' : 'column',
    alignItems: 'flex-start',
    '--bloom-vendor-card-ring': paint.ring,
  };

  const details = (
    <View
      style={{
        flex: compact ? 1 : undefined,
        minWidth: 0,
        alignSelf: compact ? 'center' : 'stretch',
        marginTop: compact ? 0 : VENDOR_TEXT_GAP,
        marginLeft: compact ? VENDOR_TEXT_GAP : 0,
        gap: 4,
      }}
    >
      {/*
        The compact row has no room for pills over a 112 thumbnail, so the marks
        sit ABOVE the name — the same answer `ListingCard`'s compact density
        gives for its offerings.
      */}
      {compact ? (
        <Marks
          status={status}
          promo={promo}
          promoTone={promoTone}
          size={markSize}
          paint={paint}
          testID={testID}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          variant={compact ? 'body-semibold' : 'headline-semibold'}
          numberOfLines={1}
          testID={testID ? `${testID}-name` : undefined}
          style={{ flex: 1, minWidth: 0, color: paint.text }}
        >
          {name}
        </Text>
        {rating !== undefined ? (
          <Rating
            size={compact ? 'small' : 'medium'}
            value={rating}
            count={reviewCount}
            newLabel={newLabel}
            style={{ flexShrink: 0 }}
            testID={testID ? `${testID}-rating` : undefined}
          />
        ) : null}
      </View>
      <Cuisines
        cuisines={shownCuisines}
        surface={theme.colors.background}
        style={{ marginTop: 2 }}
        testID={testID}
      />
      {status && opensAt ? (
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          testID={testID ? `${testID}-opens-at` : undefined}
          style={{ marginTop: 2, color: paint.textSecondary }}
        >
          {opensAt}
        </Text>
      ) : null}
      {facts.length > 0 ? (
        <ListingFacts
          facts={facts}
          size={compact ? 'small' : 'medium'}
          color={paint.textSecondary}
          style={{ marginTop: 2 }}
          testID={testID ? `${testID}-facts` : undefined}
        />
      ) : null}
    </View>
  );

  return (
    <View
      {...webDataSet({ bloomVendorCard: density })}
      style={[{ position: 'relative' }, style]}
      testID={testID}
    >
      <Pressable {...linkProps} style={linkStyle}>
        <Cover
          photo={photo}
          photoVariant={photoVariant}
          density={density}
          paint={paint}
          washed={status != null}
          testID={testID}
        />
        {details}
      </Pressable>

      {compact ? null : (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, aspectRatio: VENDOR_PHOTO_ASPECT_RATIO }}
        >
          <View style={{ position: 'absolute', top: 12, left: 12, right: 56 }}>
            <Marks
              status={status}
              promo={promo}
              promoTone={promoTone}
              size={markSize}
              paint={paint}
              testID={testID}
            />
          </View>
          {onFavoriteChange ? (
            <View style={{ position: 'absolute', top: 6, right: 6 }}>
              <FavoriteButton
                favorite={favorite}
                onFavoriteChange={onFavoriteChange}
                saveLabel={saveLabel}
                removeLabel={removeLabel}
                testID={testID ? `${testID}-favorite` : undefined}
              />
            </View>
          ) : null}
        </View>
      )}

      {compact && onFavoriteChange ? (
        <View style={{ position: 'absolute', top: 2, left: COMPACT_PHOTO_SIZE - 34 }}>
          <FavoriteButton
            favorite={favorite}
            size={20}
            onFavoriteChange={onFavoriteChange}
            saveLabel={saveLabel}
            removeLabel={removeLabel}
            testID={testID ? `${testID}-favorite` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

export const VendorCard = memo(VendorCardComponent);
VendorCard.displayName = 'VendorCard';
