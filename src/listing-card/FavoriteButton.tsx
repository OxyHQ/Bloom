import React, { memo, useMemo } from 'react';
import { View, type GestureResponderEvent } from 'react-native';

import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { Button } from '../button';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { HEART_SCRIM_OPACITY, resolveListingCardPaint } from './shared';
import { useMessages } from '../locale/messages';
import { LISTING_CARD_MESSAGES } from './messages';
import type { FavoriteButtonProps } from './types';
import { IS_WEB } from '../styles/platform';

/**
 * A heart that saves an item, drawn over a photo.
 *
 *   rest    a neutral-50 outline around a neutral-950 body at 50% — legible
 *           over a bright or a dark photo alike
 *   saved   the body turns red-500 (the theme's `error` hue); the outline stays
 *
 * Base Button owns interaction, focus and disabled feedback. The target is at
 * least 32 square.
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
  saveLabel: saveLabelProp,
  removeLabel: removeLabelProp,
  disabled = false,
  style,
  testID,
}: FavoriteButtonProps) {
  const { messages } = useMessages(LISTING_CARD_MESSAGES);
  const saveLabel = saveLabelProp ?? messages.saveToWishlist;
  const removeLabel = removeLabelProp ?? messages.removeFromWishlist;
  const theme = useTheme();
  const paint = useMemo(() => resolveListingCardPaint(theme), [theme]);
  const box = Math.max(32, size + 8);

  const rootStyle: WebCssStyle = {
    width: box,
    height: box,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Button
      appearance="plain"
      tone="neutral"
      iconOnly
      stopPropagation
      accessibilityLabel={favorite ? removeLabel : saveLabel}
      pressed={favorite}
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
          <RiHeart3Fill width={size} height={size} fill={favorite ? paint.favorite : paint.scrim} />
        </View>
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <RiHeart3Line width={size} height={size} fill={paint.onMedia} />
        </View>
      </View>
    </Button>
  );
}

export const FavoriteButton = memo(FavoriteButtonComponent);
FavoriteButton.displayName = 'FavoriteButton';
