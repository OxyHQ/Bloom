import React, { memo, useMemo } from 'react';
import { Image, Linking, Pressable, View, type GestureResponderEvent, type ViewStyle } from 'react-native';

import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  IS_WEB,
  LISTING_CARD_CSS,
  LISTING_CARD_STYLE_ID,
  PHOTO_RADIUS,
  resolveListingCardPaint,
  resolvePhoto,
  webData,
  type ListingCardPaint,
} from './shared';
import type { WishlistCardProps } from './types';

/**
 * A saved collection of stays.
 *
 *   cover   a square, radius 16, 2px seams in the page colour:
 *             1 photo   fills it
 *             2         side by side
 *             3         one tall photo left, two stacked right
 *             4+        a 2×2 (the first four)
 *   text    12 below: the name body-semibold, the description body-regular
 *           text-secondary
 *
 * A link on web with `href` (a real `<a>`), otherwise a button with `onPress`;
 * its name is "name, description".
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

  const fill: ViewStyle = { flex: 1 };
  let cover: React.ReactNode;
  if (count === 1) {
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
      {...webData({ bloomWishlistCard: '' })}
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
        <Text variant="body-semibold" numberOfLines={1} style={{ color: paint.text }}>
          {name}
        </Text>
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
