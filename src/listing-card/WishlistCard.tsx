import React, { memo, useMemo } from 'react';
import { Image, Linking, Pressable, View, type GestureResponderEvent, type ViewStyle } from 'react-native';

import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  IS_WEB,
  LISTING_CARD_CSS,
  LISTING_CARD_STYLE_ID,
  PHOTO_RADIUS,
  resolveListingCardPaint,
  resolvePhoto,
  type ListingCardPaint,
} from './shared';
import type { WishlistCardProps } from './types';

/**
 * A saved collection of stays.
 *
 *   cover   a square, radius 16, 2px seams in the page colour:
 *             0 photos  the placeholder square, holding `empty` centred
 *             1 photo   fills it
 *             2         side by side
 *             3         one tall photo left, two stacked right
 *             4+        a 2×2 (the first four)
 *   text    12 below: `icon` at 16 (in `color`), the name body-semibold, then
 *           the description body-regular text-secondary
 *
 * A link on web with `href` (a real `<a>`), otherwise a button with `onPress`;
 * its name is "name, description".
 *
 * `icon` is DECORATIVE and sits beside the name rather than inside it — a glyph
 * put in the `name` string is read out as its character, and cannot be coloured
 * or sized. `color` paints that glyph and tints the empty cover; it is the
 * caller's colour, not a token, because a collection's colour is the person's
 * choice and Bloom has no ramp for it.
 */

const SEAM = 2;

function Tile({ uri, paint, style }: { uri?: string; paint: ListingCardPaint; style: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: paint.photoPlaceholder, overflow: 'hidden' }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </View>
  );
}

function WishlistCardComponent({
  name,
  description,
  photos,
  photoVariant,
  onPress,
  href,
  icon: Icon,
  color,
  empty,
  accessibilityLabel,
  style,
  testID,
}: WishlistCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_CARD_STYLE_ID, LISTING_CARD_CSS);
  const paint = useMemo(() => resolveListingCardPaint(theme), [theme]);
  const resolver = useImageResolver();
  const uris = photos.slice(0, 4).map((photo) => resolvePhoto(photo, resolver, photoVariant));
  const count = Math.max(1, uris.length);
  const isEmpty = uris.length === 0;

  const fill: ViewStyle = { flex: 1 };
  let cover: React.ReactNode;
  if (isEmpty) {
    cover = (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color ?? paint.photoPlaceholder,
        }}
        testID={testID ? `${testID}-empty` : undefined}
      >
        {empty ?? null}
      </View>
    );
  } else if (count === 1) {
    cover = <Tile uri={uris[0]} paint={paint} style={fill} />;
  } else if (count === 2) {
    cover = (
      <View style={{ flex: 1, flexDirection: 'row', gap: SEAM }}>
        <Tile uri={uris[0]} paint={paint} style={fill} />
        <Tile uri={uris[1]} paint={paint} style={fill} />
      </View>
    );
  } else {
    const right = count === 3 ? [uris[1], uris[2]] : [uris[2], uris[3]];
    cover = (
      <View style={{ flex: 1, flexDirection: 'row', gap: SEAM }}>
        {count === 3 ? (
          <Tile uri={uris[0]} paint={paint} style={fill} />
        ) : (
          <View style={{ flex: 1, gap: SEAM }}>
            <Tile uri={uris[0]} paint={paint} style={fill} />
            <Tile uri={uris[1]} paint={paint} style={fill} />
          </View>
        )}
        <View style={{ flex: 1, gap: SEAM }}>
          <Tile uri={right[0]} paint={paint} style={fill} />
          <Tile uri={right[1]} paint={paint} style={fill} />
        </View>
      </View>
    );
  }

  const rootStyle: WebCssStyle = { '--bloom-listing-card-ring': paint.ring };
  const interactive = onPress != null || href != null;

  return (
    <Pressable
      {...webDataSet({ bloomWishlistCard: '' })}
      {...(IS_WEB && href ? { href } : null)}
      role={href ? 'link' : onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? (description ? `${name}, ${description}` : name)}
      disabled={!interactive}
      onPress={(event: GestureResponderEvent) => {
        if (onPress) {
          if (IS_WEB && href) event.preventDefault();
          onPress();
          return;
        }
        if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
      }}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: PHOTO_RADIUS,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
        testID={testID ? `${testID}-cover` : undefined}
      >
        {cover}
      </View>
      <View style={{ marginTop: 12, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {Icon ? (
            <View aria-hidden style={{ flexShrink: 0 }} testID={testID ? `${testID}-icon` : undefined}>
              <Icon width={16} height={16} fill={color ?? paint.textSecondary} />
            </View>
          ) : null}
          <Text
            variant="body-semibold"
            numberOfLines={1}
            style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
          >
            {name}
          </Text>
        </View>
        {description ? (
          <Text variant="body-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const WishlistCard = memo(WishlistCardComponent);
WishlistCard.displayName = 'WishlistCard';
