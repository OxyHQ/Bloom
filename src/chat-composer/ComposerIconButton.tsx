/**
 * The composer's round control: a transparent disc that paints only on hover,
 * press and focus, or the accent-gradient send disc at `tone="accent"`.
 *
 * No press SCALE anywhere — hover and press are a colour change, which is the
 * fleet-wide rule and the only feedback that survives reduced motion unchanged.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { paintToCssImage } from '../button/shared';
import type { ButtonStatePaint } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { CONTROL_SIZE, resolveChatComposerPalette } from './shared';
import type { ComposerIconButtonProps } from './types';
import { dataHook, IS_WEB } from './web-hooks';

let gradientId = 0;

/** A two-stop vertical fill: a CSS gradient on web, an SVG rect on native. */
function GradientFill({
  paint,
  opacity = 1,
  radius,
}: {
  paint: ButtonStatePaint;
  opacity?: number;
  radius: number;
}) {
  const id = React.useMemo(() => `bloom-chat-send-${gradientId++}`, []);
  const [top, bottom] = paint.gradient ?? [paint.background, paint.background];
  if (IS_WEB) {
    const style: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 9999,
      backgroundImage: paintToCssImage(paint),
      opacity,
      transitionProperty: 'opacity',
      transitionDuration: '150ms',
      transitionTimingFunction: 'ease',
    };
    return <View pointerEvents="none" style={style} />;
  }
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function ComposerIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  tone = 'plain',
  size = CONTROL_SIZE,
  iconSize,
  style,
  testID,
  accessibilityRole = 'button',
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}: ComposerIconButtonProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const accent = tone === 'accent';
  const glyph = iconSize ?? Math.max(16, size - 16);

  const paint = accent
    ? disabled
      ? palette.send.disabled
      : pressed
        ? palette.send.active
        : palette.send.rest
    : undefined;

  const box: WebCssStyle = {
    position: 'relative',
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    opacity: disabled ? 0.4 : 1,
    backgroundColor: accent
      ? 'transparent'
      : pressed
        ? palette.hoverStrong
        : hovered
          ? palette.hover
          : 'transparent',
    cursor: disabled ? 'auto' : 'pointer',
    '--bloom-chat-composer-ring': palette.focusRing,
  };

  return (
    <Pressable
      {...dataHook('bloomChatComposerControl')}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled, expanded: ariaExpanded }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={() => {
        setPressed(true);
        if (!disabled) onPressIn?.();
      }}
      onPressOut={() => {
        setPressed(false);
        if (!disabled) onPressOut?.();
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[box, style]}
      testID={testID}>
      {paint ? <GradientFill paint={paint} radius={size / 2} /> : null}
      {paint && !disabled ? (
        <GradientFill
          paint={palette.send.hover}
          opacity={hovered && !pressed ? 1 : 0}
          radius={size / 2}
        />
      ) : null}
      {/* Its own positioned box, so the glyph paints above the absolute fills. */}
      <View pointerEvents="none" style={{ position: 'relative', width: glyph, height: glyph }}>
        <Icon
          width={glyph}
          height={glyph}
          fill={accent ? palette.onAccent : palette.iconPrimary}
        />
      </View>
    </Pressable>
  );
}
