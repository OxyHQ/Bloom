import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  IS_WEB,
  MEDIA_CONTROLS_CSS,
  MEDIA_CONTROLS_STYLE_ID,
  resolveMediaControlsPaint,
} from './shared';
import type { LikeButtonProps, LikeButtonSize } from './types';

/**
 * The heart that saves a track, album or playlist to the library.
 *
 *            glyph   hit area
 *   small    16      32
 *   medium   20      32
 *   large    24      40
 *
 *   rest    outline heart, muted neutral; hover: the text colour
 *   liked   filled heart in the theme accent (or `activeColor`)
 *
 * Colour change only — no scale, no bounce.
 *
 * Accessibility: a toggle button, so it carries its state in both spellings —
 * `aria-pressed` for web and `accessibilityState.selected` for native (React
 * Native has no pressed state). The NAME says what pressing does ("Save to Your
 * Library" / "Remove from Your Library"). The press does not reach a pressable
 * row behind it.
 */

const SIZE_CONFIG: Record<LikeButtonSize, { glyph: number; box: number }> = {
  small: { glyph: 16, box: 32 },
  medium: { glyph: 20, box: 32 },
  large: { glyph: 24, box: 40 },
};

function LikeButtonComponent({
  liked,
  onLikedChange,
  size = 'medium',
  activeColor,
  disabled = false,
  likeLabel = 'Save to Your Library',
  unlikeLabel = 'Remove from Your Library',
  style,
  testID,
}: LikeButtonProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MEDIA_CONTROLS_STYLE_ID, MEDIA_CONTROLS_CSS);
  }, []);
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const { glyph, box } = SIZE_CONFIG[size];

  const color = liked
    ? (activeColor ?? paint.accent)
    : hovered && !disabled
      ? paint.text
      : paint.textMuted;
  const Glyph = liked ? RiHeart3Fill : RiHeart3Line;

  const rootStyle: WebCssStyle = {
    width: box,
    height: box,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    '--bloom-media-ring': paint.ring,
  };

  return (
    <Pressable
      {...webDataSet({ bloomMediaFocusable: '', bloomLikeButton: liked ? 'liked' : '' })}
      role="button"
      accessibilityLabel={liked ? unlikeLabel : likeLabel}
      aria-pressed={liked}
      accessibilityState={{ selected: liked, disabled }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={(event: GestureResponderEvent) => {
        if (IS_WEB) {
          event.preventDefault?.();
          event.stopPropagation?.();
        }
        onLikedChange(!liked);
      }}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View pointerEvents="none" style={{ width: glyph, height: glyph }}>
        <Glyph width={glyph} height={glyph} fill={color} />
      </View>
    </Pressable>
  );
}

export const LikeButton = memo(LikeButtonComponent);
LikeButton.displayName = 'LikeButton';
