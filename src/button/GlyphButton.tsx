import React, { forwardRef, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  BUTTON_TRANSITION_MS,
  GLYPH_BUTTON_SIZE,
  glyphButtonGlyphSize,
  resolveGlyphButtonPaint,
} from './shared';
import type { GlyphButtonProps } from './types';

/**
 * `GlyphButton`: the round glyph-only control at an ARBITRARY size.
 *
 *              off                      on (`pressed`)
 *   rest       `color` / textSecondary   `activeColor` / accent
 *   hover      `hoverColor` / text       `activeHoverColor` / `activeColor`
 *   fill       `fill` / none             the same
 *   hover fill `hoverFill` / neutral wash
 *   disabled   `aria-disabled`, no press, dimmed to `disabledOpacity` (0.5)
 *
 * Colour change only, no scale, 150ms. Focus is a 2px ring at a 2px offset,
 * `:focus-visible` so a mouse press leaves none behind; `ring` is a PROP because
 * these sit on surfaces Bloom does not own (artwork, a player bar) where the
 * accent ring disappears.
 *
 * Why this and not `Button`:
 *
 * - `Button iconOnly`'s heights are FIXED at 24 / 32 / 36 / 44, and the families
 *   that need 28, 40 or 44 cannot get there.
 * - `variant="icon"` paints `secondary`'s card surface and border, and
 *   `variant="ghost"` paints an ACCENT wash — neither is the neutral,
 *   transparent ⋯ / × / shuffle affordance.
 *
 * Five families shipped their own before this existed (`track-list`,
 * `queue-panel`, `media-player`, `media-header`, `music-library`); each of them
 * now calls this and keeps its own measured size and colours through the props.
 *
 * The glyph is 0.6 × the box by default ({@link glyphButtonGlyphSize}); pass
 * `glyphSize` to pin a call site's own ratio. `icon` is sized AND painted here
 * so the colour follows the state; `children` is rendered as-is for a glyph the
 * caller paints (a text glyph, a two-tone icon).
 */

const IS_WEB = Platform.OS === 'web';
const STYLE_ID = 'bloom-glyph-button-web-css';
const SELECTOR = '[data-bloom-glyph-button]';

const GLYPH_BUTTON_CSS = interactiveWebCss({
  selector: SELECTOR,
  varPrefix: 'bloom-glyph-button',
  base: `
    flex-shrink: 0;
    padding: 0;
    border: 0;
    position: relative;
  `,
  transition: `background-color ${BUTTON_TRANSITION_MS}ms ease`,
  // Fills and glyph colours are resolved in JS and arrive as inline style, which
  // the transition above still animates. The hover RULE therefore changes
  // nothing: what it must NOT do is re-declare the background, since an inline
  // value outranks it and the rule would be dead anyway.
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 2,
  // `interactiveWebCss` dims a disabled control to 0.5 for the raw-DOM forks.
  // This one carries its own `disabledOpacity` inline so NATIVE dims too, and
  // two opacities multiply — so the sheet's is neutralised here rather than
  // silently squaring to 0.25.
  extraRules: `${SELECTOR}[aria-disabled="true"] {
  opacity: 1;
  cursor: default;
}
@media (prefers-reduced-motion: reduce) {
${SELECTOR} { transition: none; }
}`,
});

function GlyphButtonComponent(
  {
    size = GLYPH_BUTTON_SIZE,
    glyphSize,
    icon: Icon,
    children,
    onPress,
    onLongPress,
    disabled = false,
    pressed,
    color,
    hoverColor,
    activeColor,
    activeHoverColor,
    fill,
    hoverFill,
    ring,
    disabledOpacity = 0.5,
    grow = false,
    paddingHorizontal = 6,
    decoration,
    accessibilityLabel,
    accessibilityHint,
    style,
    testID,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
  }: GlyphButtonProps,
  ref: React.Ref<View>,
) {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, GLYPH_BUTTON_CSS);
  const paint = useMemo(() => resolveGlyphButtonPaint(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: held, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const glyph = glyphSize ?? glyphButtonGlyphSize(size);
  const active = !disabled && (hovered || held);
  const isToggle = pressed !== undefined;

  const foreground = pressed
    ? active
      ? (activeHoverColor ?? activeColor ?? paint.activeColor)
      : (activeColor ?? paint.activeColor)
    : active
      ? (hoverColor ?? paint.hoverColor)
      : (color ?? paint.color);
  const background = active ? (hoverFill ?? paint.hoverFill) : (fill ?? paint.fill);

  const rootStyle: WebCssStyle = {
    ...(grow
      ? { minWidth: size, paddingLeft: paddingHorizontal, paddingRight: paddingHorizontal }
      : { width: size }),
    height: size,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: background,
    opacity: disabled ? disabledOpacity : 1,
    '--bloom-glyph-button-ring': ring ?? paint.ring,
  };

  return (
    <Pressable
      ref={ref}
      {...(IS_WEB ? ({ dataSet: { bloomGlyphButton: '' } } as Record<string, unknown>) : {})}
      role="button"
      accessibilityLabel={accessibilityLabel || undefined}
      accessibilityHint={accessibilityHint}
      // BOTH spellings of the toggle state: react-native-web drops
      // `accessibilityState` and React Native has no `aria-pressed`.
      {...(isToggle ? { 'aria-pressed': pressed } : null)}
      accessibilityState={{ disabled, ...(isToggle ? { selected: pressed } : null) }}
      aria-disabled={disabled || undefined}
      aria-expanded={ariaExpanded}
      {...(ariaHasPopup == null ? {} : { 'aria-haspopup': ariaHasPopup })}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {typeof children === 'function'
          ? children(foreground)
          : (children ?? (Icon ? <Icon width={glyph} height={glyph} fill={foreground} /> : null))}
      </View>
      {decoration}
    </Pressable>
  );
}

export const GlyphButton = forwardRef(GlyphButtonComponent);
GlyphButton.displayName = 'GlyphButton';
