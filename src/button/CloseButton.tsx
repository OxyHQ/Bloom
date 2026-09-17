import React, { memo, useMemo } from 'react';
import { Platform, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  BUTTON_TRANSITION_MS,
  CLOSE_BUTTON_GEOMETRY,
  resolveCloseButtonPaint,
} from './shared';
import type { CloseButtonProps } from './types';

/**
 * `CloseButton`: the compact round dismiss control for announcements, toasts,
 * modals and drawers. The X is drawn per size in a viewBox equal to its own
 * pixel size, so the stroke is a literal pixel value at every size rather
 * than a scaled glyph.
 *
 *            box    glyph   stroke   inset
 *   2xs      16     6.8     1.6      0.57
 *   xs       20     10.8    2        2        (default)
 *   sm       24     12.6    2        2
 *   md       32     16.2    2.5      2
 *
 *   disc     background/tertiary        neutral-200 / dark neutral-800
 *   glyph    foreground/icon/secondary  neutral-500, text/primary on hover
 *
 * Colour transition 150ms; focus is a 2px accent ring at a 2px offset. Native
 * has no hover, so the held press paints the hover colour instead. No press
 * scale.
 */

const IS_WEB = Platform.OS === 'web';
const STYLE_ID = 'bloom-close-button-family-web-css';
const SELECTOR = '[data-bloom-button-close]';

const CLOSE_BUTTON_CSS = interactiveWebCss({
  selector: SELECTOR,
  varPrefix: 'bloom-button-close',
  base: `
    flex-shrink: 0;
    padding: 0;
    border: 0;
  `,
  transition: 'none',
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 2,
  extraRules: `${SELECTOR} path {
  transition: stroke ${BUTTON_TRANSITION_MS}ms ease;
}
${SELECTOR}:disabled,
${SELECTOR}[aria-disabled="true"] {
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
${SELECTOR} path { transition: none; }
}`,
});

/** Brings the 16–24px discs up to a 44pt touch target on native. */
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function CloseButtonComponent({
  onPress,
  size = 'xs',
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: CloseButtonProps) {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, CLOSE_BUTTON_CSS);
  const paint = useMemo(() => resolveCloseButtonPaint(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const g = CLOSE_BUTTON_GEOMETRY[size];
  const color = !disabled && (hovered || pressed) ? paint.foregroundHover : paint.foreground;

  const boxStyle: WebCssStyle = {
    width: g.box,
    height: g.box,
    borderRadius: g.box / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paint.background,
    '--bloom-button-close-ring': paint.ring,
  };

  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomButtonClose: '' } } as Record<string, unknown>) : {})}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      hitSlop={HIT_SLOP}
      style={[boxStyle, style]}
      testID={testID}
    >
      <Svg width={g.glyph} height={g.glyph} viewBox={`0 0 ${g.glyph} ${g.glyph}`} fill="none">
        <Path
          d={`M${g.inset} ${g.inset}L${g.glyph - g.inset} ${g.glyph - g.inset}`}
          stroke={color}
          strokeWidth={g.stroke}
          strokeLinecap="round"
        />
        <Path
          d={`M${g.glyph - g.inset} ${g.inset}L${g.inset} ${g.glyph - g.inset}`}
          stroke={color}
          strokeWidth={g.stroke}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

export const CloseButton = memo(CloseButtonComponent);
CloseButton.displayName = 'CloseButton';
