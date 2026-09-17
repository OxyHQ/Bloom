import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { RiPauseFill } from '../icons/remix/RiPauseFill';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { borderRadius } from '../styles/tokens';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import {
  IS_WEB,
  MEDIA_CONTROLS_CSS,
  MEDIA_CONTROLS_STYLE_ID,
  resolveMediaControlsPaint,
} from './shared';
import { SpinnerRing } from './SpinnerRing';
import type { PlayButtonProps, PlayButtonSize } from './types';

/**
 * The round play / pause button.
 *
 *            diameter   glyph
 *   small    32         16
 *   medium   48         24
 *   large    56         28
 *
 *   accent    accent-500 fill, primaryForeground glyph; hover accent-600
 *             (dark 400), press accent-700 (dark 300)
 *   inverse   text-colour fill, background-colour glyph; hover mixes 16% of
 *             the background in
 *   plain     the glyph alone in the text colour; hover turns it accent
 *
 * Colour change only — no scale. `RiPlayFill`'s triangle already sits right of
 * its box's centre (the path spans x 8..19.6 of 24), which puts its visual
 * weight on the circle's centre, so no further nudge is applied.
 *
 * Accessibility: a plain `button` whose NAME is the action ("Play Night Drive"
 * / "Pause Night Drive"). It deliberately carries no `aria-pressed`: a toggle
 * button keeps one name and flips its pressed state, whereas this names what
 * pressing does next, and a name that changes AND a pressed state would announce
 * "Pause, pressed" — two answers to one question. `loading` sets `aria-busy`
 * (React Native folds it into `accessibilityState.busy`).
 */

const SIZE_CONFIG: Record<PlayButtonSize, { box: number; glyph: number }> = {
  small: { box: 32, glyph: 16 },
  medium: { box: 48, glyph: 24 },
  large: { box: 56, glyph: 28 },
};

function PlayButtonComponent({
  playing,
  onPress,
  interactive = true,
  size = 'medium',
  variant = 'accent',
  loading = false,
  disabled = false,
  subject,
  playLabel = 'Play',
  pauseLabel = 'Pause',
  accessibilityLabel,
  style,
  testID,
}: PlayButtonProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MEDIA_CONTROLS_STYLE_ID, MEDIA_CONTROLS_CSS);
  }, []);
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const { box, glyph } = SIZE_CONFIG[size];

  const action = playing ? pauseLabel : playLabel;
  const name = accessibilityLabel ?? (subject ? `${action} ${subject}` : action);

  const active = !disabled && (pressed || hovered);
  let fill: string | undefined;
  let glyphColor: string;
  if (variant === 'accent') {
    fill = !disabled && pressed ? paint.accentPressed : active ? paint.accentHover : paint.accent;
    glyphColor = paint.onAccent;
  } else if (variant === 'inverse') {
    fill = active ? paint.inverseHover : paint.inverse;
    glyphColor = paint.onInverse;
  } else {
    fill = undefined;
    glyphColor = active ? paint.accent : paint.text;
  }

  const Glyph = playing ? RiPauseFill : RiPlayFill;

  const rootStyle: WebCssStyle = {
    width: box,
    height: box,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fill,
    opacity: disabled ? 0.5 : 1,
    '--bloom-media-ring': paint.ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '150ms' } : null),
  };

  const glyphBox = (
    <View pointerEvents="none" style={{ width: glyph, height: glyph }}>
      {loading ? (
        <SpinnerRing size={glyph} color={glyphColor} />
      ) : (
        <Glyph width={glyph} height={glyph} fill={glyphColor} />
      )}
    </View>
  );

  // `interactive={false}` makes this DECORATION — the poster frame or the row around it
  // is the press target, and a second `role="button"` inside one is invalid HTML
  // (react-dom says so out loud) and a second stop for a screen reader on the
  // same action. It keeps its box and its fill; it just stops claiming to be a
  // control. An explicit `accessibilityLabel` still names it, for the rare case
  // where the glyph is the only thing saying what state the media is in.
  if (!interactive) {
    return (
      <View
        {...webDataSet({ bloomPlayButton: variant })}
        role={accessibilityLabel ? 'img' : undefined}
        accessibilityLabel={accessibilityLabel}
        aria-hidden={accessibilityLabel ? undefined : true}
        importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
        accessibilityElementsHidden={!accessibilityLabel}
        style={[rootStyle, style]}
        testID={testID}
      >
        {glyphBox}
      </View>
    );
  }

  return (
    <Pressable
      {...webDataSet({ bloomMediaFocusable: '', bloomPlayButton: variant })}
      role="button"
      accessibilityLabel={name}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[rootStyle, style]}
      testID={testID}
    >
      {glyphBox}
    </Pressable>
  );
}

export const PlayButton = memo(PlayButtonComponent);
PlayButton.displayName = 'PlayButton';
