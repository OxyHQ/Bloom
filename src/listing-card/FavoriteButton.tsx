import React, { memo, useMemo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  HEART_SCRIM_OPACITY,
  IS_WEB,
  LISTING_CARD_CSS,
  LISTING_CARD_STYLE_ID,
  resolveListingCardPaint,
  webData,
} from './shared';
import type { FavoriteButtonProps } from './types';

/**
 * A heart that saves an item, drawn over a photo.
 *
 *   rest    a neutral-50 outline around a neutral-950 body at 50% — legible
 *           over a bright or a dark photo alike
 *   saved   the body turns red-500 (the theme's `error` hue); the outline stays
 *
 * Colour change only: no scale, no bounce. The target is at least 32 square.
 * It is a toggle button — `aria-pressed` for web, `accessibilityState.selected`
 * for native — and its NAME says what pressing does ("Save to wishlist" /
 * "Remove from wishlist").
 *
 * The press never reaches a pressable card behind it: the event is stopped on
 * web, and on native the heart is the responder that took the touch.
 */
function FavoriteButtonComponent({
  favorite,
  onFavoriteChange,
  size = 24,
  saveLabel = 'Save to wishlist',
  removeLabel = 'Remove from wishlist',
  disabled = false,
  style,
  testID,
}: FavoriteButtonProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_CARD_STYLE_ID, LISTING_CARD_CSS);
  const paint = useMemo(() => resolveListingCardPaint(theme), [theme]);
  const box = Math.max(32, size + 8);

  const rootStyle: WebCssStyle = {
    width: box,
    height: box,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
    '--bloom-listing-card-ring': paint.ring,
  };

  return (
    <Pressable
      {...webData({ bloomFavoriteButton: '' })}
      role="button"
      accessibilityLabel={favorite ? removeLabel : saveLabel}
      aria-pressed={favorite}
      accessibilityState={{ selected: favorite, disabled }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={(event: GestureResponderEvent) => {
        if (IS_WEB) {
          event.preventDefault?.();
          event.stopPropagation?.();
        }
        onFavoriteChange(!favorite);
      }}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View style={{ width: size, height: size }} pointerEvents="none">
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: favorite ? 1 : HEART_SCRIM_OPACITY,
          }}
        >
          <RiHeart3Fill
            width={size}
            height={size}
            fill={favorite ? paint.favorite : paint.scrim}
          />
        </View>
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <RiHeart3Line width={size} height={size} fill={paint.onMedia} />
        </View>
      </View>
    </Pressable>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);
FavoriteButton.displayName = 'FavoriteButton';
